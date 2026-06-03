#!/usr/bin/env python3
"""
Retrain the Gated Fusion classifier locally from the existing chest-xray numpy splits.

This script:
- loads train/test images from ai-service/dataset/chest-xray/{train,test}/images.npy
- extracts ViT, WST, radiomics, and statistical features using the current extractor stack
- applies the existing PCA/scaler artifacts from the model directory
- runs the GatedFusion network to obtain fused features
- trains a LogisticRegression classifier on the fused features
- prints Accuracy / Precision / Recall / F1 / AUC / Confusion Matrix
- saves the retrained classifier and a metrics JSON summary

Usage:
  cd ai-service
  python scripts/train_gated_fusion_local.py --model-dir ./models --out ./models
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import joblib
import numpy as np
import torch
from PIL import Image
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split


ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from train_gated_fusion import GatedFusion
from models.extractors import (
    extract_vit_from_pil,
    extract_wst_from_pil,
    extract_radiomics_stats_from_pil,
)


def load_npy(path: Path) -> np.ndarray:
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")
    return np.load(path, allow_pickle=False)


def to_pil(image_array: np.ndarray) -> Image.Image:
    array = np.asarray(image_array)
    if array.ndim == 3 and array.shape[-1] == 1:
        array = array[..., 0]
    if array.dtype.kind in ("f", "c"):
        array = np.clip(array * 255.0, 0, 255).astype(np.uint8)
    else:
        array = np.clip(array, 0, 255).astype(np.uint8)
    return Image.fromarray(array, mode="L")


def load_artifact(model_dir: Path, name: str):
    path = model_dir / name
    if not path.exists():
        raise FileNotFoundError(f"Missing artifact: {path}")
    return joblib.load(path)


def resolve_path(value: str | Path) -> Path:
    path = Path(value)
    if path.is_absolute():
        return path
    # If the given relative path already begins with the ROOT folder name
    # (e.g. user passed "ai-service/models" while ROOT is the ai-service folder),
    # strip the leading segment to avoid duplication (ai-service/ai-service/...)
    parts = path.parts
    if parts and parts[0] == ROOT.name:
        path = Path(*parts[1:])
    return (ROOT / path).resolve()


def extract_fused_features(images: np.ndarray, model_dir: Path, max_samples: int = 0) -> tuple[np.ndarray, np.ndarray, float]:
    pca_vit = load_artifact(model_dir, "pca_vit.pkl")
    pca_wst = load_artifact(model_dir, "pca_wst.pkl")
    scaler_vit = load_artifact(model_dir, "scaler_vit.pkl") if (model_dir / "scaler_vit.pkl").exists() else None
    scaler_wst = load_artifact(model_dir, "scaler_wst.pkl") if (model_dir / "scaler_wst.pkl").exists() else None
    scaler_radsta = load_artifact(model_dir, "scaler_radsta.pkl")

    vit_dim = pca_vit.n_components_
    wst_dim = pca_wst.n_components_
    radsta_dim = 105

    fusion_model = GatedFusion(
        vit_dim=vit_dim,
        radsta_dim=radsta_dim,
        wst_dim=wst_dim,
        hidden_dim=64,
        num_classes=2,
    )

    checkpoint_path = model_dir / "gated_fusion_model.pth"
    if not checkpoint_path.exists():
        raise FileNotFoundError(f"Missing checkpoint: {checkpoint_path}")
    fusion_model.load_state_dict(torch.load(checkpoint_path, map_location="cpu"))
    fusion_model.eval()

    total = images.shape[0]
    if max_samples and max_samples > 0:
        total = min(total, max_samples)

    fused_features = []
    labels = []
    start = time.time()

    for index in range(total):
        pil_image = to_pil(images[index])

        vit_features = extract_vit_from_pil(pil_image)
        wst_features = extract_wst_from_pil(pil_image)
        rad_features, stat_features = extract_radiomics_stats_from_pil(pil_image)

        if scaler_vit is not None:
            vit_features = scaler_vit.transform(vit_features)
        if scaler_wst is not None:
            wst_features = scaler_wst.transform(wst_features)

        radsta = np.concatenate([rad_features, stat_features], axis=1)
        radsta = scaler_radsta.transform(radsta)

        vit_pca = pca_vit.transform(vit_features)
        wst_pca = pca_wst.transform(wst_features)

        vit_tensor = torch.tensor(vit_pca, dtype=torch.float32)
        radsta_tensor = torch.tensor(radsta, dtype=torch.float32)
        wst_tensor = torch.tensor(wst_pca, dtype=torch.float32)

        with torch.no_grad():
            fused = fusion_model(vit_tensor, radsta_tensor, wst_tensor, return_feature=True)

        fused_features.append(fused.cpu().numpy().reshape(-1))

        if (index + 1) % 100 == 0 or index + 1 == total:
            elapsed = time.time() - start
            print(f"Processed {index + 1}/{total} samples in {elapsed:.1f}s")

    fused_array = np.asarray(fused_features, dtype=np.float32)
    return fused_array, pca_vit, time.time() - start


def evaluate(name: str, y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray | None) -> dict:
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
        "report": classification_report(y_true, y_pred, zero_division=0, output_dict=True),
    }

    if y_prob is not None and y_prob.shape[1] >= 2:
        try:
            metrics["auc"] = float(roc_auc_score(y_true, y_prob[:, 1]))
        except Exception:
            metrics["auc"] = None
    else:
        metrics["auc"] = None

    print(f"\n{name} metrics")
    print(f"  accuracy : {metrics['accuracy']:.4f}")
    print(f"  precision: {metrics['precision']:.4f}")
    print(f"  recall   : {metrics['recall']:.4f}")
    print(f"  f1       : {metrics['f1']:.4f}")
    print(f"  auc      : {metrics['auc'] if metrics['auc'] is not None else 'n/a'}")
    print(f"  confusion matrix:\n{np.array(metrics['confusion_matrix'])}")

    return metrics


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=str, default="./dataset/chest-xray", help="Root containing train/test images.npy and labels.npy")
    parser.add_argument("--model-dir", type=str, default="./models", help="Directory containing PCA/scaler/checkpoint artifacts")
    parser.add_argument("--out", type=str, default="./models", help="Directory to save retrained classifier and metrics")
    parser.add_argument("--max-train-samples", type=int, default=0, help="Limit number of train samples for quick verification")
    parser.add_argument("--max-test-samples", type=int, default=0, help="Limit number of test samples for quick verification")
    parser.add_argument("--val-size", type=float, default=0.1, help="Fraction of train set to use as validation (e.g. 0.1 for 90/10 split)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    np.random.seed(args.seed)

    data_dir = resolve_path(args.data_dir)
    model_dir = resolve_path(args.model_dir)
    out_dir = resolve_path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    train_images = load_npy(data_dir / "train" / "images.npy")
    train_labels = load_npy(data_dir / "train" / "labels.npy").astype(int).reshape(-1)
    test_images = load_npy(data_dir / "test" / "images.npy")
    test_labels = load_npy(data_dir / "test" / "labels.npy").astype(int).reshape(-1)

    if args.max_train_samples and args.max_train_samples > 0:
        train_images = train_images[: args.max_train_samples]
        train_labels = train_labels[: args.max_train_samples]

    if args.max_test_samples and args.max_test_samples > 0:
        test_images = test_images[: args.max_test_samples]
        test_labels = test_labels[: args.max_test_samples]

    print("Loaded dataset:")
    print(f"  train images: {train_images.shape}, labels: {train_labels.shape}")
    print(f"  test images : {test_images.shape}, labels: {test_labels.shape}")

    x_train_img, x_val_img, y_train, y_val = train_test_split(
        train_images,
        train_labels,
        test_size=args.val_size,
        random_state=args.seed,
        stratify=train_labels,
    )

    print(f"Train/val split: {x_train_img.shape[0]} / {x_val_img.shape[0]}")

    print("\nExtracting fused features for train split...")
    x_train_fused, _, train_extract_time = extract_fused_features(x_train_img, model_dir)

    print("\nExtracting fused features for val split...")
    x_val_fused, _, val_extract_time = extract_fused_features(x_val_img, model_dir)

    print("\nExtracting fused features for test split...")
    x_test_fused, _, test_extract_time = extract_fused_features(test_images, model_dir)

    print("\nTraining classifier on fused features...")
    classifier = LogisticRegression(
        class_weight="balanced",
        max_iter=2000,
        solver="lbfgs",
        random_state=args.seed,
    )
    classifier.fit(x_train_fused, y_train)

    val_pred = classifier.predict(x_val_fused)
    val_prob = classifier.predict_proba(x_val_fused)
    test_pred = classifier.predict(x_test_fused)
    test_prob = classifier.predict_proba(x_test_fused)

    val_metrics = evaluate("Validation", y_val, val_pred, val_prob)
    test_metrics = evaluate("Test", test_labels, test_pred, test_prob)

    classifier_path = out_dir / "lr_classifier_gf.pkl"
    joblib.dump(classifier, classifier_path)
    print(f"\nSaved retrained classifier to: {classifier_path}")

    metrics = {
        "train_samples": int(x_train_fused.shape[0]),
        "val_samples": int(x_val_fused.shape[0]),
        "test_samples": int(x_test_fused.shape[0]),
        "feature_dim": int(x_train_fused.shape[1]),
        "feature_extraction_seconds": {
            "train": float(train_extract_time),
            "val": float(val_extract_time),
            "test": float(test_extract_time),
        },
        "validation": val_metrics,
        "test": test_metrics,
    }

    metrics_path = out_dir / "gated_fusion_metrics.json"
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Saved metrics to: {metrics_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())