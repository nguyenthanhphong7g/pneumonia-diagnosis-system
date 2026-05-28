#!/usr/bin/env python3
"""
Step-by-step diagnostic for a single image using the Gated Fusion pipeline.
Saves a short JSON summary and prints intermediate stats for quick inspection.

Usage:
    python scripts/step_by_step_diagnose.py [path/to/image.jpeg]

If no image provided, uses chest_xray/test/NORMAL/IM-0001-0001.jpeg
"""
import sys
from pathlib import Path
import json
import numpy as np
import io
import math

# Fix Windows stdout encoding
if sys.platform == 'win32':
    import io as _io
    sys.stdout = _io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add repo root to path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from models.fusion_api import FusionModelManager
from models.extractors import (
    extract_vit_from_pil,
    extract_wst_from_pil,
    extract_radiomics_stats_from_pil
)
from PIL import Image
import logging
logging.basicConfig(level=logging.INFO, format='[%(name)s] %(message)s')

# Helper functions

def arr_stats(a):
    a = np.asarray(a)
    return {
        'shape': a.shape,
        'dtype': str(a.dtype),
        'mean': float(np.nanmean(a)) if a.size>0 else None,
        'std': float(np.nanstd(a)) if a.size>0 else None,
        'min': float(np.nanmin(a)) if a.size>0 else None,
        'max': float(np.nanmax(a)) if a.size>0 else None,
        'nan_count': int(np.isnan(a).sum()) if np.issubdtype(a.dtype, np.floating) else 0,
    }


def image_brightness_entropy(pil_img):
    # grayscale variance + entropy
    im = pil_img.convert('L')
    a = np.array(im).ravel().astype(np.float32)
    mean = float(a.mean())
    std = float(a.std())
    # entropy
    hist, _ = np.histogram(a, bins=256, range=(0,255), density=True)
    hist = hist[hist>0]
    entropy = float(-np.sum(hist * np.log2(hist)))
    return {'mean': mean, 'std': std, 'entropy': entropy}


def pretty_print(title, d):
    print('\n' + '='*60)
    print(title)
    print('='*60)
    for k,v in d.items():
        print(f"{k}: {v}")


def main(img_path: Path):
    out = {}
    print('Initializing FusionModelManager...')
    mgr = FusionModelManager(model_dir=ROOT / 'ai-service' / 'models' if (ROOT / 'ai-service' / 'models').exists() else ROOT / 'models')
    # Determine actual models dir
    models_dir = mgr.model_dir
    print('Models dir:', models_dir)
    out['models_dir'] = str(models_dir)

    # Load image
    print('\nLoading image:', img_path)
    img = Image.open(img_path).convert('RGB')
    out['image_path'] = str(img_path)
    out['image_size'] = img.size

    # Basic image stats
    ib = image_brightness_entropy(img)
    pretty_print('Image basic stats', ib)
    out['image_stats'] = ib

    # Step 1: ViT features
    print('\nStep 1: Extract ViT features')
    vit = extract_vit_from_pil(img)
    s_vit = arr_stats(vit)
    pretty_print('ViT features', s_vit)
    out['vit_raw_stats'] = s_vit

    # Step 2: WST features
    print('\nStep 2: Extract WST features')
    wst = extract_wst_from_pil(img)
    s_wst = arr_stats(wst)
    pretty_print('WST features', s_wst)
    out['wst_raw_stats'] = s_wst

    # Step 3: Radiomics + Stats
    print('\nStep 3: Extract Radiomics + Stats')
    rad, sta = extract_radiomics_stats_from_pil(img)
    s_rad = arr_stats(rad)
    s_sta = arr_stats(sta)
    pretty_print('Radiomics', s_rad)
    pretty_print('Stats', s_sta)
    out['rad_raw_stats'] = s_rad
    out['sta_raw_stats'] = s_sta

    # Sanity checks for zero/NaN
    def check_zero_like(*arrays):
        return all(np.allclose(a, 0.0, atol=1e-8) for a in arrays)

    zero_like_raw = check_zero_like(vit, wst, rad, sta)
    out['zero_like_raw'] = bool(zero_like_raw)
    if zero_like_raw:
        print('\nWARNING: All extracted raw features are zero-like')

    # Step 4: Apply PCA/scalers (if available)
    print('\nStep 4: Apply PCA and scalers (if available)')
    if mgr.pca_vit_gf is not None:
        vit_pca = mgr.pca_vit_gf.transform(vit)
        s_vit_pca = arr_stats(vit_pca)
        pretty_print('ViT PCA', s_vit_pca)
        out['vit_pca_stats'] = s_vit_pca
    else:
        vit_pca = None
        print('No pca_vit_gf loaded')

    if mgr.pca_wst_gf is not None:
        wst_pca = mgr.pca_wst_gf.transform(wst)
        s_wst_pca = arr_stats(wst_pca)
        pretty_print('WST PCA', s_wst_pca)
        out['wst_pca_stats'] = s_wst_pca
    else:
        wst_pca = None
        print('No pca_wst_gf loaded')

    # Combine rad+sta and scale
    radsta = np.concatenate([rad, sta], axis=1)
    s_radsta = arr_stats(radsta)
    pretty_print('Rad+Sta raw', s_radsta)
    out['radsta_raw_stats'] = s_radsta

    if mgr.scaler_radsta is not None:
        radsta_scaled = mgr.scaler_radsta.transform(radsta)
        s_radsta_scaled = arr_stats(radsta_scaled)
        pretty_print('Rad+Sta scaled', s_radsta_scaled)
        out['radsta_scaled_stats'] = s_radsta_scaled
    else:
        radsta_scaled = radsta
        print('No scaler_radsta loaded')

    # Step 5: Check for NaNs/Infs
    def check_nans_infs(a):
        a = np.asarray(a)
        return {'has_nan': bool(np.isnan(a).any()), 'has_inf': bool(np.isinf(a).any())}

    out['vit_nan_inf'] = check_nans_infs(vit)
    out['wst_nan_inf'] = check_nans_infs(wst)
    out['radsta_nan_inf'] = check_nans_infs(radsta_scaled)
    pretty_print('NaN/Inf checks', {k:v for k,v in out.items() if 'nan_inf' in k})

    # Step 6: Run through Gated Fusion network if available
    print('\nStep 6: Run Gated Fusion forward (get fused features)')
    if mgr.gated_fusion is None:
        print('Gated Fusion NN not loaded; aborting fusion step')
        out['fusion_error'] = 'gated_fusion not loaded'
    else:
        import torch
        vit_in = torch.tensor(vit_pca if vit_pca is not None else vit, dtype=torch.float32).to(mgr.device)
        wst_in = torch.tensor(wst_pca if wst_pca is not None else wst, dtype=torch.float32).to(mgr.device)
        rad_in = torch.tensor(radsta_scaled, dtype=torch.float32).to(mgr.device)
        with torch.no_grad():
            fused = mgr.gated_fusion(vit_in, rad_in, wst_in, return_feature=True)
            fused_np = fused.cpu().numpy()
        s_fused = arr_stats(fused_np)
        pretty_print('Fused features', s_fused)
        out['fused_stats'] = s_fused

        # Step 7: Classifier prediction
        print('\nStep 7: Classifier prediction on fused features')
        try:
            preds = mgr.classifier_gf.predict(fused_np)
            probs = mgr.classifier_gf.predict_proba(fused_np)
            pretty_print('Classifier output', {'pred': int(preds[0]), 'prob_normal': float(probs[0,0]), 'prob_pneumonia': float(probs[0,1])})
            out['classifier_pred'] = int(preds[0])
            out['classifier_probs'] = [float(probs[0,0]), float(probs[0,1])]
        except Exception as e:
            print('Classifier predict failed:', e)
            out['classifier_error'] = str(e)

    # Step 8: Heuristics/warnings
    warnings = []
    if out.get('zero_like_raw'):
        warnings.append('Extracted raw features are zero-like')
    if out.get('vit_nan_inf', {}).get('has_nan') or out.get('vit_nan_inf', {}).get('has_inf'):
        warnings.append('ViT features contain NaN/Inf')
    if out.get('wst_nan_inf', {}).get('has_nan'):
        warnings.append('WST features contain NaN')
    if out.get('radsta_nan_inf', {}).get('has_nan'):
        warnings.append('Rad+Sta contain NaN')
    if warnings:
        pretty_print('Warnings', {'count': len(warnings), 'items': warnings})
        out['warnings'] = warnings

    # Save summary
    out_path = Path.cwd() / 'step_diagnose_summary.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2)
    print('\nSummary saved to', out_path)


if __name__ == '__main__':
    # default image (repo root chest_xray)
    REPO_ROOT = ROOT.parent
    default_img = REPO_ROOT / 'chest_xray' / 'test' / 'NORMAL' / 'IM-0001-0001.jpeg'
    p = Path(sys.argv[1]) if len(sys.argv)>1 else default_img
    if not p.exists():
        print('Image not found:', p)
        sys.exit(1)
    main(p)
