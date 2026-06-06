from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import sys
import os
import socket
from datetime import datetime
from io import BytesIO
import base64
import io
from urllib.request import urlopen
from urllib.error import URLError, HTTPError

# =========================================================
# LOGGING SETUP (MUST BE FIRST)
# =========================================================
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ai-service")

# =========================================================
# NUMPY & TENSORFLOW FIX
# =========================================================
import numpy.core
import numpy.core._multiarray_umath
import numpy.core.multiarray
import numpy.core.numeric
sys.modules.setdefault("numpy._core", numpy.core)
sys.modules.setdefault("numpy._core._multiarray_umath", numpy.core._multiarray_umath)
sys.modules.setdefault("numpy._core.multiarray", numpy.core.multiarray)
sys.modules.setdefault("numpy._core.numeric", numpy.core.numeric)

# =========================================================
# LIBRARY IMPORTS WITH GRACEFUL FALLBACK
# =========================================================
try:
    from PIL import Image
    logger.info("✅ PIL loaded successfully")
except ImportError as e:
    logger.error(f"❌ Failed to load PIL: {e}")
    sys.exit(1)

try:
    import numpy as np
    logger.info("✅ NumPy loaded successfully")
except ImportError as e:
    logger.error(f"❌ Failed to load NumPy: {e}")
    sys.exit(1)

try:
    import tensorflow as tf
    import keras
    logger.info("✅ TensorFlow/Keras loaded successfully")
except ImportError as e:
    logger.error(f"❌ Failed to load TensorFlow/Keras: {e}")
    logger.error("   Install with: pip install tensorflow>=2.13.0")
    sys.exit(1)

try:
    import joblib
    logger.info("✅ Joblib loaded successfully")
except ImportError as e:
    logger.error(f"❌ Failed to load Joblib: {e}")
    sys.exit(1)

try:
    import cv2
    logger.info("✅ OpenCV loaded successfully")
except ImportError as e:
    logger.error(f"❌ Failed to load OpenCV: {e}")
    sys.exit(1)

from pydantic import BaseModel
import time

# =========================================================
# APP MODULES - MUST HAVE WITH ERROR HANDLING
# =========================================================
logger.info("Loading GradCAM utility...")
try:
    from gradcam_utils import predict_with_gradcam
    logger.info("✅ GradCAM utils loaded")
except Exception as e:
    logger.error(f"❌ Failed to load gradcam_utils: {e}")
    predict_with_gradcam = None

logger.info("Loading feature extractors...")
try:
    from models.extractors import (
        extract_vit_from_pil,
        extract_wst_from_pil,
        extract_radiomics_stats_from_pil
    )
    logger.info("✅ Feature extractors loaded")
except Exception as e:
    logger.error(f"❌ Failed to load feature extractors: {e}")
    logger.error("   This may cause /predict endpoint to fail")
    extract_vit_from_pil = None
    extract_wst_from_pil = None
    extract_radiomics_stats_from_pil = None

logger.info("Loading Fusion API...")
try:
    from models import fusion_api
    logger.info("✅ Fusion API loaded")
except Exception as e:
    logger.error(f"❌ Failed to load fusion_api: {e}")
    logger.error("   Fusion model inference will be unavailable")
    fusion_api = None

logger.info("Loading prediction validator...")
try:
    from models.prediction_validator import validate_vit_features, safe_vit_prediction
    logger.info("✅ Prediction validator loaded")
except Exception as e:
    logger.warning(f"⚠️  Prediction validator not available: {e}")
    validate_vit_features = None
    safe_vit_prediction = None

# =========================================================
# APP
# =========================================================
app = FastAPI()

MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

async def ensure_upload_size(file: UploadFile):
    data = await file.read()
    size = len(data)
    file.file.seek(0)
    if size <= 0:
        raise HTTPException(status_code=400, detail="File ảnh không được để trống")
    if size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Kích thước file vượt quá 5 MB")
    return size

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _is_ai_service_running(port, timeout=1.5):
    """Return True when an existing AI service is already healthy on the port."""
    try:
        with urlopen(f"http://127.0.0.1:{port}/health", timeout=timeout) as response:
            return response.status < 500
    except (URLError, HTTPError, TimeoutError, OSError, ValueError):
        return False


def _is_port_available(host, port):
    """Check if a port is available for binding"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        try:
            sock.bind((host, port))
            return True
        except OSError:
            return False

# =========================================================
# LOAD MODELS WITH COMPREHENSIVE ERROR HANDLING
# =========================================================
fixed_port = int(os.getenv("PORT", "8000"))
if not _is_port_available("0.0.0.0", fixed_port) and _is_ai_service_running(fixed_port):
    logger.info(f"✅ AI Service is already running on port {fixed_port}. Reusing existing instance.")
    sys.exit(0)

logger.info("=" * 70)
logger.info("LOADING AI SERVICE MODELS")
logger.info("=" * 70)

# Keras deserialization compatibility shims (help load .keras/.h5 saved with different internal paths)
try:
    import sys as _sys
    import importlib as _importlib
    # Map keras.src.models.functional -> available keras.models.functional when possible
    try:
        _mod = _importlib.import_module('keras.models.functional')
        if _mod is not None:
            _sys.modules.setdefault('keras.src.models.functional', _mod)
    except Exception:
        try:
            import keras as _keras
            _attr = getattr(_keras.models, 'functional', None)
            if _attr is not None:
                _sys.modules.setdefault('keras.src.models.functional', _attr)
        except Exception:
            pass
    # Map saving legacy if available
    try:
        import keras as _keras
        _saving = getattr(_keras, 'saving', None)
        if _saving is not None:
            _sys.modules.setdefault('keras.src.saving.legacy', _saving)
    except Exception:
        pass
    logger.info("Applied Keras deserialization shims (best-effort)")
except Exception:
    logger.debug("Keras deserialization shims not applied")

# DenseNet candidate filenames (used for status checks and lazy loader)
DENSENET_CANDIDATES = ["models/artifacts/fixed_model.keras", "models/artifacts/pneumonia_densenet169.keras", "models/artifacts/pneumonia_densenet169.h5", "fixed_model.keras", "pneumonia_densenet169.keras", "pneumonia_densenet169.h5"]

# DenseNet Model
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

    candidate_files = ["fixed_model.keras", "pneumonia_densenet169.keras", "pneumonia_densenet169.h5"]
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
                    from tensorflow import keras as tfkeras
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

# LogisticRegression Model
lr_model = None
logger.info("🚀 Loading LogisticRegression from 'model_lr.pkl'...")
try:
    # Check models/artifacts first, then project-root for backward compatibility
    lr_path = None
    if os.path.exists("models/artifacts/model_lr.pkl"):
        lr_path = "models/artifacts/model_lr.pkl"
    elif os.path.exists("model_lr.pkl"):
        lr_path = "model_lr.pkl"
    
    if lr_path:
        lr_model = joblib.load(lr_path)
        logger.info(f"✅ LogisticRegression loaded successfully from {lr_path}")
    else:
        # Fall back to known artifact locations committed in the repo
        lr_candidates = [
            os.path.join("models", "lr_classifier_gf.pkl"),
            os.path.join("models_kaggle", "lr_classifier_gf.pkl")
        ]
        loaded = False
        for cand in lr_candidates:
            if os.path.exists(cand):
                lr_model = joblib.load(cand)
                logger.info(f"✅ LogisticRegression loaded successfully from {cand}")
                loaded = True
                break
        if not loaded:
            logger.warning("⚠️  model_lr.pkl not found and no fallback LR classifier present - ViT inference will fail")
except Exception as e:
    logger.error(f"❌ Failed to load LogisticRegression: {e}")

# Scaler (used by ViT+LR path)
scaler = None
logger.info("🚀 Loading feature scaler from 'scaler.pkl'...")
try:
    # Check models/artifacts first, then project-root for backward compatibility
    scaler_path = None
    if os.path.exists("models/artifacts/scaler.pkl"):
        scaler_path = "models/artifacts/scaler.pkl"
    elif os.path.exists("scaler.pkl"):
        scaler_path = "scaler.pkl"
    
    if scaler_path:
        scaler = joblib.load(scaler_path)
        logger.info(f"✅ Scaler loaded successfully from {scaler_path}")
    else:
        logger.warning("⚠️  scaler.pkl not found - ViT+LR path will require scaler to be present")
except Exception as e:
    logger.error(f"❌ Failed to load scaler: {e}")

# DenseNet Model (lazy loader)
densenet_model = None

def get_densenet_model():
    """Attempt to load DenseNet model on first use. Returns model or None."""
    global densenet_model
    if densenet_model is not None:
        return densenet_model

    candidate_files = ["models/artifacts/fixed_model.keras", "models/artifacts/pneumonia_densenet169.keras", "models/artifacts/pneumonia_densenet169.h5", "fixed_model.keras", "pneumonia_densenet169.keras", "pneumonia_densenet169.h5"]
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
                    from tensorflow import keras as tfkeras
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

# =========================================================
# VGG16 model loading (placeholder – no Grad‑CAM)
# =========================================================
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
    """Run inference with VGG16 (feature extraction + LR) – **no Grad‑CAM**.
    Returns a dict compatible with the existing response format.
    """
    base_model, lr_model = get_vgg16_model()
    if base_model is None or lr_model is None:
        logger.error("VGG16 model unavailable for inference")
        return None
    try:
        logger.info("🚀 Running VGG16 inference...")
        # 1. Trích xuất đặc trưng với VGG16 base
        img_np = np.array(image.resize((128, 128))).astype("float32")
        img_np = np.stack((img_np,) * 3, axis=-1) if len(img_np.shape) == 2 else img_np
        
        start = time.perf_counter()
        
        # Predict features
        features = base_model.predict(np.expand_dims(img_np, axis=0), verbose=0)
        features_flattened = features.reshape(1, -1)
        
        # 2. Phân loại với Logistic Regression
        pred = lr_model.predict(features_flattened)[0]
        prob = lr_model.predict_proba(features_flattened)[0]
        
        inference_ms = int((time.perf_counter() - start) * 1000)
        
        label = "Pneumonia" if int(pred) == 1 else "Normal"
        confidence = float(np.max(prob))
        
        result = {
            "model": "vgg16",
            "label": label,
            "confidence": confidence,
            "probabilities": {
                "normal": float(prob[0]),
                "pneumonia": float(prob[1])
            },
            "runtime_ms": inference_ms
        }
        if requested_from:
            result["fallback_from"] = requested_from
            
        # Attach DenseNet Grad‑CAM for visual consistency
        try:
            densenet = get_densenet_model()
            if densenet is not None:
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
# =========================================================
class GradcamRequest(BaseModel):
    image: str

# =========================================================
# HELPERS
# =========================================================
def base64_to_pil(img_base64):
    image_data = base64.b64decode(img_base64.split(",")[-1])
    return Image.open(BytesIO(image_data)).convert("RGB")

def extract_features(image):
    return extract_vit_from_pil(image)


# =========================================================
# DenseNet top-level inference helper (reusable by endpoints)
# =========================================================
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
            from gradcam_utils import predict_with_gradcam
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
            logger.warning(f"GradCAM generation failed inside densenet_infer: {e}")
            result["gradcam_time_ms"] = 0
        if requested_from:
            result["fallback_from"] = requested_from
        result["inference_time_ms"] = result.get("model_time_ms", 0) + result.get("gradcam_time_ms", 0)
        result["timings_ms"] = {
            "model_time_ms": result.get("model_time_ms", 0),
            "gradcam_time_ms": result.get("gradcam_time_ms", 0),
        }
        return result
    except Exception as e:
        logger.error(f"DenseNet prediction failed: {e}")
        return None

# =========================================================
# HOME
# =========================================================
@app.get("/")
def home():
    return {"message": "AI Service Running 🚀"}


# =========================================================
# MODELS API
# =========================================================
@app.get("/models")
def get_models():
    """Return the available inference models for the UI dropdown."""
    models = [
        {
            "model_id": "gated_fusion",
            "name": "Gated Fusion",
            "version": "v1.0",
            "description": "Deprecated: broken classifier; use DenseNet instead",
            "status": "disabled",
            "metrics": {"precision": 0.0, "recall": 0.0, "f1": 0.0, "auc": 0.0},
            "runtime_ms": 0,
        },
        {
            "model_id": "vit",
            "name": "ViT + LogisticRegression",
            "version": "v1.0",
            "description": "Deprecated: broken classifier; kept only for compatibility",
            "status": "disabled",
            "metrics": {"precision": 0.0, "recall": 0.0, "f1": 0.0, "auc": 0.0},
            "runtime_ms": 0,
        },
        # {
        #     "model_id": "densenet",
        #     "name": "DenseNet169",
        #     "version": "v1.0",
        #     "description": "DenseNet baseline with Grad-CAM support",
        #     "status": "ready",
        #     "metrics": {"precision": 0.0, "recall": 0.0, "f1": 0.0, "auc": 0.0},
        #     "runtime_ms": 0,
        # },
        {
            "model_id": "vgg16",
            "name": "VGG16 Base + LogisticRegression",
            "version": "v1.0",
            "description": "Mô hình VGG16 (Grad-CAM fallback từ DenseNet)",
            "status": "ready",
            "metrics": {"precision": 0.0, "recall": 0.0, "f1": 0.0, "auc": 0.0},
            "runtime_ms": 0,
        },
    ]
    return {"models": models}

# =========================================================
# PREDICT API
# =========================================================
@app.post("/predict")
async def predict(file: UploadFile = File(...), model: str | None = Form(None)):
    # Start timer for total request processing
    start_time = time.perf_counter()

    # Per-model timings (ms)
    timings = {}

    # Validate upload size
    await ensure_upload_size(file)

    # Load image
    image = Image.open(file.file).convert("RGB")

    # Prefer model selected by the user; fall back to environment configuration.
    preferred = (model or os.getenv("PREFERRED_MODEL", "vgg16")).lower().strip()

    # Pre-extract features (used by gated_fusion and vit paths). Failures are non-fatal.
    vit_feat = wst_feat = rad_feat = sta_feat = None
    try:
        vit_feat = extract_vit_from_pil(image)
        wst_feat = extract_wst_from_pil(image)
        rad_feat, sta_feat = extract_radiomics_stats_from_pil(image)
    except Exception as e:
        logger.debug(f"Feature pre-extraction warning: {e}")

    # Helper: attempt gated fusion path
    def try_gated_fusion(vit_feat, wst_feat, rad_feat, sta_feat):
        try:
            if fusion_api and getattr(fusion_api, 'FUSION_MANAGER', None) is not None:
                mgr = fusion_api.FUSION_MANAGER
                if getattr(mgr, 'gated_fusion', None) is not None and getattr(mgr, 'classifier_gf', None) is not None:
                    preds, probs = mgr.predict_gf(vit_feat, wst_feat, rad_feat, sta_feat)
                    label = "Pneumonia" if int(preds[0]) == 1 else "Normal"
                    try:
                        confidence = float(np.max(probs))
                    except Exception:
                        confidence = None
                    return {
                        "model": "gated_fusion",
                        "label": label,
                        "confidence": confidence,
                        "predictions": preds.tolist(),
                        "probabilities": {"normal": probs[:, 0].tolist(), "pneumonia": probs[:, 1].tolist()},
                        "timestamp": datetime.now().isoformat()
                    }
        except Exception as e:
            logger.warning(f"Gated fusion prediction failed: {e}")
        return None

    # Helper: attempt ViT + LR path
    def try_vit_lr(image):
        try:
            features = extract_features(image)
            
            # Validate features before proceeding
            if validate_vit_features is not None:
                is_valid, warning = validate_vit_features(features, "ViT")
                if not is_valid:
                    logger.warning(f"ViT+LR feature validation warning: {warning}")
                    # Continue anyway but log it - helps diagnose issues
            
            features_scaled = scaler.transform(features)
            
            # Log scaled features for debugging
            logger.debug(f"ViT features scaled - mean: {features_scaled.mean():.4f}, std: {features_scaled.std():.4f}")
            
            # Check if scaling looks suspicious (all features too positive)
            if features_scaled.mean() > 1.0 and features.mean() < 0.1:
                logger.warning(f"Suspicious scaling: raw mean={features.mean():.6f}, scaled mean={features_scaled.mean():.4f}")
                logger.warning("This may indicate ViT features are all zeros or feature extraction failed")
            
            pred = lr_model.predict(features_scaled)[0]
            prob = lr_model.predict_proba(features_scaled)[0]
            label = "Pneumonia" if pred == 1 else "Normal"
            
            return {
                "model": "vit_logistic",
                "label": label,
                "confidence": float(np.max(prob)),
                "probabilities": {"normal": float(prob[0]), "pneumonia": float(prob[1])},
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.warning(f"ViT+LR prediction failed: {e}")
            return None

    # Use top-level DenseNet helper

    # Execution order based on preferred model
    result = None
    if preferred == 'gated_fusion':
        # Try gated fusion first (if features and models are available), otherwise fallback
        logger.info("Attempting Gated Fusion prediction")
        try:
            t0 = time.perf_counter()
            result = try_gated_fusion(vit_feat, wst_feat, rad_feat, sta_feat)
            t1 = time.perf_counter()
            timings['gated_fusion_ms'] = int((t1 - t0) * 1000)
        except Exception as e:
            logger.warning(f"Gated fusion attempt raised: {e}")
            result = None
        if result is None:
            logger.info("Gated Fusion unavailable or failed — falling back to DenseNet")
            t0 = time.perf_counter()
            result = densenet_infer(image, requested_from="gated_fusion")
            t1 = time.perf_counter()
            timings['densenet_ms'] = int((t1 - t0) * 1000)

    elif preferred == 'vit':
        # Try ViT+LR first, otherwise fallback
        logger.info("Attempting ViT+LR prediction")
        try:
            t0 = time.perf_counter()
            result = try_vit_lr(image)
            t1 = time.perf_counter()
            timings['vit_lr_ms'] = int((t1 - t0) * 1000)
        except Exception as e:
            logger.warning(f"ViT+LR attempt raised: {e}")
            result = None
        if result is None:
            logger.info("ViT+LR unavailable or failed — falling back to DenseNet")
            t0 = time.perf_counter()
            result = densenet_infer(image, requested_from="vit")
            t1 = time.perf_counter()
            timings['densenet_ms'] = int((t1 - t0) * 1000)

    elif preferred in ('vgg16', 'vgg'):
        t0 = time.perf_counter()
        result = vgg16_infer(image)
        t1 = time.perf_counter()
        timings['vgg16_ms'] = int((t1 - t0) * 1000)

    elif preferred == 'densenet':
        # Force DenseNet only
        t0 = time.perf_counter()
        result = densenet_infer(image)
        t1 = time.perf_counter()
        timings['densenet_ms'] = int((t1 - t0) * 1000)

    # Calculate inference time
    end_time = time.perf_counter()
    inference_time_ms = int((end_time - start_time) * 1000)

    if result is None:
        result = {"error": "All selected prediction paths failed or models unavailable"}
    else:
        # Add inference time and per-model timings to result
        result["inference_time_ms"] = inference_time_ms
        result["timings_ms"] = timings

    return result


# =========================================================
# COMPARE API
# =========================================================
@app.post("/compare")
@app.post("/api/compare")
async def compare(file: UploadFile = File(...), models: str | None = Form(None)):
    await ensure_upload_size(file)
    try:
        image = Image.open(file.file).convert("RGB")

        # prepare model list
        if models:
            model_list = [m.strip() for m in models.split(",") if m.strip()]
        else:
            model_list = ["gated_fusion", "vit", "vgg16"]

        # pre-extract features once for efficiency
        try:
            vit_feat = extract_vit_from_pil(image)
            wst_feat = extract_wst_from_pil(image)
            rad_feat, sta_feat = extract_radiomics_stats_from_pil(image)
        except Exception as e:
            vit_feat = wst_feat = rad_feat = sta_feat = None

        results = []
        for mid in model_list:
            start = time.perf_counter()
            res = None
            if mid in ("gated_fusion", "fusion"):
                # Attempt gated fusion using pre-extracted features
                try:
                    if vit_feat is not None and fusion_api and getattr(fusion_api, 'FUSION_MANAGER', None) is not None:
                        mgr = fusion_api.FUSION_MANAGER
                        if getattr(mgr, 'gated_fusion', None) is not None and getattr(mgr, 'classifier_gf', None) is not None:
                            preds, probs = mgr.predict_gf(vit_feat, wst_feat, rad_feat, sta_feat)
                            label = "Pneumonia" if int(preds[0]) == 1 else "Normal"
                            res = {
                                "model": "gated_fusion",
                                "label": label,
                                "confidence": float(np.max(probs)),
                                "probabilities": {"normal": probs[:, 0].tolist(), "pneumonia": probs[:, 1].tolist()}
                            }
                except Exception as e:
                    logger.warning(f"Gated fusion compare failed: {e}")
                if res is None:
                    # fallback to DenseNet
                    res = densenet_infer(image, requested_from=mid)
                    if res is not None:
                        res["requested_model"] = mid

            elif mid in ("vit", "vit_logistic"):
                # Attempt ViT+LR using pre-extracted features
                try:
                    if vit_feat is not None and lr_model is not None and scaler is not None:
                        features_scaled = scaler.transform(vit_feat)
                        pred = lr_model.predict(features_scaled)[0]
                        prob = lr_model.predict_proba(features_scaled)[0]
                        label = "Pneumonia" if pred == 1 else "Normal"
                        res = {"model": "vit_logistic", "label": label, "confidence": float(np.max(prob)), "probabilities": {"normal": float(prob[0]), "pneumonia": float(prob[1])}}
                except Exception as e:
                    logger.warning(f"ViT compare failed: {e}")
                if res is None:
                    res = densenet_infer(image, requested_from=mid)
                    if res is not None:
                        res["requested_model"] = mid

            elif mid in ("densenet", "dense"):
                try:
                    model = get_densenet_model()
                    if model is not None:
                        img_np = np.array(image.resize((224, 224))).astype("float32") / 255.0
                        preds = model.predict(np.expand_dims(img_np, axis=0), verbose=0)
                        pred_class = int(np.argmax(preds[0]))
                        confidence = float(np.max(preds[0]))
                        label = "Pneumonia" if pred_class == 1 else "Normal"
                        res = {"model": "densenet", "label": label, "confidence": confidence, "probabilities": {"normal": float(preds[0][0]) if preds.shape[1] > 1 else float(1-confidence), "pneumonia": float(preds[0][1]) if preds.shape[1] > 1 else float(confidence)}}
                except Exception as e:
                    logger.warning(f"DenseNet compare failed for {mid}: {e}")

            elif mid in ("vgg16", "vgg"):
                res = vgg16_infer(image, requested_from=mid)
                if res is not None:
                    res["requested_model"] = mid

            elapsed = int((time.perf_counter() - start) * 1000)
            if res is None:
                results.append({"model": mid, "error": "model unavailable or failed", "runtime_ms": elapsed})
            else:
                res["runtime_ms"] = elapsed
                results.append(res)

        return {"models": results}
    except Exception as e:
        logger.exception("Compare API failed")
        return {"error": str(e)}
    
def get_last_conv_layer(model):
    for layer in reversed(model.layers):
        if len(layer.output_shape) == 4:  # conv feature map
            return layer.name
    raise ValueError("No conv layer found")
# =========================================================
# GRADCAM CORE
# =========================================================
def make_gradcam_heatmap(img_array, model, pred_index=None):
    # wrapper kept for compatibility but we use predict_with_gradcam helper
    result = predict_with_gradcam(model, img_array)
    # predict_with_gradcam returns 'heatmap' and 'superimposed'
    return result.get("heatmap")

# =========================================================
# GRADCAM API
# =========================================================
from fastapi.responses import Response

# Support both direct and /api-prefixed GradCAM URLs used by frontend/backend
@app.post("/gradcam")
@app.post("/api/gradcam")
async def gradcam_api(file: UploadFile = File(...)):
    try:
        print("\n" + "="*70)
        print("[GRADCAM] REQUEST RECEIVED")
        size = await ensure_upload_size(file)
        print(f"[GRADCAM] File: {file.filename}, Size: {size} bytes")
        
        print("[GRADCAM] Opening image...")
        image = Image.open(file.file).convert("RGB")
        print(f"[GRADCAM] Image size: {image.size}")
        
        # Use gradcam_utils to generate heatmap + superimposed
        print("[GRADCAM] Converting to numpy array...")
        image_np = np.array(image)
        print(f"[GRADCAM] Array shape: {image_np.shape}")
        
        print("[GRADCAM] Calling predict_with_gradcam...")
        model = get_densenet_model()
        if model is None:
            raise RuntimeError("DenseNet model is not loaded or incompatible for GradCAM")
        result = predict_with_gradcam(model, image_np)
        print(f"[GRADCAM] Result keys: {result.keys()}")
        
        # result should contain 'superimposed' as an image (uint8)
        superimposed = result.get("superimposed")
        if superimposed is None:
            print("[ERROR] GradCAM failed to produce superimposed image")
            return {"error": "GradCAM failed to produce superimposed image"}

        print(f"[GRADCAM] Superimposed shape: {superimposed.shape}")
        print("[GRADCAM] Encoding to JPEG...")
        _, buffer = cv2.imencode(".jpg", superimposed)
        print(f"[GRADCAM] JPEG buffer size: {len(buffer)} bytes")
        print("[GRADCAM] Returning JPEG response")
        print("="*70 + "\n")
        return Response(content=buffer.tobytes(), media_type="image/jpeg")

    except Exception as e:
        print("\n" + "="*70)
        print("[ERROR] GradCAM API failed")
        print(f"[ERROR] Exception: {type(e).__name__}: {str(e)}")
        print("="*70 + "\n")
        import traceback
        traceback.print_exc()
        return {"error": f"{type(e).__name__}: {str(e)}"}

# =========================================================
# HEALTH CHECK & STATUS ENDPOINTS
# =========================================================
@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {}
    }
    
    # Check DenseNet: report both loaded state and whether artifacts exist on disk
    densenet_present = any(os.path.exists(p) for p in DENSENET_CANDIDATES)
    status["services"]["densenet"] = {
        "loaded": bool(densenet_model is not None),
        "present_on_disk": bool(densenet_present)
    }
    
    # Check feature extractors
    features_ok = all([extract_vit_from_pil, extract_wst_from_pil, extract_radiomics_stats_from_pil])
    status["services"]["feature_extractors"] = "loaded" if features_ok else "missing"
    
    # Check fusion API
    status["services"]["fusion_api"] = "loaded" if fusion_api is not None else "missing"
    
    # Check models
    status["services"]["lr_model"] = "loaded" if lr_model is not None else "missing"
    status["services"]["scaler"] = "loaded" if scaler is not None else "missing"
    
    # Determine overall status: require core prediction path (ViT+LR) to be available
    critical_ok = (lr_model is not None) and (scaler is not None) and features_ok
    status["status"] = "healthy" if critical_ok else "degraded"
    
    return status

@app.get("/status")
async def status_check():
    """Detailed service status"""
    return {
        "service": "pneumonia-ai-service",
        "version": "2.0",
        "timestamp": datetime.now().isoformat(),
        "python_version": sys.version,
        "models": {
            "densenet169": {
                "loaded": bool(densenet_model is not None),
                "present_on_disk": any(os.path.exists(p) for p in DENSENET_CANDIDATES)
            },
            "lr_classifier": "loaded" if lr_model is not None else "failed",
            "scaler": "loaded" if scaler is not None else "failed"
        },
        "endpoints": [
            "GET /health - Health check",
            "GET /status - Detailed status",
            "POST /predict - Prediction with features",
            "POST /gradcam - GradCAM visualization",
            "GET / - Home"
        ]
    }

# =========================================================
# STARTUP & SHUTDOWN LIFECYCLE
# =========================================================
@app.on_event("startup")
async def startup_event():
    logger.info("=" * 70)
    logger.info("🚀 AI SERVICE STARTING UP")
    logger.info("=" * 70)
    
    # Report startup status
    densenet_present = any(os.path.exists(p) for p in DENSENET_CANDIDATES)
    logger.info("[STARTUP] DenseNet artifact present on disk" if densenet_present else "[STARTUP] DenseNet artifact NOT found on disk")
    logger.info("[STARTUP] Feature Extractors: ✅" if extract_vit_from_pil else "[STARTUP] Feature Extractors: ❌")
    logger.info("[STARTUP] Fusion API: ✅" if fusion_api else "[STARTUP] Fusion API: ❌")
    
    logger.info("=" * 70)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 AI SERVICE SHUTTING DOWN")

# =========================================================
# RUN
# =========================================================
def _is_port_available(host, port):
    """Check if a port is available for binding"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        try:
            sock.bind((host, port))
            return True
        except OSError:
            return False

if __name__ == "__main__":
    logger.info("\n" + "=" * 70)
    logger.info("PNEUMONIA AI SERVICE V2.0 - FIXED PORT 8000")
    logger.info("=" * 70 + "\n")
    
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))  # Fixed port 8000
    
    logger.info(f"Configuration:")
    logger.info(f"  HOST: {host}")
    logger.info(f"  PORT: {port} (FIXED - No fallback)")
    logger.info(f"  Environment: {'Production' if host != '0.0.0.0' else 'Development'}")
    
    # Check if port is available - NO FALLBACK, strict check
    logger.info(f"\nChecking if port {port} is available...")
    
    if not _is_port_available(host, port):
        logger.error("")
        logger.error("❌ ERROR: PORT 8000 IS ALREADY IN USE!")
        logger.error("")
        logger.error("To fix this, choose ONE of these options:")
        logger.error("")
        logger.error("OPTION 1 - Kill the process using port 8000:")
        logger.error("  Windows: taskkill /PID <PID> /F")
        logger.error("  Linux/Mac: kill -9 <PID>")
        logger.error("")
        logger.error("OPTION 2 - Use the cleanup script:")
        logger.error("  python cleanup_port_8000.py")
        logger.error("")
        logger.error("OPTION 3 - Change PORT (not recommended):")
        logger.error("  SET PORT=8001 && python main.py  (Windows)")
        logger.error("  PORT=8001 python main.py  (Linux/Mac)")
        logger.error("")
        sys.exit(1)
    
    logger.info(f"✅ Port {port} is available")
    
    # Initialize fusion components if needed
    logger.info("\nInitializing AI components...")
    fusion_router_ok = False
    if fusion_api is not None:
        try:
            logger.info("  📦 Including Fusion API router...")
            app.include_router(fusion_api.router)
            fusion_router_ok = True
            logger.info("  ✅ Fusion API router included")
        except Exception as e:
            logger.warning(f"  ⚠️  Could not include fusion_api router: {e}")
    else:
        logger.warning("  ⚠️  Fusion API not available, skipping router")
    
    if fusion_api is not None and fusion_router_ok:
        try:
            logger.info("  🔧 Initializing Fusion model manager...")
            fusion_api.init_fusion_model()
            logger.info("  ✅ Fusion model manager initialized")
        except Exception as e:
            logger.warning(f"  ⚠️  Failed to initialize fusion model: {e}")
    
    # Initialize fusion components if needed
    logger.info("\nInitializing AI components...")
    fusion_router_ok = False
    if fusion_api is not None:
        try:
            logger.info("  📦 Including Fusion API router...")
            app.include_router(fusion_api.router)
            fusion_router_ok = True
            logger.info("  ✅ Fusion API router included")
        except Exception as e:
            logger.warning(f"  ⚠️  Could not include fusion_api router: {e}")
    else:
        logger.warning("  ⚠️  Fusion API not available, skipping router")
    
    if fusion_api is not None and fusion_router_ok:
        try:
            logger.info("  🔧 Initializing Fusion model manager...")
            fusion_api.init_fusion_model()
            logger.info("  ✅ Fusion model manager initialized")
        except Exception as e:
            logger.warning(f"  ⚠️  Failed to initialize fusion model: {e}")
    
    # Summary
    logger.info("\n" + "=" * 70)
    logger.info("STARTUP SUMMARY")
    logger.info("=" * 70)
    logger.info(f"🌐 Access AI Service at: http://localhost:{port}")
    logger.info(f"🌐 Health check: http://localhost:{port}/health")
    logger.info(f"🌐 Status page: http://localhost:{port}/status")
    logger.info("=" * 70 + "\n")
    
    # Start server
    logger.info("Starting uvicorn server...")
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        access_log=True
    )