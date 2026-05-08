# 🤖 AI Service - Retrain Guide

## 📌 API Endpoints

### 1. Predict (Existing)
```
POST /predict
Content-Type: multipart/form-data

file: <image_file>
```

**Response:**
```json
{
  "label": "Pneumonia",
  "confidence": 0.9543
}
```

### 2. Retrain (NEW)
```
POST /retrain
Content-Type: multipart/form-data

files: [image1.jpg, image2.jpg, ...]
labels: '["Pneumonia", "Normal", "Pneumonia", ...]'
```

**Description:**
- `files`: Danh sách các file ảnh để training
- `labels`: JSON array chứa labels tương ứng

**Response:**
```json
{
  "success": true,
  "message": "Retrain thành công!",
  "samples_processed": 30,
  "timestamp": "2026-05-06T10:35:00"
}
```

### 3. Retrain Status (NEW)
```
POST /retrain-status
```

**Response:**
```json
{
  "model_loaded": true,
  "scaler_loaded": true,
  "device": "cuda",
  "timestamp": "2026-05-06T10:35:00"
}
```

## 🔧 Implementation Details

### Retrain Process
1. **Receive Files**: Nhận danh sách ảnh và labels
2. **Validate**: Kiểm tra số files == số labels
3. **Extract Features**: Dùng ViT để extract features từ mỗi ảnh
4. **Scale**: Fit StandardScaler với data mới
5. **Train**: Fit LogisticRegression với scaled data
6. **Save**: Lưu model và scaler mới
7. **Return**: Trả về success status

### Feature Extraction (ViT)
```python
# Input: Image (224x224, RGB)
# Process:
#   1. Resize to 224x224
#   2. Pass through ViT (Google Vision Transformer)
#   3. Extract CLS token (first token from last_hidden_state)
# Output: 1024-dim feature vector
```

### Model Architecture
```
Input Image (224x224)
    ↓
ViT Feature Extraction
    ↓
1024-dim Vector
    ↓
StandardScaler (fit with all training data)
    ↓
Scaled Features
    ↓
LogisticRegression (C=1.0, max_iter=1000)
    ↓
Prediction (0 or 1)
    ↓
Output: "Normal" or "Pneumonia"
```

## 📊 Example Usage

### Python Client
```python
import requests
from pathlib import Path

# Prepare files
images = [
    Path("pneumonia1.jpg"),
    Path("pneumonia2.jpg"),
    Path("normal1.jpg"),
    Path("normal2.jpg"),
]

labels = ["Pneumonia", "Pneumonia", "Normal", "Normal"]

# Send to retrain endpoint
files = [("files", open(img, "rb")) for img in images]
data = {"labels": str(labels).replace("'", '"')}

response = requests.post(
    "http://localhost:8000/retrain",
    files=files,
    data=data
)

print(response.json())
```

### cURL
```bash
curl -X POST http://localhost:8000/retrain \
  -F "files=@pneumonia1.jpg" \
  -F "files=@pneumonia2.jpg" \
  -F "files=@normal1.jpg" \
  -F "files=@normal2.jpg" \
  -F 'labels=["Pneumonia", "Pneumonia", "Normal", "Normal"]'
```

## 🚨 Error Cases

### Case 1: Files and Labels Mismatch
```
files: [image1.jpg, image2.jpg]
labels: ["Pneumonia"]  ← Only 1 label!

Response:
{
  "success": false,
  "error": "Số lượng files (2) không khớp với labels (1)"
}
```

### Case 2: Less than 2 Samples
```
files: [image1.jpg]  ← Only 1 image

Response:
{
  "success": false,
  "error": "Cần ít nhất 2 sample để huấn luyện"
}
```

### Case 3: Invalid Image
```
files: [invalid.txt]  ← Not an image

Response:
{
  "success": false,
  "error": "Error processing invalid.txt: ..."
}
```

## 📝 Logging Output

When retrain is called, you'll see logs like:

```log
🔄 Starting retrain with 30 samples...
✅ Processed: pneumonia_001.jpg -> Pneumonia
✅ Processed: pneumonia_002.jpg -> Pneumonia
...
✅ Processed: normal_015.jpg -> Normal
📊 Training data shape: (30, 1024)
📊 Labels: [15 15]
✅ Model saved!
```

## 🔄 Model versioning (Optional)

For production, consider saving model versions:

```python
from datetime import datetime

# Instead of:
joblib.dump(model, "model_lr.pkl")

# Do:
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
joblib.dump(model, f"models/model_lr_{timestamp}.pkl")
joblib.dump(scaler, f"models/scaler_{timestamp}.pkl")

# Keep current/latest symlink
import os
os.symlink(f"model_lr_{timestamp}.pkl", "model_lr.pkl")
os.symlink(f"scaler_{timestamp}.pkl", "scaler.pkl")
```

## 🎯 Performance Metrics

After retrain, you might want to evaluate:

```python
# Accuracy
from sklearn.metrics import accuracy_score
accuracy = accuracy_score(y_test, predictions)

# Precision & Recall
from sklearn.metrics import precision_recall_fscore_support
precision, recall, f1, _ = precision_recall_fscore_support(y_test, predictions)

# Confusion Matrix
from sklearn.metrics import confusion_matrix
cm = confusion_matrix(y_test, predictions)
```

## ⚡ Requirements

Make sure these are installed:

```bash
pip install fastapi
pip install uvicorn
pip install pillow
pip install numpy
pip install torch
pip install transformers
pip install scikit-learn
pip install joblib
```

## 🚀 Running the Service

### With reload (development):
```bash
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Without reload (production):
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### With specific GPU:
```bash
CUDA_VISIBLE_DEVICES=0 python main.py
```

## 📋 Checklist

- [x] Extract features using ViT
- [x] Fit scaler with new data
- [x] Train LogisticRegression
- [x] Save model and scaler
- [x] Return success/error responses
- [ ] Add model versioning
- [ ] Add metrics tracking
- [ ] Add rollback capability
- [ ] Add health checks

