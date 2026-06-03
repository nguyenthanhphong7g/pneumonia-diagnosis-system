import os
import glob
import random
import numpy as np
import torch
import torch.nn as nn
import joblib
from PIL import Image
from pathlib import Path
from scipy.stats import skew, kurtosis, entropy

# =========================================================
# IMPORT EXTRACTORS (module import to access internals)
# =========================================================

import extractors as ext

# =========================================================
# GATED FUSION MODEL
# =========================================================

class GatedFusion(nn.Module):

    def __init__(
        self,
        vit_dim,
        radsta_dim,
        wst_dim,
        hidden_dim=64,
        num_classes=2
    ):
        super().__init__()

        self.vit_proj = nn.Linear(vit_dim, hidden_dim)
        self.radsta_proj = nn.Linear(radsta_dim, hidden_dim)
        self.wst_proj = nn.Linear(wst_dim, hidden_dim)

        self.norm_vit = nn.LayerNorm(hidden_dim)
        self.norm_radsta = nn.LayerNorm(hidden_dim)
        self.norm_wst = nn.LayerNorm(hidden_dim)

        self.gate_vit = nn.Linear(hidden_dim, hidden_dim)
        self.gate_radsta = nn.Linear(hidden_dim, hidden_dim)
        self.gate_wst = nn.Linear(hidden_dim, hidden_dim)

        self.sigmoid = nn.Sigmoid()

        self.dropout = nn.Dropout(0.3)

        self.classifier = nn.Linear(hidden_dim, num_classes)

    def forward(
        self,
        vit,
        radsta,
        wst,
        return_feature=False
    ):

        vit = self.norm_vit(
            self.vit_proj(vit)
        )

        radsta = self.norm_radsta(
            self.radsta_proj(radsta)
        )

        wst = self.norm_wst(
            self.wst_proj(wst)
        )

        g_vit = self.sigmoid(self.gate_vit(vit))
        g_radsta = self.sigmoid(self.gate_radsta(radsta))
        g_wst = self.sigmoid(self.gate_wst(wst))

        vit = vit * (1 + g_vit)
        radsta = radsta * (1 + g_radsta)
        wst = wst * (1 + g_wst)

        fused = (vit + radsta + wst) / 3

        fused = self.dropout(fused)

        if return_feature:
            return fused

        out = self.classifier(fused)

        return out


# =========================================================
# CONFIG
# =========================================================

MODEL_DIR = Path("models_kaggle")

IMAGE_PATH = "D:\\TieuLuan\\pneumonia-diagnosis-system\\ai-service\\dataset\\raw\\test\\NORMAL\\IM-0003-0001.jpeg"

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

# =========================================================
# LOAD PCA + SCALERS
# =========================================================

print("\nLoading PCA + Scalers...")

pca_vit = joblib.load(
    MODEL_DIR / "pca_vit.pkl"
)

pca_wst = joblib.load(
    MODEL_DIR / "pca_wst.pkl"
)

scaler_stat = joblib.load(
    MODEL_DIR / "scaler_stat.pkl"
)

scaler_radiomics = joblib.load(
    MODEL_DIR / "scaler_rad.pkl"
)

print("Loaded successfully")

# =========================================================
# LOAD GATED FUSION MODEL
# =========================================================

print("\nLoading Gated Fusion model...")

vit_dim = pca_vit.n_components_
wst_dim = pca_wst.n_components_

radsta_dim = 105

model = GatedFusion(
    vit_dim=vit_dim,
    radsta_dim=radsta_dim,
    wst_dim=wst_dim,
    hidden_dim=64,
    num_classes=2
).to(device)

checkpoint = torch.load(
    MODEL_DIR / "gated_fusion_model.pth",
    map_location=device
)

model.load_state_dict(checkpoint)

model.eval()

print("Gated Fusion loaded")

# =========================================================
# LOAD RF CLASSIFIER
# =========================================================

print("\nLoading classifier...")

classifier = joblib.load(
    MODEL_DIR / "lr_classifier_gf.pkl"
)

print("Classifier loaded")

# =========================================================
# LOAD IMAGE
# =========================================================

print("\nLoading image...")

image = Image.open(IMAGE_PATH)

print("Image loaded:", image.size)

# =========================================================
# FEATURE EXTRACTION
# =========================================================

print("\nInput image histogram + brightness checks:")
img_g = image.convert("L").resize((128, 128))
arr_g = np.array(img_g, dtype=np.float32).ravel()
hist, bins = np.histogram(arr_g, bins=256)
print("  Grayscale mean=%.2f std=%.2f median=%.2f" % (arr_g.mean(), arr_g.std(), np.median(arr_g)))
print("  Percentiles: 1,5,95,99 =", np.percentile(arr_g, [1,5,95,99]).tolist())
print("  Skew=%.3f kurtosis=%.3f entropy=%.3f" % (skew(arr_g), kurtosis(arr_g), entropy(hist + 1e-10)))

print("\nExtracting ViT features (original extractor)...")
vit_features = ext.extract_vit_from_pil(image)
print("ViT shape:", vit_features.shape)

# Alternative ViT preprocessing: ImageNet normalization on resized image (compare)
def vit_features_imagenet(image, size=128, device=None):
    ext._init_vit()
    if ext._vit_model is None or ext._vit_processor is None:
        return None
    import torch
    # Use the ViT processor to produce correct-size pixel_values and normalization
    proc = ext._vit_processor
    img = image.convert("RGB")
    inputs = proc(images=img, return_tensors="pt")
    inputs = {k: v.to(ext._device) for k, v in inputs.items()}
    with torch.no_grad():
        out = ext._vit_model(**inputs)
    feats = out.last_hidden_state[:, 0, :].cpu().numpy()
    feats = np.nan_to_num(feats, nan=0.0, posinf=1e6, neginf=-1e6).astype(np.float32)
    return feats

vit_feat_imnet_128 = vit_features_imagenet(image, size=128)
vit_feat_imnet_224 = vit_features_imagenet(image, size=224)
print("Alternative ViT feats: size128 ->", None if vit_feat_imnet_128 is None else vit_feat_imnet_128.shape,
      ", size224 ->", None if vit_feat_imnet_224 is None else vit_feat_imnet_224.shape)

# =========================================================

print("\nExtracting WST features...")

wst_features = ext.extract_wst_from_pil(image)

print("WST shape:", wst_features.shape)

# =========================================================

print("\nExtracting Radiomics + Stats...")

rad_features, stat_features = (
    ext.extract_radiomics_stats_from_pil(image)
)

print("Radiomics shape:", rad_features.shape)

print("Stats shape:", stat_features.shape)

# =========================================================
# SCALE FEATURES
# =========================================================

print("\nScaling features...")

stat_scaled = scaler_stat.transform(
    stat_features
)

rad_scaled = scaler_radiomics.transform(
    rad_features
)

radsta = np.concatenate(
    [
        stat_scaled,
        rad_scaled
    ],
    axis=1
)

print("RadSta shape:", radsta.shape)

# =========================================================
# PCA
# =========================================================

print("\nApplying PCA...")

vit_pca = pca_vit.transform(
    vit_features
)

wst_pca = pca_wst.transform(
    wst_features
)

print("ViT PCA shape:", vit_pca.shape)

print("WST PCA shape:", wst_pca.shape)

# =========================================================
# TO TENSOR
# =========================================================

vit_tensor = torch.tensor(
    vit_pca,
    dtype=torch.float32
).to(device)

radsta_tensor = torch.tensor(
    radsta,
    dtype=torch.float32
).to(device)

wst_tensor = torch.tensor(
    wst_pca,
    dtype=torch.float32
).to(device)

# =========================================================
# EXTRACT FUSED FEATURE
# =========================================================

print("\nExtracting fused feature...")

with torch.no_grad():

    fused_feature = model(
        vit_tensor,
        radsta_tensor,
        wst_tensor,
        return_feature=True
    )

fused_feature = fused_feature.cpu().numpy()

print("Fused shape:", fused_feature.shape)

# =========================================================
# FINAL PREDICTION
# =========================================================

print("\nRunning prediction...")

prediction = classifier.predict(
    fused_feature
)

probabilities = classifier.predict_proba(
    fused_feature
)

pred_class = int(prediction[0])

prob_normal = float(probabilities[0][0])

prob_pneumonia = float(probabilities[0][1])

# =========================================================
# OUTPUT
# =========================================================

print("\n================ RESULT ================")

if pred_class == 0:

    print("Prediction: NORMAL")

else:

    print("Prediction: PNEUMONIA")

print(f"Normal Probability    : {prob_normal:.6f}")

print(f"Pneumonia Probability : {prob_pneumonia:.6f}")

# =========================================================
# Optional: calibrate classifier using small subset from train
# =========================================================
try:
    from sklearn.calibration import CalibratedClassifierCV
    print('\nAttempting classifier calibration using small sample from train set...')
    # collect small balanced sample
    train_root = Path('..') / '..' / 'dataset' / 'raw' / 'train'
    train_root = (Path(__file__).parents[2] / 'dataset' / 'raw' / 'train') if not train_root.exists() else train_root
    normal_dir = train_root / 'NORMAL'
    pneu_dir = train_root / 'PNEUMONIA'
    if normal_dir.exists() and pneu_dir.exists():
        n_per_class = 40
        normal_files = list(normal_dir.glob('*.jpeg'))[:n_per_class]
        pneu_files = list(pneu_dir.glob('*.jpeg'))[:n_per_class]
        Xc = []
        yc = []
        print(f'  Using {len(normal_files)} normal and {len(pneu_files)} pneumonia images for calibration')
        for fp in normal_files:
            img = Image.open(fp)
            vf = ext.extract_vit_from_pil(img)
            wp = ext.extract_wst_from_pil(img)
            rf, sf = ext.extract_radiomics_stats_from_pil(img)
            sf = scaler_stat.transform(sf)
            rf = scaler_radiomics.transform(rf)
            rsta = np.concatenate([sf, rf], axis=1)
            vp = pca_vit.transform(vf)
            wp_p = pca_wst.transform(wp)
            # fused feature via model
            with torch.no_grad():
                vt = torch.tensor(vp, dtype=torch.float32).to(device)
                rt = torch.tensor(rsta, dtype=torch.float32).to(device)
                wt = torch.tensor(wp_p, dtype=torch.float32).to(device)
                ff = model(vt, rt, wt, return_feature=True).cpu().numpy()
            Xc.append(ff.squeeze(0))
            yc.append(0)
        for fp in pneu_files:
            img = Image.open(fp)
            vf = ext.extract_vit_from_pil(img)
            wp = ext.extract_wst_from_pil(img)
            rf, sf = ext.extract_radiomics_stats_from_pil(img)
            sf = scaler_stat.transform(sf)
            rf = scaler_radiomics.transform(rf)
            rsta = np.concatenate([sf, rf], axis=1)
            vp = pca_vit.transform(vf)
            wp_p = pca_wst.transform(wp)
            with torch.no_grad():
                vt = torch.tensor(vp, dtype=torch.float32).to(device)
                rt = torch.tensor(rsta, dtype=torch.float32).to(device)
                wt = torch.tensor(wp_p, dtype=torch.float32).to(device)
                ff = model(vt, rt, wt, return_feature=True).cpu().numpy()
            Xc.append(ff.squeeze(0))
            yc.append(1)
        if len(Xc) > 10:
            Xc = np.stack(Xc, axis=0)
            yc = np.array(yc)
            cal = CalibratedClassifierCV(classifier, method='sigmoid', cv='prefit')
            cal.fit(Xc, yc)
            calibrated_probs = cal.predict_proba(fused_feature)
            print('Calibrated probabilities:', calibrated_probs[0].tolist())
        else:
            print('Not enough samples for calibration')
    else:
        print('Train folders not found; skipping calibration')
except Exception as e:
    print('Calibration step failed:', e)