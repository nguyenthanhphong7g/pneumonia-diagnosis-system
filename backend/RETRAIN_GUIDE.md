# 🔄 Model Retrain - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Hệ thống hỗ trợ huấn luyện lại mô hình AI dựa trên dữ liệu đánh giá của bác sĩ (Expert Reviews). Dữ liệu này được sử dụng để cải thiện độ chính xác của mô hình.

## 🏗️ Kiến Trúc

### Backend (Java - Spring Boot)
- **TrainingDataService**: Quản lý quá trình export data, gọi retrain
- **ExpertReviewController**: API cho việc review cases
- **AdminController**: API cho admin trigger retrain

### AI Service (Python - FastAPI)
- **GET /**: Kiểm tra trạng thái API
- **POST /predict**: Dự đoán từ ảnh
- **POST /retrain**: Huấn luyện lại model
- **POST /retrain-status**: Kiểm tra trạng thái mô hình

## 🔌 API Endpoints

### 1. Lấy Thống Kê Training Data
```
GET /api/review/training-data-stats
```

**Response:**
```json
{
  "totalReviews": 50,
  "usedForTraining": 20,
  "unusedForTraining": 30,
  "pneumoniaCount": 25,
  "normalCount": 25
}
```

### 2. Lấy Danh Sách Unused Reviews
```
GET /api/review/unused-for-training
```

**Response:**
```json
{
  "count": 30,
  "reviews": [
    {
      "id": 1,
      "diagnosis": {...},
      "finalLabel": "Pneumonia",
      "doctorComment": "...",
      "isUsedForTraining": false,
      "reviewedAt": "2026-05-06T10:30:00"
    }
  ]
}
```

### 3. Trigger Retrain - Unused Reviews Only
```
POST /api/admin/retrain-unused
```

**Response:**
```json
{
  "success": true,
  "message": "Retrain thành công!",
  "samples_processed": 30,
  "timestamp": "2026-05-06T10:35:00"
}
```

### 4. Trigger Retrain - Use All Reviews
```
POST /api/admin/retrain-all
```

**Response:**
```json
{
  "success": true,
  "message": "Retrain thành công!",
  "samples_processed": 50,
  "timestamp": "2026-05-06T10:35:00"
}
```

### 5. Retrain từ ExpertReviewController
```
POST /api/review/trigger-retrain?useAllReviews=false
```

**Query Parameters:**
- `useAllReviews` (boolean): 
  - `false` (default): Chỉ dùng reviews chưa được training
  - `true`: Dùng tất cả reviews

## 🔄 Workflow - Quá Trình Hoạt Động

### Step 1: Bác sĩ Review Cases
```
POST /api/review/submit
{
  "diagnosisId": 123,
  "doctorId": 1,
  "finalLabel": "Pneumonia",
  "doctorComment": "Rõ ràng là viêm phổi"
}
```

Database sẽ lưu:
```
ExpertReview {
  id: 1,
  diagnosis: DiagnosisHistory(123),
  finalLabel: "Pneumonia",
  isUsedForTraining: false  // ← Chưa dùng
}
```

### Step 2: Admin Trigger Retrain
```
POST /api/admin/retrain-unused
```

Backend sẽ:
1. Tìm tất cả reviews có `isUsedForTraining = false`
2. Lấy ảnh từ từng diagnosis
3. Chuẩn bị: `files` + `labels`
4. Gửi tới AI Service: `POST http://localhost:8000/retrain`
5. Nếu thành công, cập nhật `isUsedForTraining = true`

### Step 3: AI Service Retrain
```
POST /api/retrain
- files: [image1.jpg, image2.jpg, ...]
- labels: ["Pneumonia", "Normal", ...]
```

AI Service sẽ:
1. Extract features từ ViT (Vision Transformer)
2. Fit StandardScaler với data mới
3. Retrain Logistic Regression
4. Lưu model mới: `model_lr.pkl` và `scaler.pkl`
5. Return success status

### Step 4: Model được cập nhật
Lần predict tiếp theo sẽ dùng model mới!

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────┐
│  Bác Sĩ Submit Review                   │
│  (finalLabel + doctorComment)           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  ExpertReview (isUsedForTraining=false) │
│  - diagnosis_id, doctor_id              │
│  - finalLabel (Pneumonia/Normal)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Admin Trigger: /retrain-unused         │
│  hoặc /retrain-all                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  TrainingDataService                    │
│  - Collect unused reviews               │
│  - Gather image files                   │
│  - Prepare labels                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  POST to AI Service                     │
│  http://localhost:8000/retrain          │
│  (multipart: files + labels)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  AI Service /retrain Endpoint           │
│  - Extract features (ViT)               │
│  - Fit Scaler + Model                   │
│  - Save: model_lr.pkl, scaler.pkl       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Update isUsedForTraining = true        │
│  for all processed reviews              │
└─────────────────────────────────────────┘
```

## 🚀 Cách Sử Dụng - Admin Dashboard

### Scenario 1: Sau khi có 10 reviews mới
```bash
# 1. Kiểm tra stats
curl http://localhost:8080/api/admin/model-stats

# Response:
# {
#   "totalReviews": 50,
#   "usedForTraining": 40,
#   "unusedForTraining": 10,    ← Có 10 cái mới
#   "pneumoniaCount": 25,
#   "normalCount": 25
# }

# 2. Trigger retrain chỉ với 10 cái mới
curl -X POST http://localhost:8080/api/admin/retrain-unused

# 3. Kiểm tra kết quả
curl http://localhost:8080/api/admin/model-stats

# Response:
# {
#   "totalReviews": 50,
#   "usedForTraining": 50,      ← Đã tăng lên 50
#   "unusedForTraining": 0,     ← Giảm xuống 0
#   "pneumoniaCount": 25,
#   "normalCount": 25
# }
```

### Scenario 2: Retrain Full Model Weekly
```bash
# Mỗi tuần chạy một lần
curl -X POST http://localhost:8080/api/admin/retrain-all

# This will:
# 1. Collect ALL reviews (even used ones)
# 2. Retrain model
# 3. Improve accuracy over time
```

## 🛡️ Error Handling

### Errors có thể xảy ra:

1. **"Không có dữ liệu review để huấn luyện"**
   - Nguyên nhân: Số reviews < 1
   - Giải pháp: Đợi cho tới khi có reviews

2. **"Không tìm thấy file ảnh nào"**
   - Nguyên nhân: File ảnh bị xóa hoặc path sai
   - Giải pháp: Kiểm tra thư mục uploads

3. **"Cần ít nhất 2 sample để huấn luyện"**
   - Nguyên nhân: Số ảnh hợp lệ < 2
   - Giải pháp: Kiểm tra file ảnh

4. **"Không thể gọi AI service"**
   - Nguyên nhân: AI Service không chạy
   - Giải pháp: Check `http://localhost:8000/`

## 📝 Monitoring & Logging

### Backend Logs
```log
🔄 Starting model retrain...
📊 Found 30 reviewed cases
✅ Processed: 1609884534_image.jpg -> Pneumonia
...
📦 Prepared 30 files for training
📤 Sending request to http://localhost:8000/retrain
📥 Response: {"success": true, ...}
✅ Updated 30 reviews as used for training
```

### AI Service Logs
```log
🔄 Starting retrain with 30 samples...
✅ Processed: 1609884534_image.jpg -> Pneumonia
...
📊 Training data shape: (30, 768)
📊 Labels: [15 15]  ← 15 Pneumonia, 15 Normal
✅ Model saved!
```

## 🔐 Security Considerations

1. **Validation**: Kiểm tra label (Pneumonia/Normal) trước khi train
2. **File Paths**: Tránh directory traversal attacks
3. **Rate Limiting**: Không nên retrain quá 5 lần/ngày
4. **Access Control**: Chỉ admin được call `/retrain`

## 📈 Performance Tips

1. **Batch Processing**: Retrain khi có 10+ new reviews
2. **Scheduled**: Chạy retrain vào thời gian ít traffic (night-time)
3. **Monitoring**: Track model accuracy qua time
4. **Backup**: Save model snapshots trước khi retrain

## 🎯 Next Steps

1. Thêm model versioning (model_v1, model_v2, ...)
2. Thêm A/B testing (old model vs new model)
3. Thêm metrics: Accuracy, Precision, Recall
4. Thêm schedule job (auto-retrain hàng ngày)
5. Thêm rollback capability (nếu model mới xấu)

