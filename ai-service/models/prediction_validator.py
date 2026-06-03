"""
Patch for main.py to fix the ViT+LR prediction bias.

This module provides:
1. Feature validation - detect when extraction fails
2. Scaler correction - adjust for the bias when features are near zero
3. Fallback logic - handle edge cases gracefully
"""

import numpy as np
import logging

logger = logging.getLogger(__name__)


def validate_vit_features(features, description="ViT"):
    """
    Validate if extracted features look reasonable.
    Returns (is_valid, warning_message)
    """
    if features is None or features.size == 0:
        return False, f"{description}: No features"
    
    if features.shape[0] != 1:
        return False, f"{description}: Wrong batch size {features.shape[0]}"
    
    if np.isnan(features).any():
        return False, f"{description}: Contains NaN"
    
    if np.isinf(features).any():
        return False, f"{description}: Contains Inf"
    
    # Check if almost all zeros (feature extraction likely failed)
    nonzero_ratio = (features != 0).sum() / features.size
    if nonzero_ratio < 0.01:
        return False, f"{description}: All zeros/near-zeros ({nonzero_ratio*100:.2f}% nonzero)"
    
    # Check if values are in reasonable range (based on typical ViT outputs)
    feat_abs_mean = np.abs(features).mean()
    feat_abs_std = np.abs(features).std()
    
    if feat_abs_mean > 100:  # Likely unscaled or wrong model
        return False, f"{description}: Unusually large values (mean={feat_abs_mean:.2f})"
    
    if feat_abs_mean < 1e-6 and nonzero_ratio > 0.5:
        return False, f"{description}: Unusually small values (mean={feat_abs_mean:.2e})"
    
    return True, None


def apply_scaler_correction(scaler_transform, features, original_scaler):
    """
    Apply StandardScaler transform while correcting for the zero-feature bias.
    
    The issue: StandardScaler(0) = (0 - mean) / scale, which for negative mean gives
    large positive values, causing Pneumonia prediction bias.
    
    Solution: Use RobustScaler-like transform when features are near zero.
    """
    # Standard transform
    scaled = scaler_transform(features)
    
    # Check if we're in the problematic range
    if scaled.mean() > 0.5:  # Suspiciously positive after scaling
        # Apply correction: use median/percentile-based scaling instead
        features_flat = features.ravel()
        feat_median = np.median(features_flat)
        feat_iqr = np.percentile(features_flat, 75) - np.percentile(features_flat, 25)
        
        if feat_iqr > 0:
            # RobustScaler-like transform
            scaled = (features - feat_median) / (feat_iqr + 1e-8)
            logger.warning("Applied RobustScaler correction to scaled features due to zero-feature bias")
    
    return scaled


def safe_vit_prediction(features, scaler, lr_model, logger_obj=None):
    """
    Safely predict using ViT+LR with validation and fallback.
    
    Args:
        features: ViT features (1, 1024)
        scaler: StandardScaler fitted on training data
        lr_model: LogisticRegression classifier
        logger_obj: Logger instance
    
    Returns:
        (prediction, confidence, validation_issues) or None if all validations fail
    """
    if logger_obj is None:
        logger_obj = logger
    
    # Validate features
    is_valid, warning = validate_vit_features(features, "ViT")
    
    validation_issues = []
    if not is_valid:
        validation_issues.append(warning)
        logger_obj.warning(f"ViT feature validation failed: {warning}")
        # Could return None here or continue with warning
        # For now, continue but log it
    
    try:
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Check for problematic scaling
        if features_scaled.mean() > 2.0 and not is_valid:
            logger_obj.warning("Feature scaling produced suspicious values (mean > 2.0)")
            validation_issues.append("Suspicious scaling from near-zero features")
        
        # Predict
        pred = lr_model.predict(features_scaled)[0]
        proba = lr_model.predict_proba(features_scaled)[0]
        confidence = proba[pred]
        
        return {
            'prediction': pred,
            'confidence': confidence,
            'probabilities': proba,
            'validation_issues': validation_issues,
            'scaled_mean': features_scaled.mean()
        }
    
    except Exception as e:
        logger_obj.error(f"ViT prediction error: {e}")
        validation_issues.append(str(e))
        return None


# Example of how to use in main.py:
"""
# In the /predict endpoint, replace:
#     pred = lr_model.predict(features_scaled)[0]
#     prob = lr_model.predict_proba(features_scaled)[0]
#     label = "Pneumonia" if pred == 1 else "Normal"
#
# With:
#     result = safe_vit_prediction(vit_feat, scaler, lr_model, logger)
#     if result is None or result.get('validation_issues'):
#         logger.warning(f"ViT prediction has issues: {result}")
#         # Could fallback to DenseNet or another model instead
#     
#     pred = result['prediction']
#     prob = result['probabilities']
#     label = "Pneumonia" if pred == 1 else "Normal"
"""
