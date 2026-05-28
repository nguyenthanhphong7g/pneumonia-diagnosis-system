#!/usr/bin/env python3
"""
Train fusion RF using features stored in KLTN_Feature layout or dataset layout.
Supports feature_root pointing to models/KLTN_Feature.

Usage:
  python scripts/train_fusion_klt.py --feature-root ./models/KLTN_Feature --labels ./dataset/chest_xray/train/labels.npy --out ./models --max-samples 1000
"""
import argparse
from pathlib import Path
import numpy as np
import joblib
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score


def load_if_exists(p: Path):
    if p is None:
        return None
    if not p.exists():
        return None
    return np.load(p)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--feature-root', type=str, help='Root where KLTN_Feature is located (e.g., models/KLTN_Feature)')
    parser.add_argument('--data', type=str, default='./dataset/chest_xray', help='Fallback data root with train/test folders')
    parser.add_argument('--labels', type=str, default=None, help='Path to labels numpy file if not under data root')
    parser.add_argument('--out', type=str, default='./models', help='Output models dir')
    parser.add_argument('--max-samples', type=int, default=0, help='Limit samples for quick tests (0=all)')
    args = parser.parse_args()

    feature_root = Path(args.feature_root) if args.feature_root else None
    data_root = Path(args.data)
    out_dir = Path(args.out); out_dir.mkdir(parents=True, exist_ok=True)

    # Candidate paths
    def fr_path(ftype, split):
        return feature_root / f'{ftype}' / 'X-ray' / f'{ftype}_{split}.npy'

    # Load from feature_root if provided
    vit_train = load_if_exists(fr_path('vit', 'train')) if feature_root else None
    wst_train = load_if_exists(fr_path('wst', 'train')) if feature_root else None
    rad_train = load_if_exists(fr_path('rad', 'train')) if feature_root else None
    sta_train = load_if_exists(fr_path('sta', 'train')) if feature_root else None

    vit_test = load_if_exists(fr_path('vit', 'test')) if feature_root else None
    wst_test = load_if_exists(fr_path('wst', 'test')) if feature_root else None
    rad_test = load_if_exists(fr_path('rad', 'test')) if feature_root else None
    sta_test = load_if_exists(fr_path('sta', 'test')) if feature_root else None

    # labels
    labels_train = None
    labels_test = None
    if args.labels:
        labels_train = load_if_exists(Path(args.labels))
    else:
        # try conventional
        labels_train = load_if_exists(data_root / 'train' / 'labels.npy')
        labels_test = load_if_exists(data_root / 'test' / 'labels.npy')

    # Fallback: try dataset layout if feature_root not provided or missing
    if vit_train is None:
        def dl(pname, split):
            p = data_root / split / pname
            return load_if_exists(p)
        vit_train = vit_train or dl('vit_train.npy','train')
        wst_train = wst_train or dl('wst_train.npy','train')
        rad_train = rad_train or dl('rad_train.npy','train')
        sta_train = sta_train or dl('sta_train.npy','train')
        vit_test = vit_test or dl('vit_test.npy','test')
        wst_test = wst_test or dl('wst_test.npy','test')
        rad_test = rad_test or dl('rad_test.npy','test')
        sta_test = sta_test or dl('sta_test.npy','test')
        if labels_train is None:
            labels_train = load_if_exists(data_root / 'train' / 'labels.npy')
            labels_test = labels_test or load_if_exists(data_root / 'test' / 'labels.npy')

    # Validate
    if vit_train is None or wst_train is None or rad_train is None or sta_train is None:
        raise FileNotFoundError('Could not locate all required feature files (vit/wst/rad/sta) for train split.')

    if labels_train is None:
        raise FileNotFoundError('Labels not found for training. Provide --labels or place labels.npy under data/train or data/test')

    # reshape labels
    labels_train = labels_train.reshape(-1)

    # limit samples
    if args.max_samples and args.max_samples > 0:
        n = min(args.max_samples, vit_train.shape[0])
        vit_train = vit_train[:n]
        wst_train = wst_train[:n]
        rad_train = rad_train[:n]
        sta_train = sta_train[:n]
        labels_train = labels_train[:n]

    print('Loaded shapes:')
    print('vit_train', getattr(vit_train,'shape',None))
    print('wst_train', getattr(wst_train,'shape',None))
    print('rad_train', getattr(rad_train,'shape',None))
    print('sta_train', getattr(sta_train,'shape',None))
    print('labels_train', labels_train.shape)

    # PCA
    print('Fitting PCA for ViT (95%)')
    pca_vit = PCA(n_components=0.95, svd_solver='full')
    vit_red = pca_vit.fit_transform(vit_train)
    print('vit reduced:', vit_red.shape)

    print('Fitting PCA for WST (95%)')
    pca_wst = PCA(n_components=0.95, svd_solver='full')
    wst_red = pca_wst.fit_transform(wst_train)
    print('wst reduced:', wst_red.shape)

    # scale rad+sta
    radsta = np.hstack([rad_train, sta_train])
    scaler = StandardScaler()
    radsta_scaled = scaler.fit_transform(radsta)
    print('radsta scaled:', radsta_scaled.shape)

    X = np.hstack([vit_red, wst_red, radsta_scaled])
    y = labels_train
    print('Final X shape:', X.shape)

    clf = RandomForestClassifier(n_estimators=200, n_jobs=-1, random_state=42)
    print('Training RF...')
    clf.fit(X, y)

    # Eval on test if available
    if vit_test is not None and labels_test is not None:
        print('Evaluating on test set...')
        vit_t = pca_vit.transform(vit_test)
        wst_t = pca_wst.transform(wst_test)
        radsta_t = scaler.transform(np.hstack([rad_test, sta_test]))
        X_t = np.hstack([vit_t, wst_t, radsta_t])
        y_t = labels_test.reshape(-1)
        preds = clf.predict(X_t)
        print('Test acc:', accuracy_score(y_t, preds))
        print(classification_report(y_t, preds))
    else:
        print('No test eval performed (test features or labels missing).')

    # Save artifacts
    joblib.dump(pca_vit, out_dir / 'pca_vit.pkl')
    joblib.dump(pca_wst, out_dir / 'pca_wst.pkl')
    joblib.dump(scaler, out_dir / 'scaler_radsta.pkl')
    joblib.dump(clf, out_dir / 'rf_classifier.pkl')
    print('Saved artifacts to', out_dir)


if __name__ == '__main__':
    main()
