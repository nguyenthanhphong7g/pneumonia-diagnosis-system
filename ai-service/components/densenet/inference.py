import os
import time
import base64
import logging
from io import BytesIO
from datetime import datetime
import numpy as np
from PIL import Image
import cv2
import keras
from tensorflow import keras as tfkeras

logger = logging.getLogger(__name__)

# DenseNet Model (lazy loader)
densenet_model = None

def get_densenet_model():
    """Lazily attempt to load and cache the DenseNet model on first use.

    Avoids startup failures when model deserialization is incompatible; callers
    should handle a None return value.
    """
    global densenet_model
    if densenet_model is not None:
        return densenet_model

    candidate_files = ["fixed_model.keras", "pneumonia_densenet169.keras", "pneumonia_densenet169.h5", "models/artifacts/fixed_model.keras", "models/artifacts/pneumonia_densenet169.keras"]
    last_exc = None
    for fname in candidate_files:
        if not os.path.exists(fname):
            logger.debug(f"DenseNet candidate missing: {fname}")
            continue
        try:
            try:
                densenet_model = keras.models.load_model(fname, compile=False)
                logger.info(f"✅ DenseNet169 loaded successfully from {fname} (keras.models.load_model)")
            except Exception as e_load:
                logger.warning(f"keras.models.load_model failed for {fname}: {e_load}")
                try:
                    densenet_model = tfkeras.models.load_model(fname, compile=False)
                    logger.info(f"✅ DenseNet169 loaded successfully from {fname} (tf.keras.models.load_model)")
                except Exception as e_tfload:
                    logger.warning(f"tf.keras.models.load_model also failed for {fname}: {e_tfload}")
                    if fname.lower().endswith('.h5'):
                        try:
                            from tensorflow.keras.applications import DenseNet169 as TF_DenseNet169
                            model_tmp = TF_DenseNet169(weights=None, classes=2, input_shape=(224,224,3))
                            model_tmp.load_weights(fname)
                            densenet_model = model_tmp
                            logger.info(f"✅ DenseNet169 architecture created and weights loaded from {fname}")
                        except Exception as e_weights:
                            logger.warning(f"Loading weights into DenseNet169 failed for {fname}: {e_weights}")
                            raise e_weights
                    else:
                        raise e_tfload

            if densenet_model is not None:
                try:
                    logger.info(f"[MODEL] DenseNet has {len(densenet_model.layers)} layers")
                except Exception:
                    logger.debug("Could not introspect model layers")
                return densenet_model
        except Exception as e:
            logger.exception(f"Failed to load DenseNet from {fname}")
            last_exc = e

    if last_exc is not None:
        logger.error(f"All DenseNet load attempts failed: {last_exc}")
    return None

def densenet_infer(image, requested_from=None):
    try:
        model = get_densenet_model()
        if model is None:
            raise RuntimeError("DenseNet model is not loaded or incompatible")
        img_np = np.array(image.resize((224, 224))).astype("float32") / 255.0
        model_start = time.perf_counter()
        preds = model.predict(np.expand_dims(img_np, axis=0), verbose=0)
        model_end = time.perf_counter()
        model_time_ms = int((model_end - model_start) * 1000)

        pred_class = int(np.argmax(preds[0]))
        confidence = float(np.max(preds[0]))
        label = "Pneumonia" if pred_class == 1 else "Normal"
        result = {
            "model": "densenet",
            "label": label,
            "confidence": confidence,
            "model_time_ms": model_time_ms,
            "probabilities": {
                "normal": float(preds[0][0]) if preds.shape[1] > 1 else float(1 - confidence),
                "pneumonia": float(preds[0][1]) if preds.shape[1] > 1 else float(confidence)
            },
            "timestamp": datetime.now().isoformat()
        }
        # Attempt to generate GradCAM image and include as base64 in response
        try:
            from components.gradcam.gradcam_utils import predict_with_gradcam
            gradcam_start = time.perf_counter()
            gc = predict_with_gradcam(model, image)
            gradcam_end = time.perf_counter()
            gradcam_time_ms = int((gradcam_end - gradcam_start) * 1000)
            result["gradcam_time_ms"] = gradcam_time_ms
            if gc is not None and gc.get("superimposed") is not None:
                # Convert BGR (cv2 format) to RGB (PIL format) to fix color swap
                superimposed_rgb = cv2.cvtColor(gc.get("superimposed"), cv2.COLOR_BGR2RGB)
                pil = Image.fromarray(superimposed_rgb)
                buf = BytesIO()
                pil.save(buf, format="PNG")
                b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
                result["gradcam_base64"] = b64
        except Exception as e:
            logger.warning(f"GradCAM generation failed: {e}")
        
        if requested_from:
            result["fallback_from"] = requested_from
            
        return result
    except Exception as e:
        logger.error(f"DenseNet prediction failed: {e}")
        return None
