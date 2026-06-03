import numpy as np
import logging

logger = logging.getLogger(__name__)

# =========================================================
# GLOBALS
# =========================================================

_vit_processor = None
_vit_model = None
_device = None
_vit_init_error = None


# =========================================================
# SINGLE IMAGE INFERENCE WRAPPER
# =========================================================

class SingleImageInference:

    def __init__(self):
        pass

    def extract_all(self, pil_image):

        vit_feats = extract_vit_from_pil(pil_image)

        wst_feats = extract_wst_from_pil(pil_image)

        rad_feats, stat_feats = extract_radiomics_stats_from_pil(
            pil_image
        )

        return {
            "vit": vit_feats,
            "wst": wst_feats,
            "radiomics": rad_feats,
            "stats": stat_feats
        }


# =========================================================
# INIT VIT
# =========================================================

def _init_vit():

    global _vit_processor
    global _vit_model
    global _device
    global _vit_init_error

    if _vit_processor is not None and _vit_model is not None:
        return

    _vit_init_error = None

    try:

        import torch
        from transformers import ViTModel, ViTImageProcessor

        _device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        _vit_processor = ViTImageProcessor.from_pretrained(
            "google/vit-large-patch16-224-in21k",
            do_rescale=False
        )

        try:

            _vit_model = ViTModel.from_pretrained(
                "google/vit-large-patch16-224-in21k",
                low_cpu_mem_usage=True
            )

        except Exception as e_low:

            logger.warning(
                f"low_cpu_mem_usage failed: {e_low}"
            )

            _vit_model = ViTModel.from_pretrained(
                "google/vit-large-patch16-224-in21k"
            )

        _vit_model.to(_device)
        _vit_model.eval()

        logger.info(f"ViT loaded on {_device}")

    except Exception as e:

        logger.exception(f"Failed to initialize ViT: {e}")

        _vit_processor = None
        _vit_model = None
        _vit_init_error = e


# =========================================================
# VIT FEATURE EXTRACTION
# =========================================================

def extract_vit_from_pil(pil_image):

    """
    MATCH KAGGLE NOTEBOOK EXACTLY

    Output:
        shape = (1,1024)
    """

    _init_vit()

    if _vit_processor is None or _vit_model is None:

        msg = "ViT model not available."

        if _vit_init_error is not None:
            msg += f" Error: {_vit_init_error}"

        raise RuntimeError(msg)

    import torch

    IMG_SIZE_VIT = 128

    # =====================================================
    # NOTEBOOK:
    # grayscale -> RGB stack
    # =====================================================

    img = (
        pil_image
        .convert("L")
        .resize((IMG_SIZE_VIT, IMG_SIZE_VIT))
    )

    img = np.array(img).astype(np.float32)

    # stack grayscale -> RGB
    img_rgb = np.stack(
        (img,) * 3,
        axis=-1
    )

    # =====================================================
    # PROCESSOR
    # =====================================================

    inputs = _vit_processor(
        images=img_rgb,
        return_tensors="pt"
    )

    inputs = {
        k: v.to(_device)
        for k, v in inputs.items()
    }

    # =====================================================
    # INFERENCE
    # =====================================================

    with torch.no_grad():

        outputs = _vit_model(**inputs)

    # CLS token
    feats = outputs.last_hidden_state[:, 0, :]

    feats = feats.cpu().numpy()

    feats = np.nan_to_num(
        feats,
        nan=0.0,
        posinf=1e6,
        neginf=-1e6
    ).astype(np.float32)

    logger.info(
        f"ViT feature shape: {feats.shape}"
    )

    return feats


# =========================================================
# WST FEATURE EXTRACTION
# =========================================================

def extract_wst_from_pil(
        pil_image,
        out_size=(128, 128)
):

    """
    MATCH KAGGLE WST NOTEBOOK
    """

    try:
        from kymatio.numpy import Scattering2D

    except Exception:

        raise RuntimeError(
            "kymatio required. Install: pip install kymatio"
        )

    img = (
        pil_image
        .convert("L")
        .resize(out_size)
    )

    arr = np.array(img, dtype=np.float32)

    # =====================================================
    # NOTEBOOK NORMALIZATION
    # =====================================================

    arr = (
        arr - arr.min()
    ) / (
        arr.max() - arr.min() + 1e-8
    )

    # =====================================================
    # NOTEBOOK SCATTERING
    # =====================================================

    scattering = Scattering2D(
        J=2,
        shape=out_size,
        L=8
    )

    # batch dim
    arr_b = arr[np.newaxis, :, :]

    Sx = scattering(arr_b)

    feat = np.array(Sx).reshape(1, -1)

    feat = np.nan_to_num(
        feat,
        nan=0.0,
        posinf=1e6,
        neginf=-1e6
    ).astype(np.float32)

    logger.info(
        f"WST feature shape: {feat.shape}"
    )

    return feat


# =========================================================
# RADIOMICS + STATISTICAL
# =========================================================

def extract_radiomics_stats_from_pil(pil_image):

    from scipy.stats import (
        skew,
        kurtosis,
        entropy
    )

    img = (
        pil_image
        .convert("L")
        .resize((128, 128))
    )

    arr = np.array(img, dtype=np.float32)

    arr_flat = arr.flatten()

    # =====================================================
    # STATISTICAL FEATURES
    # MATCH NOTEBOOK EXACTLY
    # =====================================================

    hist = np.histogram(
        arr_flat,
        bins=256,
        density=True
    )[0] + 1e-10

    stats_feats = np.array([[
        np.mean(arr_flat),
        np.std(arr_flat),
        np.var(arr_flat),
        np.min(arr_flat),
        np.max(arr_flat),
        np.median(arr_flat),
        np.max(arr_flat) - np.min(arr_flat),
        skew(arr_flat),
        kurtosis(arr_flat),
        np.sum(arr_flat ** 2),
        np.sqrt(np.mean(arr_flat ** 2)),
        entropy(hist)
    ]], dtype=np.float32)

    stats_feats = np.nan_to_num(
        stats_feats,
        nan=0.0,
        posinf=0.0,
        neginf=0.0
    )

    # =====================================================
    # RADIOMICS
    # =====================================================

    EXPECTED_RAD_DIM = 93

    rad_arr = None

    try:

        from radiomics import featureextractor
        import SimpleITK as sitk

        params = {
            "binWidth": 25,
            "normalize": True
        }

        extractor = featureextractor.RadiomicsFeatureExtractor(
            **params
        )

        extractor.enableFeatureClassByName(
            "firstorder"
        )

        extractor.enableFeatureClassByName(
            "glcm"
        )

        extractor.enableFeatureClassByName(
            "glszm"
        )

        image = arr.astype(np.float32)

        # =================================================
        # NOTEBOOK MASK
        # =================================================

        mask = np.ones_like(
            image,
            dtype=np.uint8
        )

        mask[0, 0] = 0

        image_itk = sitk.GetImageFromArray(image)

        mask_itk = sitk.GetImageFromArray(mask)

        result = extractor.execute(
            image_itk,
            mask_itk
        )

        rad_vals = []

        keys = sorted(result.keys())

        for k in keys:

            if k.startswith("diagnostics"):
                continue

            v = result[k]

            if isinstance(v, (int, float, np.number)):

                rad_vals.append(float(v))

            elif (
                isinstance(v, np.ndarray)
                and v.shape == ()
            ):

                rad_vals.append(float(v.item()))

        rad_arr = np.array(
            rad_vals,
            dtype=np.float32
        )[None, :]

        # =================================================
        # FORCE 93 DIMS
        # =================================================

        if rad_arr.shape[1] < EXPECTED_RAD_DIM:

            pad = np.zeros(
                (
                    1,
                    EXPECTED_RAD_DIM - rad_arr.shape[1]
                ),
                dtype=np.float32
            )

            rad_arr = np.concatenate(
                [rad_arr, pad],
                axis=1
            )

        elif rad_arr.shape[1] > EXPECTED_RAD_DIM:

            rad_arr = rad_arr[:, :EXPECTED_RAD_DIM]

        logger.info(
            f"Radiomics shape: {rad_arr.shape}"
        )

    except ImportError:

        logger.warning(
            "pyradiomics not installed"
        )

        rad_arr = np.zeros(
            (1, EXPECTED_RAD_DIM),
            dtype=np.float32
        )

    except Exception as e:

        logger.warning(
            f"Radiomics extraction failed: {e}"
        )

        rad_arr = np.zeros(
            (1, EXPECTED_RAD_DIM),
            dtype=np.float32
        )

    rad_arr = np.nan_to_num(
        rad_arr,
        nan=0.0,
        posinf=0.0,
        neginf=0.0
    ).astype(np.float32)

    return rad_arr, stats_feats
