import os

with open('components/densenet/inference.py', 'w', encoding='utf-8') as f:
    f.write('''import os
import time
import base64
import logging
from io import BytesIO
import numpy as np
from PIL import Image
import cv2
import keras
from tensorflow import keras as tfkeras

logger = logging.getLogger(__name__)

densenet_model = None

def get_densenet_model():
    \"\"\"Attempt to load DenseNet model on first use.\"\"\"
    global densenet_model
    if densenet_model is not None:
        return densenet_model

    candidate_files = [\"models/artifacts/fixed_model.keras\", \"models/artifacts/pneumonia_densenet169.keras\", \"models/artifacts/pneumonia_densenet169.h5\", \"fixed_model.keras\", \"pneumonia_densenet169.keras\", \"pneumonia_densenet169.h5\"]
    last_exc = None
    for fname in candidate_files:
        if not os.path.exists(fname):
            continue
        try:
            try:
                densenet_model = keras.models.load_model(fname, compile=False)
            except Exception as e_load:
                try:
                    densenet_model = tfkeras.models.load_model(fname, compile=False)
                except Exception as e_tfload:
                    if fname.lower().endswith('.h5'):
                        from tensorflow.keras.applications import DenseNet169 as TF_DenseNet169
                        model_tmp = TF_DenseNet169(weights=None, classes=2, input_shape=(224,224,3))
                        model_tmp.load_weights(fname)
                        densenet_model = model_tmp
                    else:
                        raise e_tfload

            if densenet_model is not None:
                return densenet_model
        except Exception as e:
            last_exc = e

    if last_exc is not None:
        logger.error(f"All DenseNet load attempts failed: {last_exc}")
    return None
''')

with open('components/vgg16/inference.py', 'w', encoding='utf-8') as f:
    f.write('''import os
import time
import base64
import logging
from io import BytesIO
import numpy as np
import joblib
from PIL import Image
import cv2

logger = logging.getLogger(__name__)

vgg16_base_model = None
vgg16_lr_model = None

def get_vgg16_model():
    \"\"\"Load VGG16 base (ImageNet pretrained) and LR classifier.\"\"\"
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
''')

