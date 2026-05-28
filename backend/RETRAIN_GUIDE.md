# Hướng dẫn retrain từ backend

## Mục tiêu

Backend thu thập review từ bác sĩ và kích hoạt quá trình retrain cho AI service.

## API chính

### Thống kê training data
```text
GET /api/review/training-data-stats
```

### Danh sách review chưa dùng để train
```text
GET /api/review/unused-for-training
```

### Retrain chỉ với review chưa dùng
```text
POST /api/admin/retrain-unused
```

### Retrain với toàn bộ review
```text
POST /api/admin/retrain-all
```

### Trigger từ controller review
```text
POST /api/review/trigger-retrain?useAllReviews=false
```

## Quy trình

1. Bác sĩ tạo review cho case đã chẩn đoán.
2. Backend lưu review vào database.
3. Admin chọn dùng review nào để train.
4. Backend gửi dữ liệu sang AI service.
5. AI service retrain và trả kết quả.

## Lưu ý

- Chỉ dùng review đã kiểm duyệt.
- Nên kiểm tra lại model sau mỗi lần retrain.
- Theo dõi log backend và AI service nếu retrain thất bại.