import numpy as np
import tensorflow as tf
import cv2
from PIL import Image
import base64
from io import BytesIO
import logging
import traceback


def base64_to_pil(img_base64):
    image_data = base64.b64decode(img_base64)
    image = Image.open(BytesIO(image_data)).convert("RGB")
    return image

# =========================================================
# PREPROCESS
# =========================================================

def preprocess_xray(image, target_size=(224, 224)):

    image = image.resize(target_size)

    image = np.array(image).astype("float32") / 255.0

    image = np.expand_dims(image, axis=0)

    return image


def get_last_conv_layer_name(model):
    # Try multiple heuristics to find a conv feature map layer
    # 1) reverse iterate and pick first layer with output_shape length >=4
    for layer in reversed(model.layers):
        try:
            shape = layer.output_shape
        except Exception:
            shape = None

        if shape is None:
            continue

        # If layer.output_shape is a list (multiple outputs), pick the first
        if isinstance(shape, (list, tuple)) and len(shape) > 0:
            if isinstance(shape[0], (list, tuple)):
                shape = shape[0]
            # else: shape is already a single shape tuple like (None, H, W, C)

        try:
            if isinstance(shape, (list, tuple)) and len(shape) >= 4:
                return layer.name
        except Exception:
            continue

    # 2) fallback: look for layer names that commonly indicate conv blocks
    for layer in reversed(model.layers):
        name = getattr(layer, 'name', '')
        if any(k in name.lower() for k in ('conv', 'conv5', 'block', 'concat', 'conv_block')):
            return name

    # 3) final fallback: return the last layer that has an output attribute
    for layer in reversed(model.layers):
        if hasattr(layer, 'output_shape'):
            return getattr(layer, 'name', None)

    return None


def predict_with_gradcam(model, image, last_conv_layer_name=None, alpha=0.3):
    """Generate prediction, heatmap and superimposed image.
    `image` can be a PIL.Image or numpy array (H,W,3).
    Returns dict with keys: prediction, label, confidence, heatmap (2D float), superimposed (uint8 numpy BGR/RGB depending on cv2).
    """
    logger = logging.getLogger(__name__)
    logger.info("[predict_with_gradcam] Starting...")
    
    # Normalize input image and KEEP original for high-quality overlay
    if isinstance(image, np.ndarray):
        print(f"[predict_with_gradcam] Input is numpy array, shape: {image.shape}")
        pil_orig = Image.fromarray(image)
    else:
        print(f"[predict_with_gradcam] Input is PIL Image, size: {image.size}")
        pil_orig = image

    # Keep HIGH-QUALITY original for overlay (don't resize)
    original_for_overlay = np.array(pil_orig)
    
    # prepare input tensor - resize to 224x224 for model
    logger.info("[predict_with_gradcam] Resizing to 224x224 for model input...")
    input_img = pil_orig.resize((224, 224))
    img_array = np.array(input_img).astype("float32") / 255.0
    input_tensor = np.expand_dims(img_array, axis=0)
    print(f"[predict_with_gradcam] Input tensor shape: {input_tensor.shape}")

    # predict
    logger.info("[predict_with_gradcam] Running model prediction...")
    try:
        preds = model.predict(input_tensor, verbose=0)
        logger.info(f"[predict_with_gradcam] Predictions shape: {preds.shape}")
        pred_class = int(np.argmax(preds[0]))
        confidence = float(np.max(preds[0]))
        logger.info(f"[predict_with_gradcam] Pred class: {pred_class}, Confidence: {confidence}")
    except Exception as e:
        logger.exception("Model prediction failed")
        # Fall back to safe defaults
        preds = None
        pred_class = 0
        confidence = 0.0

    # determine conv layer
    if last_conv_layer_name is None:
        # Try to auto-detect a sensible conv layer name from the model
        detected = get_last_conv_layer_name(model)
        if detected:
            last_conv_layer_name = detected
            print(f"[predict_with_gradcam] Auto-detected last conv layer: {last_conv_layer_name}")
        else:
            # Fallback to the Kaggle notebook's explicit layer selection
            last_conv_layer_name = "conv5_block16_concat"
            print(f"[predict_with_gradcam] Falling back to notebook layer: {last_conv_layer_name}")

    # compute heatmap using class method, try multiple fallbacks
    try:
        logger.info("[predict_with_gradcam] Computing GradCAM heatmap...")
        heatmap = GradCAM.make_gradcam_heatmap(input_tensor, model, last_conv_layer_name)
        logger.info(f"[predict_with_gradcam] Heatmap shape: {getattr(heatmap, 'shape', None)}")
    except Exception as e:
        logger.warning(f"initial GradCAM failed: {e}")
        # Try candidate layer names from model
        tried = []
        heatmap = None
        layer_names = [
            last_conv_layer_name,
        ]
        # collect layers that look like conv blocks
        for l in model.layers:
            name = getattr(l, 'name', '')
            if 'conv5' in name.lower() or 'conv' in name.lower() or 'block' in name.lower() or 'concat' in name.lower():
                layer_names.append(name)

        # unique and try
        for name in [n for n in dict.fromkeys(layer_names) if n]:
            tried.append(name)
            try:
                print(f"[predict_with_gradcam] Trying layer: {name}")
                heatmap = GradCAM.make_gradcam_heatmap(input_tensor, model, name)
                print(f"[predict_with_gradcam] Success with layer: {name}")
                break
            except Exception as e2:
                print(f"[predict_with_gradcam] Layer {name} failed: {e2}")
                continue

        if heatmap is None:
            err_msg = f"GradCAM failed for layers tried: {tried}"
            logger.error(err_msg)
            # Continue to fallback overlay generation below instead of returning error
            heatmap = None

    # superimpose - High Resolution Overlay
    # Try to build superimposed at original resolution.
    superimposed = None
    try:
        logger.info("[predict_with_gradcam] Creating full-resolution superimposed image...")
        # Get original dimensions
        orig_w, orig_h = pil_orig.size
        
        # Use the new full-resolution implementation
        superimposed = GradCAM(model, last_conv_layer_name).superimpose_heatmap_fullres(
            pil_orig, heatmap, original_width=orig_w, original_height=orig_h, alpha=alpha
        )
        logger.info(f"[predict_with_gradcam] Superimposed full-res shape: {getattr(superimposed, 'shape', None)}")
    except Exception as e:
        logger.exception("superimpose_heatmap_fullres failed, trying 224x224 fallback")
        try:
            superimposed = GradCAM(model, last_conv_layer_name).superimpose_heatmap(
                pil_orig, heatmap, alpha=alpha
            )
        except Exception as e2:
            logger.exception("Kaggle-style fallback also failed")

    # Fallback: if superimposed is None, create a simple overlay using edge map or uniform heatmap
    if superimposed is None:
        try:
            logger.info("[predict_with_gradcam] Creating robust fallback overlay")
            # Use original size for better fallback quality if possible
            orig_w, orig_h = pil_orig.size
            base_np = np.array(pil_orig).astype('float32') / 255.0

            if heatmap is None:
                # Create an edge-based pseudo-heatmap
                gray = cv2.cvtColor((base_np * 255).astype('uint8'), cv2.COLOR_RGB2GRAY)
                edges = cv2.Canny(gray, 50, 150)
                hm = cv2.GaussianBlur(edges.astype('float32'), (9, 9), 0)
                if hm.max() > 0:
                    hm = hm / (hm.max()+1e-8)
                else:
                    hm = np.zeros_like(hm)
            else:
                # Resize heatmap to original size
                hm = cv2.resize(heatmap, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
                hm = np.nan_to_num(hm, nan=0.0, posinf=1.0, neginf=0.0)
                if hm.max() > 0:
                    hm = hm / (hm.max()+1e-8)
                else:
                    hm = np.zeros_like(hm)

            hm_uint8 = np.uint8(255 * np.clip(hm, 0.0, 1.0))
            hm_colored = cv2.applyColorMap(hm_uint8, cv2.COLORMAP_JET)
            img_display = (base_np - base_np.min())
            img_display = img_display / (img_display.max() + 1e-7)
            superimposed = cv2.addWeighted((img_display * 255).astype(np.uint8), 0.7, hm_colored, 0.3, 0)
            logger.info("[predict_with_gradcam] Robust fallback overlay created")
        except Exception:
            logger.exception("Robust fallback overlay creation also failed")
            # As a last resort, return the original resized image as uint8
            try:
                superimposed = np.array(pil_orig.resize((224, 224))).astype('uint8')
            except Exception:
                superimposed = None

    result = {
        "prediction": pred_class,
        "label": ("Pneumonia" if pred_class == 1 else "Normal"),
        "confidence": confidence,
        "heatmap": heatmap,
        "superimposed": superimposed
    }
    print("[predict_with_gradcam] Complete! Returning result.")
    return result


# =========================================================
# GRADCAM CLASS
# =========================================================

class GradCAM:

    def __init__(self, model, last_conv_layer_name=None):

        self.model = model

        if last_conv_layer_name is None:

            for layer in reversed(model.layers):
                try:
                    shape = layer.output_shape
                    if shape is None:
                        continue
                    # Handle multiple outputs: shape might be tuple of tuples
                    if isinstance(shape, (list, tuple)) and len(shape) > 0:
                        if isinstance(shape[0], (list, tuple)):
                            shape = shape[0]
                    # Check if it's a 4D tensor (batch, height, width, channels)
                    if isinstance(shape, (list, tuple)) and len(shape) == 4:
                        last_conv_layer_name = layer.name
                        break
                except Exception:
                    continue

        self.last_conv_layer_name = last_conv_layer_name

        print(f"✅ GradCAM using layer: {self.last_conv_layer_name}")

    # =====================================================
    # HEATMAP
    # =====================================================

    @staticmethod
    def make_gradcam_heatmap(img_array, model, last_conv_layer_name="conv5_block16_concat"):
        """
        Exact implementation matching Kaggle notebook.
        Uses basic Grad-CAM formula with global average pooling of gradients.
        """
        try:
            inputs = model.inputs if isinstance(model.inputs, list) else [model.inputs]

            grad_model = tf.keras.models.Model(
                inputs,
                [model.get_layer(last_conv_layer_name).output, model.output]
            )

            with tf.GradientTape() as tape:
                if isinstance(img_array, list):
                    conv_outputs, predictions = grad_model(img_array)
                else:
                    conv_outputs, predictions = grad_model([img_array])

                if isinstance(predictions, list):
                    predictions = tf.convert_to_tensor(predictions)

                predictions = tf.reshape(predictions, (tf.shape(predictions)[0], -1))

                # Select the predicted class explicitly to produce more stable maps.
                pred_index = int(np.argmax(predictions[0].numpy().reshape(-1)))
                class_channel = predictions[:, pred_index]

            # Get gradients - this is the key difference from GradCAM++
            grads = tape.gradient(class_channel, conv_outputs)
            
            # Global average pooling of gradients (basic Grad-CAM method)
            # This is exactly what the Kaggle notebook does
            conv_outputs = conv_outputs[0]  # Remove batch dimension: (H, W, C)
            grads = grads[0]
            pooled_grads = tf.reduce_mean(grads, axis=(0, 1))  # Average over spatial dims (H, W)
            
            # Weighted sum of feature maps
            heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]  # (H, W, C) @ (C, 1) = (H, W)
            heatmap = tf.squeeze(heatmap)
            
            # ReLU to keep only positive activations
            heatmap = tf.maximum(heatmap, 0)
            
            # Normalize to 0-1
            heatmap = heatmap / (tf.math.reduce_max(heatmap) + 1e-8)
            
            return heatmap.numpy()
        except Exception as e:
            print(f"[ERROR] make_gradcam_heatmap failed with layer {last_conv_layer_name}: {e}")
            import traceback
            traceback.print_exc()
            raise
    # SUPERIMPOSE
    # =====================================================

    def superimpose_heatmap_highres(
        self,
        original_image_array,
        heatmap,
        alpha=0.4
    ):
        """Compatibility alias for the Kaggle-style overlay.
        This now delegates to the 224x224 addWeighted implementation.
        """
        if isinstance(original_image_array, np.ndarray):
            original_image = Image.fromarray(original_image_array)
        else:
            original_image = original_image_array

        return self.superimpose_heatmap(original_image, heatmap, alpha=alpha)

    def superimpose_heatmap(
        self,
        original_image,
        heatmap,
        alpha=0.3
    ):
        """Kaggle-style overlay at 224x224 using cv2.addWeighted.

        Uses default blending weights matching the notebook (0.7 original, 0.3 heatmap).
        """
        original = np.array(original_image.resize((224, 224)))

        # Heatmap might be 2D or 3D - flatten if needed
        if heatmap.ndim == 3:
            heatmap = np.squeeze(heatmap)

        heatmap_resized = cv2.resize(heatmap, (224, 224), interpolation=cv2.INTER_LINEAR)
        heatmap_resized = np.nan_to_num(heatmap_resized, nan=0.0, posinf=1.0, neginf=0.0)

        # Smooth high-frequency noise while keeping salient regions.
        heatmap_smooth = cv2.GaussianBlur(heatmap_resized, (9, 9), sigmaX=0, sigmaY=0)

        # Robust normalization avoids outlier pixels dominating the colormap.
        p_low, p_high = np.percentile(heatmap_smooth, [5, 99])
        if p_high - p_low < 1e-8:
            heatmap_scaled = np.clip(heatmap_smooth, 0.0, 1.0)
        else:
            heatmap_scaled = np.clip((heatmap_smooth - p_low) / (p_high - p_low), 0.0, 1.0)

        heatmap_norm = np.uint8(255 * heatmap_scaled)

        # Apply JET colormap (but with aggressive smoothing to avoid artifacts)
        heatmap_colored = cv2.applyColorMap(
            heatmap_norm,
            cv2.COLORMAP_JET
        )
        img_display = original.astype(np.float32)
        img_display = img_display - img_display.min()
        img_display = img_display / (img_display.max() + 1e-7)

        heat_alpha = float(np.clip(alpha, 0.0, 1.0))
        # Notebook uses 0.7/0.3 blending (original/heatmap)
        superimposed = cv2.addWeighted(
            (img_display * 255).astype(np.uint8),
            1.0 - heat_alpha,
            heatmap_colored,
            heat_alpha,
            0
        )

        return superimposed

    def superimpose_heatmap_fullres(
        self,
        original_image_array,
        heatmap,
        original_width=None,
        original_height=None,
        alpha=0.3
    ):
        """Overlay heatmap at FULL ORIGINAL resolution instead of 224x224.
        
        Args:
            original_image_array: (H, W, 3) numpy array or PIL Image
            heatmap: 2D heatmap (small size, typically from conv layer output)
            original_width: Original width to resize to (if None, use image width)
            original_height: Original height to resize to (if None, use image height)
            alpha: Heatmap blend ratio (0-1)
        
        Returns:
            superimposed: numpy array at (original_height, original_width, 3)
        """
        # Convert to numpy if PIL
        if isinstance(original_image_array, Image.Image):
            original_image_array = np.array(original_image_array)
        
        # Get dimensions
        h, w = original_image_array.shape[:2]
        if original_height is None:
            original_height = h
        if original_width is None:
            original_width = w
        
        # Heatmap might be 3D - flatten to 2D
        if heatmap.ndim == 3:
            heatmap = np.squeeze(heatmap)
        
        # KEY: Resize heatmap to ORIGINAL resolution instead of 224x224
        heatmap_fullres = cv2.resize(
            heatmap, 
            (original_width, original_height),
            interpolation=cv2.INTER_CUBIC
        )
        heatmap_fullres = np.nan_to_num(
            heatmap_fullres, nan=0.0, posinf=1.0, neginf=0.0
        )
        
        # Smooth to reduce noise
        heatmap_smooth = cv2.GaussianBlur(heatmap_fullres, (9, 9), sigmaX=0, sigmaY=0)
        
        # Robust normalization
        p_low, p_high = np.percentile(heatmap_smooth, [5, 99])
        if p_high - p_low < 1e-8:
            heatmap_scaled = np.clip(heatmap_smooth, 0.0, 1.0)
        else:
            heatmap_scaled = np.clip(
                (heatmap_smooth - p_low) / (p_high - p_low), 0.0, 1.0
            )
        
        heatmap_norm = np.uint8(255 * heatmap_scaled)
        
        # Apply JET colormap
        heatmap_colored = cv2.applyColorMap(heatmap_norm, cv2.COLORMAP_JET)
        
        # Prepare original image
        img_display = original_image_array.astype(np.float32)
        img_display = img_display - img_display.min()
        img_display = img_display / (img_display.max() + 1e-7)
        
        # Blend
        heat_alpha = float(np.clip(alpha, 0.0, 1.0))
        superimposed = cv2.addWeighted(
            (img_display * 255).astype(np.uint8),
            1.0 - heat_alpha,
            heatmap_colored,
            heat_alpha,
            0
        )
        
        return superimposed


# =========================================================
# STANDALONE FUNCTIONS (for easier testing)
# =========================================================

def generate_gradcam_and_heatmap(model, images, class_index=None, layer_name=None):
    """Generate just the heatmap for a batch of images.
    
    Args:
        model: Keras model
        images: Input images batch (N, 224, 224, 3) normalized [0, 1]
        class_index: Class to generate heatmap for (if None, use argmax)
        layer_name: Conv layer to use (if None, auto-detect)
    
    Returns:
        heatmap: 2D numpy array with values [0, 1]
    """
    try:
        if class_index is None:
            preds = model.predict(images, verbose=0)
            class_index = int(np.argmax(preds[0]))
        
        if layer_name is None:
            # Auto-detect last conv layer
            for layer in reversed(model.layers):
                try:
                    if len(layer.output_shape) == 4:
                        layer_name = layer.name
                        break
                except:
                    continue
        
        if layer_name is None:
            layer_name = "conv5_block16_concat"  # Fallback for DenseNet
        
        heatmap = GradCAM.make_gradcam_heatmap(images, model, layer_name)
        return heatmap
    except Exception as e:
        print(f"[ERROR] generate_gradcam_and_heatmap failed: {e}")
        import traceback
        traceback.print_exc()
        return None


def superimpose_heatmap_fullres(original_image, heatmap, original_width=None, 
                                original_height=None, alpha=0.3, last_conv_layer_name=None):
    """Quick wrapper for full-resolution overlay.
    
    Args:
        original_image: PIL Image or numpy array
        heatmap: 2D heatmap
        original_width: Target width (auto if None)
        original_height: Target height (auto if None)
        alpha: Blend ratio
        last_conv_layer_name: Not used (for compatibility)
    
    Returns:
        superimposed: numpy array (H, W, 3) at original resolution
    """
    gcam = GradCAM(model=None, last_conv_layer_name=last_conv_layer_name)
    return gcam.superimpose_heatmap_fullres(
        original_image, heatmap, 
        original_width, original_height, alpha
    )