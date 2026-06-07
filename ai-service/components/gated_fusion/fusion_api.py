"""
FastAPI Integration for Fusion Models
(Gated Fusion + RandomForest)

UPDATED:
- Match Kaggle preprocessing exactly
- Added scaler_vit + scaler_wst
- Added scaler_radsta
- Fixed Gated Fusion inference pipeline
- Fixed RF pipeline
- Better NaN handling
- Better logging
"""

import io
import logging
import sys
from pathlib import Path
from typing import Tuple

import joblib
import numpy as np
import torch
from PIL import Image

logger = logging.getLogger(__name__)

# NumPy pickle compatibility aliases (for artifacts created with different NumPy internals)
try:
    import numpy.core
    import numpy.core._multiarray_umath
    import numpy.core.multiarray
    import numpy.core.numeric

    sys.modules.setdefault("numpy._core", numpy.core)
    sys.modules.setdefault("numpy._core._multiarray_umath", numpy.core._multiarray_umath)
    sys.modules.setdefault("numpy._core.multiarray", numpy.core.multiarray)
    sys.modules.setdefault("numpy._core.numeric", numpy.core.numeric)
except Exception:
    # Best-effort shim only.
    pass

# =========================================================
# IMPORT MODEL
# =========================================================

try:
    from train_gated_fusion import GatedFusion
except Exception:
    GatedFusion = None

# =========================================================
# IMPORT FEATURE EXTRACTORS
# =========================================================

from components.extractors.extractors import (
    extract_vit_from_pil,
    extract_wst_from_pil,
    extract_radiomics_stats_from_pil
)

# =========================================================
# FUSION MODEL MANAGER
# =========================================================

class FusionModelManager:

    def __init__(self, model_dir="models"):

        self.model_dir = Path(model_dir)

        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        # =================================================
        # GATED FUSION
        # =================================================

        self.gated_fusion = None

        self.pca_vit_gf = None
        self.pca_wst_gf = None

        self.scaler_radsta_gf = None

        self.scaler_vit_gf = None
        self.scaler_wst_gf = None

        self.classifier_gf = None

        # =================================================
        # RANDOM FOREST
        # =================================================

        self.pca_vit = None
        self.pca_wst = None

        self.scaler_vit = None
        self.scaler_wst = None
        self.scaler_radsta = None

        self.rf_classifier = None

        # =================================================
        # LOAD
        # =================================================

        self.load_models()

    # =====================================================
    # LOAD ALL
    # =====================================================

    def load_models(self):

        self._load_gated_fusion()

        self._load_random_forest()

    # =====================================================
    # LOAD GATED FUSION
    # =====================================================

    def _load_gated_fusion(self):

        try:

            if GatedFusion is None:
                logger.warning(
                    "GatedFusion class unavailable"
                )
                return

            # =============================================
            # LOAD PCA
            # =============================================

            self.pca_vit_gf = joblib.load(
                self.model_dir / "pca_vit.pkl"
            )

            self.pca_wst_gf = joblib.load(
                self.model_dir / "pca_wst.pkl"
            )

            # =============================================
            # LOAD RADSTA SCALER
            # =============================================

            self.scaler_radsta_gf = joblib.load(
                self.model_dir / "scaler_radsta.pkl"
            )

            # Optional ViT/WST scalers: use them when present, otherwise fallback to identity.
            scaler_vit_path = self.model_dir / "scaler_vit.pkl"
            if scaler_vit_path.exists():
                self.scaler_vit_gf = joblib.load(scaler_vit_path)
                logger.info("✅ Loaded scaler_vit.pkl for Gated Fusion")
            else:
                self.scaler_vit_gf = None
                logger.info("ℹ️ scaler_vit.pkl not found, using raw ViT features for Gated Fusion")

            scaler_wst_path = self.model_dir / "scaler_wst.pkl"
            if scaler_wst_path.exists():
                self.scaler_wst_gf = joblib.load(scaler_wst_path)
                logger.info("✅ Loaded scaler_wst.pkl for Gated Fusion")
            else:
                self.scaler_wst_gf = None
                logger.info("ℹ️ scaler_wst.pkl not found, using raw WST features for Gated Fusion")

            # =============================================
            # DIMENSIONS
            # =============================================

            vit_dim = self.pca_vit_gf.n_components_

            wst_dim = self.pca_wst_gf.n_components_

            radsta_dim = 105

            # =============================================
            # INIT MODEL
            # =============================================

            self.gated_fusion = GatedFusion(
                vit_dim=vit_dim,
                radsta_dim=radsta_dim,
                wst_dim=wst_dim,
                hidden_dim=64,
                num_classes=2
            ).to(self.device)

            # =============================================
            # LOAD WEIGHTS
            # =============================================

            checkpoint = torch.load(
                self.model_dir / "gated_fusion_model.pth",
                map_location=self.device
            )

            self.gated_fusion.load_state_dict(
                checkpoint
            )

            self.gated_fusion.eval()

            # =============================================
            # LOAD CLASSIFIER
            # =============================================

            self.classifier_gf = joblib.load(
                self.model_dir / "lr_classifier_gf.pkl"
            )

            logger.info(
                "✅ Gated Fusion loaded successfully"
            )

        except Exception as e:

            logger.exception(
                f"Failed loading Gated Fusion: {e}"
            )

    # =====================================================
    # LOAD RF
    # =====================================================

    def _load_random_forest(self):

        try:

            self.pca_vit = joblib.load(
                self.model_dir / "pca_vit.pkl"
            )

            self.pca_wst = joblib.load(
                self.model_dir / "pca_wst.pkl"
            )

            self.scaler_radsta = joblib.load(
                self.model_dir / "scaler_radsta.pkl"
            )

            scaler_vit_path = self.model_dir / "scaler_vit.pkl"
            self.scaler_vit = joblib.load(scaler_vit_path) if scaler_vit_path.exists() else None

            scaler_wst_path = self.model_dir / "scaler_wst.pkl"
            self.scaler_wst = joblib.load(scaler_wst_path) if scaler_wst_path.exists() else None

            self.rf_classifier = joblib.load(
                self.model_dir / "rf_classifier.pkl"
            )

            logger.info(
                "✅ RandomForest loaded successfully"
            )

        except Exception as e:

            logger.exception(
                f"Failed loading RF: {e}"
            )

    # =====================================================
    # PREPROCESS
    # =====================================================

    def preprocess_features(
        self,
        vit_features,
        wst_features,
        rad_features,
        sta_features,
        use_gf=True
    ):

        vit_features = np.nan_to_num(
            vit_features
        ).astype(np.float32)

        wst_features = np.nan_to_num(
            wst_features
        ).astype(np.float32)

        rad_features = np.nan_to_num(
            rad_features
        ).astype(np.float32)

        sta_features = np.nan_to_num(
            sta_features
        ).astype(np.float32)

        # =============================================
        # CONCAT RAD + STA
        # =============================================

        radsta = np.concatenate(
            [rad_features, sta_features],
            axis=1
        )

        # =============================================
        # GATED FUSION
        # =============================================

        if use_gf:
            vit_scaled = self.scaler_vit_gf.transform(vit_features) \
                if self.scaler_vit_gf is not None else vit_features
            wst_scaled = self.scaler_wst_gf.transform(wst_features) \
                if self.scaler_wst_gf is not None else wst_features

            radsta_scaled = self.scaler_radsta_gf.transform(
                radsta
            )

            vit_pca = self.pca_vit_gf.transform(
                vit_scaled
            )

            wst_pca = self.pca_wst_gf.transform(
                wst_scaled
            )

        # =============================================
        # RANDOM FOREST
        # =============================================

        else:
            vit_scaled = self.scaler_vit.transform(vit_features) \
                if self.scaler_vit is not None else vit_features
            wst_scaled = self.scaler_wst.transform(wst_features) \
                if self.scaler_wst is not None else wst_features

            radsta_scaled = self.scaler_radsta.transform(
                radsta
            )

            vit_pca = self.pca_vit.transform(
                vit_scaled
            )

            wst_pca = self.pca_wst.transform(
                wst_scaled
            )

        return (
            vit_pca.astype(np.float32),
            wst_pca.astype(np.float32),
            radsta_scaled.astype(np.float32)
        )

    # =====================================================
    # GATED FUSION PREDICT
    # =====================================================

    def predict_gf(
        self,
        vit_features,
        wst_features,
        rad_features,
        sta_features
    ) -> Tuple[np.ndarray, np.ndarray]:

        if self.gated_fusion is None:
            raise RuntimeError(
                "Gated Fusion model unavailable"
            )

        # =============================================
        # PREPROCESS
        # =============================================

        vit_pca, wst_pca, radsta = \
            self.preprocess_features(
                vit_features,
                wst_features,
                rad_features,
                sta_features,
                use_gf=True
            )

        # =============================================
        # TO TENSOR
        # =============================================

        vit_tensor = torch.tensor(
            vit_pca,
            dtype=torch.float32
        ).to(self.device)

        wst_tensor = torch.tensor(
            wst_pca,
            dtype=torch.float32
        ).to(self.device)

        radsta_tensor = torch.tensor(
            radsta,
            dtype=torch.float32
        ).to(self.device)

        # =============================================
        # EXTRACT FUSED FEATURE
        # =============================================

        with torch.no_grad():

            fused = self.gated_fusion(
                vit_tensor,
                radsta_tensor,
                wst_tensor,
                return_feature=True
            )

        fused = fused.cpu().numpy()

        fused = np.nan_to_num(
            fused
        ).astype(np.float32)

        # =============================================
        # CLASSIFIER
        # =============================================

        preds = self.classifier_gf.predict(
            fused
        )

        probs = self.classifier_gf.predict_proba(
            fused
        )

        probs = np.nan_to_num(
            probs,
            nan=0.0,
            posinf=1.0,
            neginf=0.0
        )

        return preds, probs

    # =====================================================
    # RANDOM FOREST PREDICT
    # =====================================================

    def predict_rf(
        self,
        vit_features,
        wst_features,
        rad_features,
        sta_features
    ) -> Tuple[np.ndarray, np.ndarray]:

        if self.rf_classifier is None:
            raise RuntimeError(
                "RF classifier unavailable"
            )

        vit_pca, wst_pca, radsta = \
            self.preprocess_features(
                vit_features,
                wst_features,
                rad_features,
                sta_features,
                use_gf=False
            )

        # =============================================
        # CONCAT ALL
        # =============================================

        X_final = np.concatenate(
            [
                vit_pca,
                wst_pca,
                radsta
            ],
            axis=1
        )

        X_final = np.nan_to_num(
            X_final
        ).astype(np.float32)

        preds = self.rf_classifier.predict(
            X_final
        )

        probs = self.rf_classifier.predict_proba(
            X_final
        )

        probs = np.nan_to_num(
            probs,
            nan=0.0,
            posinf=1.0,
            neginf=0.0
        )

        return preds, probs


# =========================================================
# GLOBAL MANAGER
# =========================================================

FUSION_MANAGER = None


def init_fusion_model():

    global FUSION_MANAGER

    try:

        FUSION_MANAGER = FusionModelManager()

        logger.info(
            "✅ Fusion Manager initialized"
        )

    except Exception as e:

        logger.exception(
            f"Fusion init failed: {e}"
        )


# =========================================================
# FASTAPI ROUTES
# =========================================================

try:

    from fastapi import (
        APIRouter,
        File,
        UploadFile,
        HTTPException
    )

    from fastapi.responses import JSONResponse

    router = APIRouter(
        prefix="/api",
        tags=["fusion"]
    )

    # =====================================================
    # IMAGE PREDICTION
    # =====================================================

    @router.post("/predict/image")
    async def predict_image(
        file: UploadFile = File(...)
    ):

        try:

            if FUSION_MANAGER is None:

                raise HTTPException(
                    status_code=500,
                    detail="Fusion model not initialized"
                )

            contents = await file.read()

            image = Image.open(
                io.BytesIO(contents)
            )

            # =========================================
            # EXTRACT FEATURES
            # =========================================

            vit = extract_vit_from_pil(image)

            wst = extract_wst_from_pil(image)

            rad, sta = \
                extract_radiomics_stats_from_pil(
                    image
                )

            # =========================================
            # PREDICT
            # =========================================

            preds, probs = \
                FUSION_MANAGER.predict_gf(
                    vit,
                    wst,
                    rad,
                    sta
                )

            pred = int(preds[0])

            pneumonia_prob = float(
                probs[0][1]
            )

            normal_prob = float(
                probs[0][0]
            )

            label = (
                "PNEUMONIA"
                if pred == 1
                else "NORMAL"
            )

            return JSONResponse({

                "status": "success",

                "prediction": pred,

                "label": label,

                "probabilities": {

                    "normal": normal_prob,

                    "pneumonia": pneumonia_prob
                }
            })

        except HTTPException:
            raise

        except Exception as e:

            logger.exception(
                f"predict_image failed: {e}"
            )

            raise HTTPException(
                status_code=500,
                detail=str(e)
            )

    # =====================================================
    # HEALTH
    # =====================================================

    @router.get("/health")
    async def health_check():

        return JSONResponse({

            "status": "ok",

            "device": str(
                torch.device(
                    "cuda"
                    if torch.cuda.is_available()
                    else "cpu"
                )
            ),

            "gated_fusion_loaded":
                FUSION_MANAGER.gated_fusion is not None
                if FUSION_MANAGER else False,

            "rf_loaded":
                FUSION_MANAGER.rf_classifier is not None
                if FUSION_MANAGER else False
        })

except Exception as e:

    logger.warning(
        f"FastAPI router unavailable: {e}"
    )


# =========================================================
# STARTUP
# =========================================================

"""
@app.on_event("startup")
async def startup():

    init_fusion_model()
"""