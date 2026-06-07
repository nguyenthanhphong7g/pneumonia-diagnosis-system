import os
import logging
import joblib
import numpy as np

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = "models/artifacts"

lr_model = None
scaler = None

def load_lr_classifier():
    """Load LR model and scaler for ViT"""
    global lr_model, scaler
    try:
        model_path = os.path.join(ARTIFACTS_DIR, "model_lr.pkl")
        scaler_path = os.path.join(ARTIFACTS_DIR, "scaler.pkl")
        if os.path.exists(model_path):
            logger.info(f"🚀 Loading LogisticRegression from 'model_lr.pkl'...")
            lr_model = joblib.load(model_path)
            logger.info(f"✅ LogisticRegression loaded successfully from {model_path}")
        else:
            logger.warning(f"⚠️  'model_lr.pkl' not found at {model_path}.")
            
        if os.path.exists(scaler_path):
            logger.info(f"🚀 Loading feature scaler from 'scaler.pkl'...")
            scaler = joblib.load(scaler_path)
            logger.info(f"✅ Scaler loaded successfully from {scaler_path}")
        else:
            logger.warning(f"⚠️  'scaler.pkl' not found at {scaler_path}.")
            
    except Exception as e:
        logger.error(f"❌ Error loading legacy LR models: {e}")

def get_lr_classifier():
    return lr_model, scaler
