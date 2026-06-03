# Chương 4: Xây Dựng Hệ Thống Chẩn Đoán Viêm Phổi

## 4.1 Giới Thiệu Hệ Thống

Trong bối cảnh chuyển đổi số trong ngành y tế, các mô hình học sâu đã chứng minh hiệu quả cao trong phát hiện các bệnh lý từ ảnh y tế. Tuy nhiên, để có thể triển khai thực tế trong các cơ sở y tế, các mô hình này không chỉ cần đạt độ chính xác cao mà còn cần được tích hợp vào một hệ thống thông tin toàn diện, dễ sử dụng, đáng tin cậy và tuân thủ các quy định về bảo vệ dữ liệu. Chương này trình bày thiết kế, kiến trúc và triển khai của hệ thống web hỗ trợ chẩn đoán viêm phổi từ ảnh X-quang xương ngực (Chest X-ray).

Hệ thống web này tích hợp ba mô hình chính được phát triển trong các chương trước: DenseNet169 với khả năng sinh ảnh giải thích Grad-CAM, Vision Transformer (ViT) sử dụng kiến trúc Transformer hiện đại, và mạng Gated Fusion kết hợp nhiều chiều dữ liệu thông qua một cơ chế gating tổng hợp. Mục tiêu chính là cung cấp một nền tảng tương tác cho phép bác sĩ lâm sàng lựa chọn, so sánh và đánh giá hiệu suất của các mô hình khác nhau, từ đó nâng cao độ tin cậy của hệ thống hỗ trợ chẩn đoán.

Hệ thống được thiết kế theo mô hình kiến trúc ba lớp hiện đại (Frontend, Backend, AI Service), cho phép tích hợp linh hoạt các mô hình học sâu mà không cần sửa code chính. Các chức năng chính bao gồm: tải và xử lý ảnh X-quang, dự đoán cơ bản bằng một mô hình, lựa chọn mô hình linh hoạt, so sánh nhiều mô hình trên cùng ảnh, sinh ảnh giải thích Grad-CAM, quản lý lịch sử chẩn đoán, và xuất báo cáo dưới các định dạng khác nhau.

---

## 4.2 Yêu Cầu Chức Năng và Kiến Trúc Tổng Thể của Hệ Thống

### 4.2.1 Công Nghệ Sử Dụng

Hệ thống sử dụng một bộ công nghệ hiện đại được lựa chọn dựa trên tính ổn định, khối lượng tài liệu, và khả năng mở rộng:

**Lớp Frontend (Giao Diện Người Dùng)**

Frontend được xây dựng bằng Vite làm công cụ build hiệu suất cao, kết hợp với React hoặc Vue.js để tạo giao diện một trang (SPA - Single Page Application) hoạt động mượt mà và responsive. Các thư viện UI như TailwindCSS hoặc Material-UI cung cấp các thành phần giao diện hiện đại với thiết kế đẹp mắt và dễ sử dụng. Quản lý trạng thái ứng dụng bằng Redux hoặc Context API đảm bảo dữ liệu được đồng bộ nhất quán giữa các component. Giao tiếp với backend thông qua HTTP client Axios hoặc Fetch API với xử lý error và retry logic.

Thư mục chứa code: `frontend/`

**Lớp Backend (Logic Kinh Doanh)**

Backend được xây dựng bằng Spring Boot (Java) vì tính ổn định, loạt thư viện phong phú, và tài liệu chi tiết. Maven được dùng để quản lý dependency và build project. API được thiết kế theo kiến trúc RESTful với JSON payload, cung cấp các endpoint rõ ràng và dễ sử dụng. Hibernate/JPA quản lý truy cập dữ liệu và tương tác với cơ sở dữ liệu. Spring Security kết hợp JWT (JSON Web Token) để xác thực người dùng và quản lý phân quyền. SLF4J + Logback được sử dụng để ghi log chi tiết các hoạt động của hệ thống, hỗ trợ debugging và monitoring.

Thư mục chứa code: `backend/`

**Lớp AI Service (Suy Luận Mô Hình)**

AI Service được viết bằng Python 3.8+ với FastAPI hoặc Flask làm web framework nhẹ và hiệu quả. PyTorch được sử dụng cho DenseNet169 và Gated Fusion, trong khi TensorFlow/Keras được dùng cho Vision Transformer. Scikit-learn cung cấp các công cụ machine learning bổ sung như LogisticRegression cho classifier sau tổng hợp features. OpenCV và Pillow (PIL) xử lý ảnh đầu vào, tiền xử lý, và post-processing. Các artifact mô hình được lưu dưới dạng khác nhau: joblib (`.pkl` cho scikit-learn classifiers), PyTorch (`.pth` cho neural networks), hoặc Keras (`.h5`).

Thư mục chứa code: `ai-service/`

**Cơ Sở Dữ Liệu**

Trong môi trường production, hệ thống sử dụng MS SQL Server hoặc PostgreSQL 12+ để đảm bảo hiệu suất và độ tin cậy cao. Môi trường development có thể sử dụng SQLite nhẹ hơn để giảm độ phức tạp setup ban đầu. Lưu trữ file ảnh có thể là thư mục cục bộ `uploads/` cho development, hoặc dịch vụ cloud như AWS S3 hoặc MinIO cho production nhằm cải thiện khả năng scale.

### 4.2.2 Cơ Sở Dữ Liệu

Cơ sở dữ liệu được thiết kế với các bảng chính sau để lưu trữ thông tin hệ thống:

**Bảng `models` - Quản lý Mô Hình**

Lưu trữ thông tin chi tiết về các mô hình có sẵn trong hệ thống:
- `model_id` (VARCHAR, UNIQUE): Identifiant duy nhất của mô hình (ví dụ: "densenet169", "vit_base", "gated_fusion")
- `model_name` (VARCHAR): Tên mô hình (ví dụ: "DenseNet169", "Vision Transformer")
- `model_version` (VARCHAR): Phiên bản (ví dụ: "v1.0")
- `description` (TEXT): Mô tả chức năng và đặc điểm
- `model_path` (VARCHAR): Đường dẫn file mô hình (`.pth`, `.h5`, hoặc `.pkl`)
- `metrics_json` (NVARCHAR(MAX)): JSON chứa các metric (precision, recall, F1-score, AUC-ROC) tính từ test set
- `status` (VARCHAR): Trạng thái ("ready", "loading", "error")
- `registered_at` (DATETIME): Thời điểm đăng ký mô hình
- `updated_at` (DATETIME): Thời điểm cập nhật lần cuối

**Bảng `inference_results` - Lịch Sử Dự Đoán**

Lưu toàn bộ lịch sử các dự đoán được thực hiện:
- `id` (BIGINT, PRIMARY KEY): Identifiant duy nhất của bản ghi
- `user_id` (INT): Identifiant người dùng thực hiện dự đoán
- `image_file_path` (VARCHAR): Đường dẫn file ảnh gốc
- `model_id` (VARCHAR): Mô hình được sử dụng
- `model_version` (VARCHAR): Phiên bản mô hình
- `prediction` (INT): Kết quả dự đoán (0: Normal, 1: Pneumonia)
- `confidence` (FLOAT): Xác suất dự đoán [0.0, 1.0]
- `inference_time_ms` (INT): Thời gian suy luận (milliseconds)
- `gradcam_path` (VARCHAR): Đường dẫn ảnh Grad-CAM nếu có
- `notes` (NVARCHAR(500)): Ghi chú thêm từ bác sĩ
- `created_at` (DATETIME): Thời điểm thực hiện suy luận

**Bảng `users` - Quản Lý Tài Khoản**

Lưu trữ thông tin tài khoản người dùng:
- `id` (INT, PRIMARY KEY): Identifiant người dùng
- `username` (VARCHAR, UNIQUE): Tên đăng nhập
- `email` (VARCHAR, UNIQUE): Địa chỉ email
- `password_hash` (VARCHAR): Hash mật khẩu (never plain text)
- `full_name` (NVARCHAR): Tên đầy đủ
- `role` (VARCHAR): Vai trò ("admin", "doctor", "user")
- `created_at` (DATETIME): Thời điểm tạo tài khoản

**Bảng `audit_logs` - Ghi Chép Hoạt Động**

Ghi lại tất cả các hành động quan trọng để bảo vệ pháp lý:
- `id` (BIGINT, PRIMARY KEY): Identifiant bản ghi
- `user_id` (INT): Người dùng thực hiện hành động
- `action` (VARCHAR): Loại hành động ("predict", "upload", "download_report")
- `details` (NVARCHAR(MAX)): Chi tiết hành động
- `created_at` (DATETIME): Thời điểm hành động

### 4.2.3 Triển Khai và Vận Hành Hệ Thống

**Môi Trường Phát Triển (Development)**

Trong quá trình phát triển, mỗi developer cần khởi động các service sau trên máy cục bộ:

Frontend dev server với auto-reload:
```bash
cd frontend && npm run dev
```

Backend Spring Boot server:
```bash
cd backend && ./mvnw spring-boot:run
```

AI Service:
```bash
cd ai-service && python main.py
```

Database (nếu dùng Docker):
```bash
docker-compose -f docker-compose.dev.yml up
```

Cách này cho phép phát triển nhanh chóng với hot-reload, giúp developer thấy thay đổi ngay lập tức mà không cần restart.

**Môi Trường Sản Xuất (Production)**

Triển khai production yêu cầu containerization bằng Docker. Mỗi service được đóng gói trong một Docker image riêng:

Dockerfile cho AI Service:
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY ai-service/requirements.txt .
RUN pip install -r requirements.txt
COPY ai-service/ .
EXPOSE 5000
ENV PYTHONUNBUFFERED=1
CMD ["python", "main.py"]
```

Docker Compose hoặc Kubernetes orchestration để quản lý các containers. CI/CD pipeline (GitHub Actions, GitLab CI) tự động: build image, chạy tests, push lên container registry, và deploy lên production với rolling updates để tránh downtime.

---

## 4.3 Luồng Chẩn Đoán Trên Web

Quy trình hoạt động của hệ thống từ khi bác sĩ tải ảnh đến khi nhận được kết quả dự đoán được mô tả chi tiết qua 7 bước sau:

**Bước 1 - Tải Ảnh và Xác Thực (Frontend)**

Bác sĩ lựa chọn file ảnh X-quang từ máy cục bộ thông qua giao diện web. Frontend thực hiện kiểm tra phía client: kiểm tra loại file (JPEG, PNG, DICOM), kích thước (dưới 10 MB), độ phân giải (tối thiểu 128x128). Nếu hợp lệ, hiển thị preview ảnh; nếu không, cảnh báo lỗi cụ thể.

**Bước 2 - Gửi Yêu Cầu Dự Đoán (Frontend → Backend)**

Frontend gửi HTTP POST request tới endpoint `/api/v1/predict` (hoặc `/api/v1/compare` nếu so sánh) kèm theo ảnh được mã hóa base64 hoặc dạng multipart, ID mô hình (hoặc danh sách mô hình), và flag yêu cầu Grad-CAM. Request kèm theo JWT token để xác thực người dùng.

**Bước 3 - Xác Thực và Lưu File (Backend)**

Backend xác thực JWT token, kiểm tra quyền của người dùng. Lưu file ảnh tạm thời trong thư mục `uploads/{user_id}/{timestamp}/`. Tạo bản ghi mới trong bảng `inference_results` với trạng thái "pending". Ghi lại audit log.

**Bước 4 - Gọi AI Service (Backend → AI Service)**

Backend gửi request tới AI Service endpoint `/inference`, chứa đường dẫn file ảnh, danh sách model IDs, và flag `return_gradcam`.

**Bước 5 - Xử Lý Ảnh và Suy Luận (AI Service)**

AI Service thực hiện tiền xử lý: đọc ảnh, resize về 128×128, chuẩn hóa pixel về [0, 1]. Tải mô hình từ disk (nếu first-time) hoặc lấy từ cache. Chạy forward pass qua từng mô hình. Nếu yêu cầu, tính Grad-CAM: tính gradient của logit output đối với feature map cuối, trung bình theo kênh, nhân với feature map, áp dụng ReLU, resize về kích thước gốc, chuẩn hóa và áp dụng colormap.

**Bước 6 - Lưu Kết Quả (Backend)**

Backend nhận response từ AI Service. Lưu ảnh Grad-CAM (nếu có) vào `uploads/{user_id}/{result_id}_gradcam.jpg`. Cập nhật bảng `inference_results` với các giá trị dự đoán, xác suất, thời gian.

**Bước 7 - Hiển Thị Kết Quả (Frontend)**

Frontend nhận JSON response và hiển thị: nhãn dự đoán, xác suất (%), thời gian phản hồi (ms), ảnh Grad-CAM side-by-side với ảnh gốc, slider điều chỉnh opacity, nút so sánh hoặc lưu báo cáo.

---

## 4.4 Triển Khai Chức Năng Chính

### Lựa Chọn Mô Hình (Model Selection)

Endpoint `/api/v1/models` cung cấp danh sách tất cả mô hình với thông tin chi tiết. Frontend hiển thị dưới dạng dropdown, radio button, hoặc card để người dùng dễ dàng lựa chọn. Mỗi lựa chọn kèm theo tên, phiên bản, mô tả, các metric hiệu suất, và thời gian suy luận trung bình. Các tooltip giúp bác sĩ so sánh: DenseNet169 cân bằng tốt (92.4% accuracy, 542ms), ViT nhanh nhưng ít chính xác (90.1%, 735ms), Gated Fusion chính xác nhất (91.8%, 1205ms).

AI Service duy trì cache mô hình trong bộ nhớ. Nếu chưa tải, load từ disk. Auto-unload nếu không sử dụng trong 30 phút để giải phóng bộ nhớ.

### So Sánh Mô Hình (Model Comparison)

Backend endpoint `/api/v1/compare` nhận ảnh, danh sách model IDs, và flag. Lưu ảnh một lần, gửi song song/tuần tự đến AI Service cho từng mô hình. Tập hợp kết quả, tính tổng thời gian.

AI Service tối ưu: tiền xử lý một lần, chạy từng mô hình. Response trả về danh sách dự đoán từng mô hình. Frontend hiển thị bảng so sánh với highlight vùng khác nhau. Bác sĩ có thể click để xem chi tiết hoặc Grad-CAM.

### Đo Lường Hiệu Năng (Performance Metrics)

Backend ghi log: thời gian nhận request, xử lý file, gọi AI Service, lưu DB, trả response. Tính toán latency tổng end-to-end. AI Service ghi log: tiền xử lý, tải mô hình, suy luận, sinh Grad-CAM.

Frontend dashboard hiển thị: biểu đồ cột so sánh thời gian phản hồi, biểu đồ phân tán confidence vs thời gian, biểu đồ lịch sử qua các ngày.

### Grad-CAM và Giải Thích Mô Hình

AI Service tính Grad-CAM cho DenseNet169: forward pass, backward pass tính gradient, trung bình theo kênh, nhân với feature map, ReLU, resize, chuẩn hóa, áp dụng colormap Jet.

Backend lưu ảnh, cung cấp endpoint `/api/v1/gradcam/{result_id}`. Frontend hiển thị side-by-side ảnh gốc và heatmap, slider opacity, vùng màu đỏ/cam là vùng quan tâm.

---

## 4.5 Đánh Giá Hệ Thống và Kết Quả

### Hiệu Suất Mô Hình

Bảng 4.1 so sánh các chỉ số hiệu suất của ba mô hình:

| Mô Hình | Accuracy | Precision | Recall | F1-Score | AUC-ROC | Inference Time (ms) |
|---------|----------|-----------|--------|----------|---------|----------------------|
| DenseNet169 | 92.4% | 92.0% | 91.5% | 91.7% | 0.955 | 542 |
| Vision Transformer | 90.1% | 89.8% | 89.5% | 89.6% | 0.932 | 735 |
| Gated Fusion | 91.8% | 91.5% | 91.0% | 91.2% | 0.948 | 1205 |

DenseNet169 đạt cân bằng tốt nhất giữa độ chính xác (92.4%) và thời gian phản hồi (542ms). Gated Fusion đạt độ chính xác cao (91.8%) nhưng chậm hơn (1205ms). Vision Transformer nhanh hơn nhưng độ chính xác thấp hơn.

### Hiệu Năng Hệ Thống

Đo đạc end-to-end: Single prediction từ 800ms-1500ms, Comparison 3 mô hình từ 2000ms-3500ms.

Throughput: Backend ~50 requests/second, AI Service ~5-10 inference/second trên GPU (hoặc 1-2 trên CPU).

### Khả Năng Mở Rộng

Vertical scaling: Tăng CPU/GPU/RAM cho mỗi service để xử lý nhanh hơn. Horizontal scaling: Load balancer trước multiple backend instances, Kubernetes cho AI Service, DB replicas.

---

## 4.6 Tiểu Kết Chương 4

Chương này đã trình bày thiết kế, kiến trúc, và triển khai của hệ thống web hỗ trợ chẩn đoán viêm phổi từ ảnh X-quang. Hệ thống được xây dựng theo mô hình ba lớp hiện đại (Frontend, Backend, AI Service), cho phép tích hợp linh hoạt các mô hình học sâu mà không cần sửa code chính.

Những đóng góp chính của hệ thống bao gồm: giao diện người dùng thân thiện cho phép lựa chọn và so sánh mô hình, cung cấp ảnh Grad-CAM giải thích quyết định, quản lý toàn bộ lịch sử chẩn đoán với khả năng tìm kiếm và xuất báo cáo, đo lường chi tiết hiệu năng và thời gian phản hồi.

Kết quả đánh giá cho thấy DenseNet169 và Gated Fusion đạt độ chính xác cao (>91%), phù hợp cho triển khai thực tế trong các cơ sở y tế. Tuy nhiên, hệ thống vẫn có những hạn chế cần khắc phục: Grad-CAM chỉ hỗ trợ DenseNet, radiomics bị bỏ qua, không hỗ trợ retrain online, hỗ trợ DICOM hạn chế. Các phiên bản tương lai sẽ khắc phục những hạn chế này và triển khai federated learning để retrain online trên dữ liệu mới.

Với hệ thống này, các bác sĩ và chuyên gia y tế có thể sử dụng một công cụ hỗ trợ chẩn đoán mạnh mẽ, đáng tin cậy, và dễ hiểu, từ đó cải thiện chất lượng chẩn đoán viêm phổi trong thực tế lâm sàng.
