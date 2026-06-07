import os
import time
import base64
import logging
from io import BytesIO
from datetime import datetime
import numpy as np
import joblib
from PIL import Image
import cv2

logger = logging.getLogger(__name__)

vgg16_base_model = None
vgg16_lr_model = None

def get_vgg16_model():
    """Load VGG16 base (ImageNet pretrained) and LR classifier."""
    global vgg16_base_model, vgg16_lr_model
    try:
        if vgg16_base_model is None:
            from tensorflow.keras.applications import VGG16
            vgg16_base_model = VGG16(weights="imagenet", include_top=False, input_shape=(128, 128, 3))
            logger.info("[MODEL] VGG16 base loaded (ImageNet pretrained)")
        
        if vgg16_lr_model is None:
            lr_path = "models_kaggle/vgg16_lr.pkl"
            if not os.path.exists(lr_path):
                lr_path = "models/vgg16_lr.pkl"
            vgg16_lr_model = joblib.load(lr_path)
            logger.info(f"✅ VGG16 LogisticRegression loaded successfully from {lr_path}")
            
        return vgg16_base_model, vgg16_lr_model
    except Exception as e:
        logger.exception("Failed to load VGG16 models: %s", e)
        return None, None

def vgg16_infer(image, requested_from=None):
    base_model, lr_model = get_vgg16_model()
    if base_model is None or lr_model is None:
        logger.error("VGG16 model unavailable for inference")
        return None
    try:
        logger.info("🚀 Running VGG16 inference...")
        img_np = np.array(image.resize((128, 128))).astype("float32")
        img_np = np.stack((img_np,) * 3, axis=-1) if len(img_np.shape) == 2 else img_np
        img_batch = np.expand_dims(img_np, axis=0)

        # 1. Trích xuất đặc trưng với VGG16 base
        start_feat = time.perf_counter()
        features = base_model.predict(img_batch, verbose=0)
        features_flat = features.reshape((1, -1))
        feat_time = int((time.perf_counter() - start_feat) * 1000)

        # 2. Phân loại với Logistic Regression
        start_cls = time.perf_counter()
        preds = lr_model.predict(features_flat)
        probs = lr_model.predict_proba(features_flat)
        cls_time = int((time.perf_counter() - start_cls) * 1000)

        pred_class = int(preds[0])
        confidence = float(np.max(probs[0]))
        label = "Pneumonia" if pred_class == 1 else "Normal"
        
        result = {
            "model": "vgg16",
            "label": label,
            "confidence": confidence,
            "model_time_ms": feat_time + cls_time,
            "probabilities": {
                "normal": float(probs[0][0]),
                "pneumonia": float(probs[0][1])
            },
            "timestamp": datetime.now().isoformat()
        }
        if requested_from:
            result["fallback_from"] = requested_from
            
        # Attach DenseNet Grad‑CAM for visual consistency
        try:
            from components.densenet.inference import get_densenet_model
            densenet = get_densenet_model()
            if densenet is not None:
                from components.gradcam.gradcam_utils import predict_with_gradcam
                gc = predict_with_gradcam(densenet, image)
                if gc is not None and gc.get("superimposed") is not None:
                    superimposed_rgb = cv2.cvtColor(gc.get("superimposed"), cv2.COLOR_BGR2RGB)
                    pil = Image.fromarray(superimposed_rgb)
                    buf = BytesIO()
                    pil.save(buf, format="PNG")
                    result["gradcam_base64"] = base64.b64encode(buf.getvalue()).decode("utf-8")
        except Exception as e:
            logger.warning(f"GradCAM generation for VGG16 fallback failed: {e}")
        return result
    except Exception as e:
        logger.error(f"VGG16 prediction failed: {e}")
        return None
