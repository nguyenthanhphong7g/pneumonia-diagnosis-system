# Frontend

Đây là ứng dụng React + Vite cho giao diện chẩn đoán viêm phổi.

## Chạy local

```bash
cd frontend
npm install
npm run dev
```

## Nội dung chính

- Trang chẩn đoán ảnh X-ray.
- Hiển thị kết quả dự đoán và độ tin cậy.
- Hiển thị Grad-CAM nếu có.
- Gọi backend để lưu và truy vấn lịch sử.

## Lưu ý

- Backend mặc định ở `http://localhost:8090`.
- AI service mặc định ở `http://localhost:8000`.
- Nếu đổi cổng, cập nhật trong file cấu hình API.
