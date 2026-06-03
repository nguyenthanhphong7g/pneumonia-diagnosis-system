# Hướng Dẫn Tái Hiện Lại Model Gated Fusion

Tài liệu này hướng dẫn từng bước cách chạy lại training pipeline `train_gated_fusion_local.py` để tái hiện lại kết quả từ `full_run_20260526`.

---

## 📋 Điều Kiện Tiên Quyết

### 1. Môi Trường Python
```bash
cd ai-service
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements-frozen.txt
```

### 2. Cấu Trúc Thư Mục Bắt Buộc
```
ai-service/
├── dataset/
│   └── chest-xray/
│       ├── train/
│       │   ├── images.npy         # Training images
│       │   └── labels.npy         # Training labels (0=NORMAL, 1=PNEUMONIA)
│       └── test/
│           ├── images.npy         # Test images
│           └── labels.npy         # Test labels
├── models/
│   ├── gated_fusion_model.pth     # Pre-trained GatedFusion model
│   ├── pca_vit.pkl                # PCA scaler cho ViT features
│   ├── pca_wst.pkl                # PCA scaler cho WST features
│   ├── scaler_radsta.pkl          # StandardScaler cho Radiomics+Stats
│   ├── scaler_vit.pkl             # (Optional) StandardScaler cho ViT
│   └── scaler_wst.pkl             # (Optional) StandardScaler cho WST
└── scripts/
    └── train_gated_fusion_local.py # Training script
```

### 3. Kiểm Tra File Tồn Tại
```bash
# Trong thư mục ai-service
ls dataset/chest-xray/train/images.npy
ls dataset/chest-xray/test/images.npy
ls models/gated_fusion_model.pth
ls models/pca_vit.pkl
ls models/pca_wst.pkl
ls models/scaler_radsta.pkl
```

---

## 🚀 Các Bước Chạy Training

### Bước 1: Kích Hoạt Môi Trường
```bash
cd d:\TieuLuan\pneumonia-diagnosis-system\ai-service

# On Windows:
.\venv\Scripts\Activate.ps1

# On macOS/Linux:
source venv/bin/activate
```

### Bước 2: Xác Nhận Các File Đầu Vào
```python
import os
import numpy as np

# Kiểm tra dataset
train_images = np.load('dataset/chest-xray/train/images.npy')
train_labels = np.load('dataset/chest-xray/train/labels.npy')
test_images = np.load('dataset/chest-xray/test/images.npy')
test_labels = np.load('dataset/chest-xray/test/labels.npy')

print(f"Train images shape (trước chia): {train_images.shape}")  # Expected: (5232, 224, 224)
print(f"Train labels shape: {train_labels.shape}")  # Expected: (5232,)
print(f"Test images shape: {test_images.shape}")  # Expected: (624, 224, 224)
print(f"Test labels shape: {test_labels.shape}")  # Expected: (624,)
print(f"Unique labels: {np.unique(train_labels)}")  # Should be [0, 1]

# Dự kiến sau chia train/val 90/10:
# - Train set: 5232 * 0.9 = 4708 images
# - Val set: 5232 * 0.1 = 524 images  
# - Test set: 624 images (không thay đổi)
```

### Bước 3: Chạy Training Script
```bash
python scripts/train_gated_fusion_local.py
```

**Output dự kiến:**
```
Loading train/test images...
Train images shape (trước chia): (5232, 224, 224)
Test images shape: (624, 224, 224)

Stratified train/val split (90/10)...
Train set: 4708 images
Val set: 524 images

Loading pre-trained models and scalers...
GatedFusion model loaded
PCA and scalers loaded

Extracting features...
[Feature Extraction Progress...]
Train features extracted: 6738.47s
Val features extracted: 1699.34s
Test features extracted: 1089.94s

Running PCA...
PCA completed

Training LogisticRegression classifier...
Classifier trained

Evaluating on validation set...
Validation Accuracy: 0.9618
Validation Precision: 0.9957
Validation Recall: 0.9595
Validation F1-Score: 0.9774
Validation AUC: 0.9968

Evaluating on test set...
Test Accuracy: 0.9135
Test Precision: 0.8973
Test Recall: 0.9167
Test F1-Score: 0.9069
Test AUC: 0.9569

Metrics saved to: models/gated_fusion_metrics.json
Classifier saved to: models/classifier.pkl
```

---

## 📊 Kiểm Tra Kết Quả

### Bước 4: Xem Kết Quả Metrics
```bash
# Windows
type models\gated_fusion_metrics.json

# macOS/Linux
cat models/gated_fusion_metrics.json
```

**Cấu trúc file metrics dự kiến:**
```json
{
  "train_samples": 4708,
  "val_samples": 524,
  "test_samples": 624,
  "feature_dim": 64,
  "val_metrics": {
    "accuracy": 0.9618,
    "precision": 0.9957,
    "recall": 0.9595,
    "f1_score": 0.9774,
    "roc_auc": 0.9968
  },
  "test_metrics": {
    "accuracy": 0.9135,
    "precision": 0.8973,
    "recall": 0.9167,
    "f1_score": 0.9069,
    "roc_auc": 0.9569
  },
  "feature_extraction_time_seconds": {
    "train": 6738.47,
    "val": 1699.34,
    "test": 1089.94
  }
}
```

### Bước 5: So Sánh với Benchmark
```python
import json

# Load kết quả vừa chạy
with open('models/gated_fusion_metrics.json') as f:
    current_metrics = json.load(f)

# Load benchmark từ full_run_20260526_run2
with open('models/full_run_20260526_run2/gated_fusion_metrics.json') as f:
    benchmark_metrics = json.load(f)

print("=== Benchmark (full_run_20260526_run2) ===")
print(f"Test Accuracy: {benchmark_metrics['test_metrics']['accuracy']:.4f}")
print(f"Test F1-Score: {benchmark_metrics['test_metrics']['f1_score']:.4f}")

print("\n=== Current Run ===")
print(f"Test Accuracy: {current_metrics['test_metrics']['accuracy']:.4f}")
print(f"Test F1-Score: {current_metrics['test_metrics']['f1_score']:.4f}")

print("\n=== Sự Khác Biệt ===")
acc_diff = current_metrics['test_metrics']['accuracy'] - benchmark_metrics['test_metrics']['accuracy']
f1_diff = current_metrics['test_metrics']['f1_score'] - benchmark_metrics['test_metrics']['f1_score']
print(f"Accuracy difference: {acc_diff:+.4f}")
print(f"F1-Score difference: {f1_diff:+.4f}")
```

---

## 🔧 Troubleshooting

### Lỗi: File Not Found - images.npy
**Nguyên nhân:** Datasets chưa được chuẩn bị hoặc đường dẫn sai
```bash
# Kiểm tra:
ls -la dataset/chest-xray/
```
**Giải pháp:** 
- Chạy data preparation script hoặc
- Copy files từ backup location

### Lỗi: CUDA Out of Memory
**Nguyên nhân:** GPU memory không đủ khi trích xuất features
```bash
# Giải pháp 1: Sử dụng CPU
# Sửa trong code: torch.device('cpu')

# Giải pháp 2: Giảm batch size (nếu có)
```

### Lỗi: PCA/Scaler File Missing
**Nguyên nhân:** Pre-trained models chưa được chuẩn bị
```bash
# Kiểm tra:
ls models/pca_*.pkl models/scaler_*.pkl
```
**Giải pháp:**
- Đảm bảo đã chạy train_gated_fusion.py trước:
```bash
python scripts/train_gated_fusion.py
```

### Lỗi: Shape Mismatch
**Nguyên nhân:** Images có kích thước khác 224x224
```python
# Debug:
import numpy as np
images = np.load('dataset/chest-xray/train/images.npy')
print(f"Images shape: {images.shape}")
print(f"Image min/max: {images.min()}, {images.max()}")
```

### Kết Quả Khác Biệt Với Benchmark
**Nguyên nhân:**
- Thay đổi data split (seed khác)
- Pre-trained models khác nhau
- Library version khác

**Kiểm tra:**
```python
# Trong train_gated_fusion_local.py, k=4 line chứa seed:
# np.random.seed(42)
# random.seed(42)
# torch.manual_seed(42)
```

---

## 📝 Ghi Chú Quan Trọng

1. **Quy Trình Chia Dataset:**
   - **Bước 1:** Load train set (5232 images) + test set (624 images)
   - **Bước 2:** Chia train set theo tỷ lệ 90/10 stratified random (seed=42)
     - Train: 5232 × 0.9 = 4708 images
     - Val: 5232 × 0.1 = 524 images
   - **Bước 3:** Test set (624 images) giữ nguyên, không tham gia train/val split
   - **Kết quả cuối:** 4708 train + 524 val + 624 test = 5856 total images

2. **Deterministic Results:**
   - Script đặt seed=42 để kết quả reproducible
   - Tuy nhiên neural network có thể có minor variations

3. **Feature Extraction Time:**
   - ViT: ~1.6s/image
   - WST: ~0.5s/image
   - Radiomics+Stats: ~0.01s/image
   - **Tổng ~4 giờ cho toàn bộ dataset**

4. **Model Size:**
   - GatedFusion model: ~2.4KB (.pth file)
   - Classifier: ~500B (.pkl file)
   - PCA models: ~100KB each

---

## 🎯 Lệnh Nhanh

### Chạy toàn bộ pipeline (từ đầu)
```bash
cd ai-service
.\venv\Scripts\Activate.ps1
python scripts/train_gated_fusion_local.py
```

### Kiểm tra kết quả
```bash
python -c "import json; m = json.load(open('models/gated_fusion_metrics.json')); print(f\"Test Accuracy: {m['test_metrics']['accuracy']:.4f}\")"
```

### Backup kết quả trước khi chạy lại
```bash
# Windows
mkdir models\backup
xcopy models\gated_fusion_metrics.json models\backup\
xcopy models\classifier.pkl models\backup\

# macOS/Linux
mkdir -p models/backup
cp models/gated_fusion_metrics.json models/backup/
cp models/classifier.pkl models/backup/
```

---

## 📚 Tài Liệu Liên Quan

- [FULL_RUN_20260526_RECONSTRUCTED.md](./FULL_RUN_20260526_RECONSTRUCTED.md) - Chi tiết training pipeline
- [TRAIN_MODEL_LOCAL.md](../ai-service/TRAIN_MODEL_LOCAL.md) - Hướng dẫn huấn luyện model từ đầu
- [DIAGNOSIS_PIPELINE_GUIDE.md](./DIAGNOSIS_PIPELINE_GUIDE.md) - Quy trình dự đoán với model
