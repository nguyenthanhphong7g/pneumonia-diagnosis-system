#!/usr/bin/env python3
"""
Train a fusion classifier (PCA -> concatenate -> RandomForest) and export artifacts.
Saves: pca_vit.pkl, pca_wst.pkl, scaler_radsta.pkl, rf_classifier.pkl

Usage:
  python scripts/train_fusion.py --data ./dataset/chest_xray --out models --max-samples 2000
"""
import argparse
from pathlib import Path
import numpy as np
import joblib
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score


def load_npz(path: Path, name: str):
    p = path / name
    if not p.exists():
        return None
    return np.load(p)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=str, default='./dataset/chest_xray', help='Dataset features root')
    parser.add_argument('--out', type=str, default='./models', help='Output model dir')
    parser.add_argument('--max-samples', type=int, default=0, help='Limit samples for quick tests (0=all)')
    args = parser.parse_args()

    data_root = Path(args.data)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Paths
    train_dir = data_root / 'train'
    test_dir = data_root / 'test'
    val_dir = data_root / 'val'

    # Load arrays
    def safe_load(d, pref):
        if not d.exists():
            return None
        arr = load_npz(d, f'{pref}_train.npy') if 'train' in str(d) else None
        return arr

    # Flexible loading: try to load train/test explicitly
    vit_train = load_npz(train_dir, 'vit_train.npy')
    wst_train = load_npz(train_dir, 'wst_train.npy')
    rad_train = load_npz(train_dir, 'rad_train.npy')
    sta_train = load_npz(train_dir, 'sta_train.npy')
    labels_train = load_npz(train_dir, 'labels.npy')

    vit_test = load_npz(test_dir, 'vit_test.npy')
    wst_test = load_npz(test_dir, 'wst_test.npy')
    rad_test = load_npz(test_dir, 'rad_test.npy')
    sta_test = load_npz(test_dir, 'sta_test.npy')
    labels_test = load_npz(test_dir, 'labels.npy')

    # If train missing, try to use test as train (warning)
    if vit_train is None:
        print('Warning: vit_train not found; falling back to using test set for training (for quick verification).')
        vit_train = vit_test
        wst_train = wst_test
        rad_train = rad_test
        sta_train = sta_test
        labels_train = labels_test
        vit_test = None
        wst_test = None
        rad_test = None
        sta_test = None
        labels_test = None

    # Validate
    if vit_train is None or wst_train is None or rad_train is None or sta_train is None or labels_train is None:
        raise FileNotFoundError('Missing required feature files in data root. Expect vit_*/wst_*/rad_*/sta_*/labels.npy in train/ or test/.')

    # Flatten labels shape
    labels_train = labels_train.reshape(-1)

    # Optionally limit samples
    if args.max_samples and args.max_samples > 0:
        n = min(args.max_samples, vit_train.shape[0])
        vit_train = vit_train[:n]
        wst_train = wst_train[:n]
        rad_train = rad_train[:n]
        sta_train = sta_train[:n]
        labels_train = labels_train[:n]

    print('Shapes:')
    print('vit_train', vit_train.shape)
    print('wst_train', wst_train.shape)
    print('rad_train', rad_train.shape)
    print('sta_train', sta_train.shape)
    print('labels_train', labels_train.shape)

    # PCA on vit and wst preserving 95% variance
    print('Fitting PCA on ViT...')
    pca_vit = PCA(n_components=0.95, svd_solver='full')
    vit_reduced = pca_vit.fit_transform(vit_train)
    print('Vit reduced ->', vit_reduced.shape)

    print('Fitting PCA on WST... (this may take time)')
    pca_wst = PCA(n_components=0.95, svd_solver='full')
    wst_reduced = pca_wst.fit_transform(wst_train)
    print('Wst reduced ->', wst_reduced.shape)

    # Scale rad+sta
    radsta = np.hstack([rad_train, sta_train])
    scaler_radsta = StandardScaler()
    radsta_scaled = scaler_radsta.fit_transform(radsta)
    print('RadSta scaled ->', radsta_scaled.shape)

    # Concatenate features
    X_train = np.hstack([vit_reduced, wst_reduced, radsta_scaled])
    y_train = labels_train
    print('Training feature shape:', X_train.shape)

    # Train RandomForest
    print('Training RandomForest...')
    clf = RandomForestClassifier(n_estimators=200, n_jobs=-1, random_state=42)
    clf.fit(X_train, y_train)

    # Evaluate on test if available
    if vit_test is not None:
        print('Transforming test set...')
        vit_test_reduced = pca_vit.transform(vit_test)
        wst_test_reduced = pca_wst.transform(wst_test)
        radsta_test = np.hstack([rad_test, sta_test])
        radsta_test_scaled = scaler_radsta.transform(radsta_test)
        X_test = np.hstack([vit_test_reduced, wst_test_reduced, radsta_test_scaled])
        y_test = labels_test.reshape(-1)
        preds = clf.predict(X_test)
        acc = accuracy_score(y_test, preds)
        print('Test accuracy:', acc)
        print(classification_report(y_test, preds))
    else:
        print('No separate test set available; trained on provided set (no eval).')

    # Save artifacts
    joblib.dump(pca_vit, out_dir / 'pca_vit.pkl')
    joblib.dump(pca_wst, out_dir / 'pca_wst.pkl')
    joblib.dump(scaler_radsta, out_dir / 'scaler_radsta.pkl')
    joblib.dump(clf, out_dir / 'rf_classifier.pkl')
    print('Saved artifacts to', out_dir)


if __name__ == '__main__':
    main()
