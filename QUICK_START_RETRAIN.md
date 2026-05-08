# 🚀 Model Retrain System - Quick Start Guide

## 📋 Tổng Quan

Hệ thống đã được nâng cấp với tính năng **Model Retrain** - Sử dụng dữ liệu đánh giá của bác sĩ để huấn luyện lại mô hình AI, giúp cải thiện độ chính xác.

---

## 🎯 Quy Trình Hoạt Động

```
Bác sĩ Review → Expert Review lưu DB (isUsedForTraining=false)
                    ↓
Admin Trigger Retrain → Backend collect ảnh + labels
                    ↓
Gửi tới AI Service → Extract features + Train model + Save
                    ↓
Update DB → isUsedForTraining=true
                    ↓
Next Prediction → Use New Model ✨
```

---

## 🔧 Prerequisites

### 1. Backend (Spring Boot) - Đang chạy
```bash
cd backend
mvn spring-boot:run
# Listening on http://localhost:8080
```

### 2. AI Service (Python FastAPI) - Phải khởi động
```bash
cd ai-service
python main.py
# Listening on http://localhost:8000
```

### 3. Database - MSSQL (đã có Pneumonia.mdf)

---

## ✅ Checklist áp dụng

- [ ] Backend đang chạy `http://localhost:8080`
- [ ] AI Service đang chạy `http://localhost:8000`
- [ ] Database MSSQL (Pneumonia.mdf) kết nối
- [ ] Có ít nhất 1 Expert Review đã được submit
- [ ] Có thư mục `backend/uploads/` chứa ảnh

---

## 🚀 Cách Sử Dụng - 3 Cách

### **Cách 1: Sử dụng Postman (Dễ nhất) ⭐**

1. **Import Collection**
   - Mở Postman
   - Chọn: File → Import
   - Chọn file: `Pneumonia_Retrain_API.postman_collection.json`
   - Click Import

2. **Chạy Testing Workflow**
   - Trong collection, chọn folder "Testing Workflow"
   - Chạy từng request theo thứ tự:
     1. "1. Check Current Stats" - xem stats hiện tại
     2. "2. Get Unused Reviews" - xem reviews chưa dùng
     3. "3. Trigger Retrain" - bắt đầu retrain
     4. "4. Check Stats After" - xem kết quả

3. **Xem Responses**
   - Mỗi response sẽ show kết quả JSON
   - Observations → Stats thay đổi từ bước 1 → bước 4

---

### **Cách 2: Sử dụng cURL (Command Line)**

```bash
# 1. Check current stats
curl http://localhost:8080/api/admin/model-stats

# Output:
# {
#   "totalReviews": 50,
#   "usedForTraining": 40,
#   "unusedForTraining": 10,
#   "pneumoniaCount": 25,
#   "normalCount": 25
# }

# 2. Get unused reviews
curl http://localhost:8080/api/admin/unused-reviews

# 3. Trigger retrain with unused reviews
curl -X POST http://localhost:8080/api/admin/retrain-unused

# Output:
# {
#   "success": true,
#   "message": "Retrain thành công!",
#   "samples_processed": 10,
#   "timestamp": "2026-05-06T10:35:00"
# }

# 4. Check stats again
curl http://localhost:8080/api/admin/model-stats

# Output: unusedForTraining should be 0, usedForTraining should be 50
```

---

### **Cách 3: Sử dụng Python Test Script**

```bash
cd d:\TieuLuan\pneumonia-diagnosis-system

python test_retrain.py
```

Output:
```
==================================================
🚀 RETRAIN FUNCTIONALITY TEST
==================================================
Started at: 2026-05-06T10:30:00

==================================================
🧪 Testing AI Service
==================================================
✅ AI Service is running: {"message": "API is running 🚀"}

==================================================
🧪 Testing Backend API
==================================================
✅ Training Data Stats:
   Total Reviews: 50
   Used for Training: 40
   Unused for Training: 10
   Pneumonia: 25
   Normal: 25

==================================================
🧪 Testing Retrain API
==================================================
✅ Retrain successful!
   Message: Retrain thành công!
   Samples: 10
   Time: 2026-05-06T10:35:00

==================================================
📊 TEST SUMMARY
==================================================
AI Service: ✅ OK
Backend API: ✅ OK
Retrain API: ✅ OK
==================================================
```

---

## 📊 Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/model-stats` | GET | Lấy thống kê model |
| `/api/admin/retrain-unused` | POST | Retrain với unused reviews |
| `/api/admin/retrain-all` | POST | Retrain với tất cả reviews |
| `/api/review/training-data-stats` | GET | Lấy training data stats |
| `/api/review/unused-for-training` | GET | Lấy danh sách unused reviews |
| `http://localhost:8000/` | GET | Check AI service |

---

## 🔍 Monitoring - Cách Kiểm Tra Logs

### Backend Logs
```bash
# Sẽ thấy output: 🔄 Starting model retrain...
📊 Found 10 reviewed cases
✅ Processed: 1609884534_image.jpg -> Pneumonia
...
✅ Updated 10 reviews as used for training
```

### AI Service Logs
```bash
# Sẽ thấy output: 🔄 Starting retrain with 10 samples...
✅ Processed: 1609884534_image.jpg -> Pneumonia
...
📊 Training data shape: (10, 1024)
📊 Labels: [5 5]  ← Hoàng hôn Pneumonia, 5 Normal
✅ Model saved!
```

---

## 🎓 Workflow Example - Step by Step

### Scenario: Có 5 bác sĩ review 10 cases mới

**Step 1: Trước retrain**
```bash
curl http://localhost:8080/api/admin/model-stats

Response:
{
  "totalReviews": 50,
  "usedForTraining": 40,
  "unusedForTraining": 10,    ← 10 cái mới
  "pneumoniaCount": 25,
  "normalCount": 25
}
```

**Step 2: Xem chi tiết unused reviews**
```bash
curl http://localhost:8080/api/admin/unused-reviews

Response:
{
  "count": 10,
  "reviews": [
    {
      "id": 41,
      "diagnosis": {"id": 25, "imagePath": "/uploads/...jpg"},
      "finalLabel": "Pneumonia",
      "doctorComment": "...",
      "isUsedForTraining": false
    },
    ... 9 more ...
  ]
}
```

**Step 3: Trigger retrain**
```bash
curl -X POST http://localhost:8080/api/admin/retrain-unused

Response:
{
  "success": true,
  "message": "Retrain thành công!",
  "samples_processed": 10,
  "timestamp": "2026-05-06T10:35:00"
}
```

**Step 4: Verify - Stats sau retrain**
```bash
curl http://localhost:8080/api/admin/model-stats

Response:
{
  "totalReviews": 50,
  "usedForTraining": 50,      ← Tăng lên 50!
  "unusedForTraining": 0,     ← Xuống 0!
  "pneumoniaCount": 25,
  "normalCount": 25
}
```

**Result**: Model mới đã được train! Lần predict tiếp theo sẽ dùng model cập nhật. ✨

---

## 🎛️ API Comparison

### Endpoint mới cho Backend:
```
/api/review/trigger-retrain        (POST) - ExpertReviewController
/api/review/training-data-stats    (GET)  - ExpertReviewController
/api/review/unused-for-training    (GET)  - ExpertReviewController
/api/admin/model-stats             (GET)  - AdminController
/api/admin/retrain-unused          (POST) - AdminController
/api/admin/retrain-all             (POST) - AdminController
/api/admin/unused-reviews          (GET)  - AdminController
```

### Endpoint mới cho AI Service:
```
POST /retrain              - Retrain model với dữ liệu mới
POST /retrain-status       - Check model status
```

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Không có dữ liệu review để huấn luyện" | Cần có ít nhất 1 expert review |
| "Không tìm thấy file ảnh nào" | Kiểm tra thư mục `backend/uploads/` |
| "localhost:8000 refused connection" | Khởi động AI Service: `python main.py` |
| "Cần ít nhất 2 sample để huấn luyện" | Cần ít nhất 2 ảnh valid |
| Model không cập nhật | Restart AI service hoặc backend |

---

## 📈 What Happens After Retrain?

1. ✅ Model `model_lr.pkl` được cập nhật
2. ✅ Scaler `scaler.pkl` được điều chỉnh với data mới
3. ✅ Database: `isUsedForTraining = true` cho 10 reviews
4. ✅ Lần predict kế tiếp → Dùng model mới

### Impact trên Predictions:
- **Trước**: Model dùng 40 training samples
- **Sau**: Model dùng 50 training samples
- **Result**: Độ chính xác cải thiện (dự kiến)

---

## 🔐 Security Notes

1. **Admin Only**: `/api/admin/*` chỉ dành cho admin
2. **Rate Limit**: Tối đa 5 lần retrain/ngày
3. **File Validation**: Kiểm tra file format trước xử lý
4. **Label Validation**: Chỉ chấp nhận "Pneumonia" hoặc "Normal"

---

## 📚 Documentation Files

- 📄 `RETRAIN_IMPLEMENTATION_SUMMARY.md` - Tổng quan implementation
- 📄 `backend/RETRAIN_GUIDE.md` - Chi tiết backend API
- 📄 `ai-service/RETRAIN_GUIDE.md` - Chi tiết AI service
- 🧪 `test_retrain.py` - Test script
- 📦 `Pneumonia_Retrain_API.postman_collection.json` - Postman collection

---

## 🎯 Best Practices

1. **Retrain Timing**: Làm khi có 10+ new reviews
2. **Batch Training**: Retrain weekly/monthly (không hàng ngày)
3. **Monitor**: Track accuracy metrics qua thời gian
4. **Backup**: Lưu backup model cũ trước retrain
5. **Validate**: Test new model trước production

---

## 🎬 Quick Demo (5 phút)

```bash
# 1. Terminal 1 - Backend (nếu chưa chạy)
cd backend
mvn spring-boot:run

# 2. Terminal 2 - AI Service (nếu chưa chạy)
cd ai-service
python main.py

# 3. Terminal 3 - Test
cd /
python test_retrain.py

# 4. Hoặc dùng Postman Collection
# Import Pneumonia_Retrain_API.postman_collection.json
# Chạy testing workflow
```

---

## ✨ Summary

**Tính năng mới added:**
- [x] Backend service: `TrainingDataService`
- [x] Backend controller: `AdminController`
- [x] AI endpoint: `/retrain`, `/retrain-status`
- [x] Database field: `isUsedForTraining` (đã có)
- [x] API endpoints: 7 new endpoints
- [x] Documentation: 3 guide files
- [x] Test script: `test_retrain.py`
- [x] Postman collection: `Pneumonia_Retrain_API.postman_collection.json`

**Ready to test!** 🚀

---

**Created: May 6, 2026**  
**Status: ✅ Implementation Complete**

