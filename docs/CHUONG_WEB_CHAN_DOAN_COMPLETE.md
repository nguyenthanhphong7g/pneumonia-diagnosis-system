# Chương 4: Xây Dựng Hệ Thống Web Hỗ Trợ Chẩn Đoán Viêm Phổi từ Ảnh X-quang

## 4.1 Giới Thiệu

Trong bối cảnh chuyển đổi số trong ngành y tế, các mô hình học sâu đã chứng minh hiệu quả cao trong phát hiện các bệnh lý từ ảnh y tế. Tuy nhiên, để có thể triển khai thực tế trong các cơ sở y tế, các mô hình này không chỉ cần đạt độ chính xác cao mà còn cần được tích hợp vào một hệ thống thông tin toàn diện, dễ sử dụng, đáng tin cậy và tuân thủ các quy định về bảo vệ dữ liệu. Chương này trình bày thiết kế, kiến trúc và triển khai của hệ thống web hỗ trợ chẩn đoán viêm phổi từ ảnh X-quang xương ngực (Chest X-ray), được xây dựng nhằm cho phép các chuyên gia y tế lựa chọn, so sánh và đánh giá hiệu suất của các mô hình học sâu khác nhau trong một môi trường tương tác thân thiện.

Hệ thống web này tích hợp ba mô hình chính được phát triển trong các chương trước: DenseNet169 với khả năng sinh ảnh giải thích Grad-CAM, Vision Transformer (ViT) sử dụng kiến trúc Transformer hiện đại, và mạng Gated Fusion kết hợp nhiều chiều dữ liệu (ViT features, wavelet transform, radiomics, và statistical features) thông qua một cơ chế gating tổng hợp. Mục tiêu chính là cung cấp một nền tảng tương tác cho phép bác sĩ lâm sàng và chuyên gia y tế không chỉ nhận được dự đoán tự động chính xác mà còn có thể hiểu rõ cơ sở của những quyết định đó thông qua các ảnh giải thích trực quan và các chỉ số hiệu suất chi tiết.

## 4.2 Yêu Cầu Hệ Thống và Kiến Trúc Tổng Thể

### 4.2.1 Phân Tích Yêu Cầu

Để xây dựng một hệ thống đáp ứng nhu cầu thực tế của các cơ sở y tế, chúng ta cần phân tích cả yêu cầu chức năng (những gì hệ thống cần phải làm) và yêu cầu phi chức năng (những đặc tính mà hệ thống cần phải có).

#### Yêu Cầu Chức Năng

Hệ thống web phải cung cấp các chức năng sau:

Thứ nhất, **tải và xử lý ảnh X-quang**: Hệ thống cần hỗ trợ tải file ảnh ở các định dạng phổ biến như JPEG, PNG, và tối ưu nhất là định dạng DICOM (Digital Imaging and Medical Communications) được sử dụng rộng rãi trong các bệnh viện. Kích thước file tối đa được phép là 10 MB để đảm bảo thời gian tải hợp lý trên các kết nối mạng yếu tại các cơ sở y tế vùng sâu. Ngoài ra, hệ thống cần thực hiện xác thực định dạng file và cảnh báo người dùng nếu định dạng không được hỗ trợ.

Thứ hai, **dự đoán đơn mô hình**: Khi người dùng chọn một mô hình cụ thể, hệ thống phải gọi mô hình đó và trả về kết quả bao gồm nhãn dự đoán (Normal hoặc Pneumonia), xác suất dự đoán thể hiện mức độ tin cậy (từ 0.0 đến 1.0), và thời gian phản hồi thực tế để bác sĩ có thể đánh giá độ tin cậy của hệ thống.

Thứ ba, **lựa chọn mô hình linh hoạt**: Hệ thống phải cung cấp giao diện cho phép người dùng dễ dàng lựa chọn từ danh sách các mô hình có sẵn (DenseNet169, Vision Transformer, Gated Fusion) mà không cần kiến thức kỹ thuật sâu. Mỗi lựa chọn mô hình cần kèm theo thông tin hữu ích như tên mô hình, phiên bản, mô tả ngắn gọn và hiệu suất dự kiến để giúp bác sĩ lựa chọn phù hợp với nhu cầu của họ.

Thứ tư, **so sánh mô hình**: Để nâng cao độ tin cậy, hệ thống cần hỗ trợ chạy nhiều mô hình trên cùng một ảnh X-quang và hiển thị các kết quả song song trong một bảng so sánh chi tiết. Điều này giúp bác sĩ phát hiện sự không đồng thuận giữa các mô hình, từ đó đưa ra quyết định chẩn đoán cẩn thận hơn.

Thứ năm, **sinh ảnh giải thích (Grad-CAM)**: Để tăng tính minh bạch và tin tưởng vào dự đoán của mô hình, hệ thống cần cung cấp bản đồ kích hoạt (heatmap) cho thấy vùng nào trong ảnh X-quang mà mô hình sử dụng để đưa ra quyết định. Công nghệ Grad-CAM cung cấp một cách hiệu quả để trực quan hóa điều này đặc biệt là cho mô hình DenseNet.

Thứ sáu, **quản lý lịch sử**: Hệ thống phải lưu trữ toàn bộ lịch sử các kết quả chẩn đoán trước đó, cho phép bác sĩ tìm kiếm, lọc theo ngày tháng, mô hình sử dụng, hoặc kết quả dự đoán để tham khảo các trường hợp tương tự trong quá khứ.

Thứ bảy, **xuất báo cáo**: Bác sĩ cần có khả năng xuất kết quả chẩn đoán dưới các định dạng khác nhau như CSV (để phân tích trong Excel hoặc các công cụ thống kê) hoặc PDF (để in và lưu trong hồ sơ bệnh nhân).

Cuối cùng, **xác thực và phân quyền**: Hệ thống phải quản lý tài khoản người dùng, cho phép các cấp độ quyền khác nhau (người dùng bình thường, bác sĩ, quản trị viên) và bảo vệ dữ liệu cá nhân bệnh nhân khỏi truy cập trái phép.

#### Yêu Cầu Phi Chức Năng

Ngoài các chức năng cụ thể, hệ thống cần đáp ứng các đặc tính chất lượng sau:

**Hiệu năng**: Hệ thống cần có thời gian phản hồi nhanh để bác sĩ không bị tác động tiêu cực. Cụ thể, thời gian từ khi người dùng gửi ảnh đến khi nhận được kết quả dự đoán cho một mô hình đơn trên không được vượt quá 3 giây, còn khi so sánh ba mô hình thì tối đa 8 giây. Các yêu cầu này đảm bảo rằng hệ thống có thể được sử dụng trong các tình huống cấp cứu khi cần quyết định nhanh chóng.

**Tin cậy**: Hệ thống cần duy trì tỷ lệ uptime ≥ 99%, tức là chỉ được phép gián đoạn dưới 10 phút trong 7 ngày. Ngoài ra, hệ thống phải xử lý các lỗi một cách graceful (nhẹ nhàng) mà không làm mất dữ liệu hoặc gây hoảng loạn cho người dùng.

**Bảo mật**: Bảo vệ dữ liệu cá nhân bệnh nhân là tối quan trọng. Tất cả dữ liệu truyền tải giữa client và server cần được mã hóa bằng HTTPS/TLS, và hệ thống phải tuân thủ các tiêu chuẩn bảo vệ dữ liệu y tế như HIPAA (Health Insurance Portability and Accountability Act) nếu được triển khai tại Mỹ.

**Khả năng mở rộng**: Hệ thống phải được thiết kế sao cho có thể dễ dàng thêm các mô hình mới mà không cần sửa đổi core logic của backend hoặc frontend. Điều này đảm bảo rằng khi có các mô hình cải tiến hơn trong tương lai, chúng có thể được tích hợp nhanh chóng.

**Dễ bảo trì**: Hệ thống cần cung cấp ghi log chi tiết về tất cả các hoạt động, cấu hình tập trung cho phép quản trị viên thay đổi cài đặt mà không cần redeploy, và hỗ trợ triển khai tự động (CI/CD - Continuous Integration/Continuous Deployment).

### 4.2.2 Kiến Trúc Ba Lớp

Để đáp ứng các yêu cầu nêu trên, hệ thống được thiết kế theo mô hình kiến trúc ba lớp (3-tier architecture), một kiến trúc phổ biến trong phát triển phần mềm hiện đại. Mô hình này tách biệt rõ ràng:

**Lớp Presentation (Giao Diện)**: Các thành phần frontend chạy trên browser của người dùng, bao gồm giao diện người dùng được xây dựng bằng Vite và React/Vue, quản lý trạng thái ứng dụng, và xử lý các yêu cầu HTTP.

**Lớp Business Logic (Logic Kinh Doanh)**: Backend API (Spring Boot) chứa các quy tắc kinh doanh, xác thực người dùng, quản lý file và metadata, và điều phối các gọi đến AI Service.

**Lớp Data (Dữ Liệu)**: Tầng cho phép lưu trữ persistent bao gồm cơ sở dữ liệu (SQL Server, PostgreSQL), lưu trữ file (local hoặc cloud storage), và tùy chọn cache dữ liệu thường truy cập.

Ngoài ba lớp chính, còn có một thành phần chuyên biệt:

**Lớp AI Service (Model Inference)**: Dịch vụ chuyên biệt chạy trên Python/FastAPI, chịu trách nhiệm tải các mô hình học sâu, tiền xử lý ảnh đầu vào, thực hiện suy luận (inference), sinh ảnh giải thích (Grad-CAM), và tính toán các metric.

Cách tách biệt này không chỉ giúp dễ bảo trì mà còn cho phép scale từng lớp độc lập khi tải tăng.

### 4.2.3 Lựa Chọn Công Nghệ

Hệ thống sử dụng một bộ công nghệ hiện đại và được cử nhân lựa chọn dựa trên:

**Frontend**: Sử dụng Vite làm công cụ build vì tốc độ phát triển nhanh, kết hợp với React hoặc Vue.js để xây dựng giao diện một trang (SPA - Single Page Application) hoạt động mượt mà. Các thư viện UI như TailwindCSS hoặc Material-UI cung cấp các thành phần giao diện hiện đại. Quản lý trạng thái bằng Redux hoặc Context API, và HTTP client bằng Axios hoặc Fetch API.

**Backend**: Sử dụng Spring Boot (Java) vì tính ổn định, loạt thư viện phong phú, và khối lượng tài liệu khổng lồ. Maven được dùng để quản lý dependency. API được thiết kế theo kiến trúc RESTful với JSON payload. Hibernate/JPA quản lý truy cập dữ liệu, Spring Security kết hợp JWT để xác thực và phân quyền, SLF4J + Logback để ghi log.

**AI Service**: Viết bằng Python 3.8+ với FastAPI hoặc Flask làm web framework, PyTorch và TensorFlow/Keras cho học sâu, scikit-learn cho các công cụ machine learning bổ sung. Xử lý ảnh bằng OpenCV và Pillow (PIL). Các artifact mô hình được lưu dạng joblib (`.pkl` cho scikit-learn), PyTorch (`.pth`), hoặc Keras (`.h5`).

**Cơ Sở Dữ Liệu**: Production sử dụng MS SQL Server hoặc PostgreSQL, Development có thể dùng SQLite nhẹ hơn để không cần setup máy chủ riêng. Lưu trữ file có thể là thư mục cục bộ `uploads/` hoặc dịch vụ cloud như AWS S3 hoặc MinIO.

### 4.2.4 Thiết Kế Cơ Sở Dữ Liệu

Cơ sở dữ liệu được thiết kế với các bảng chính sau:

Bảng `models` lưu trữ thông tin về các mô hình có sẵn: identif model unique (`model_id`), tên mô hình, phiên bản, mô tả, đường dẫn file mô hình, JSON chứa các metric (precision, recall, F1, AUC) được tính từ tập test trước khi triển khai, trạng thái (ready, loading, error), và các timestamp ghi nhận khi mô hình được đăng ký và cập nhật lần cuối.

Bảng `inference_results` lưu lịch sử tất cả các dự đoán được thực hiện: user_id liên kết tới người dùng, đường dẫn file ảnh, model_id và phiên bản, kết quả dự đoán (0 hoặc 1), xác suất tin cậy, thời gian suy luận (milliseconds), đường dẫn ảnh Grad-CAM nếu có, ghi chú tuỳ chọn từ bác sĩ, và timestamp chỉ ra khi suy luận được thực hiện.

Bảng `users` chứa thông tin tài khoản: tên đăng nhập (unique), email (unique), hash mật khẩu (never plain text), tên đầy đủ, và vai trò (admin, doctor, user) để hỗ trợ phân quyền.

Bảng `audit_logs` (tuỳ chọn) ghi lại tất cả các hành động quan trọng để bảo vệ pháp lý và phát hiện hành vi bất thường: user_id, loại hành động (predict, upload, download_report), chi tiết, và timestamp.

---

## 4.3 Luồng Chẩn Đoán Toàn Bộ

Quy trình hoạt động của hệ thống từ khi bác sĩ tải ảnh đến khi nhận được kết quả được mô tả chi tiết dưới đây qua 7 bước:

**Bước 1 - Tải Ảnh và Xác Thực (Frontend)**: Bác sĩ lựa chọn file ảnh X-quang từ máy cục bộ thông qua giao diện web. Frontend thực hiện kiểm tra khách phía (client-side validation): kiểm tra loại file (JPEG, PNG, DICOM), kích thước (dưới 10 MB), độ phân giải (nên từ 128x128 trở lên). Nếu hợp lệ, hiển thị preview ảnh để bác sĩ xác nhận; nếu không, cảnh báo lỗi cụ thể.

**Bước 2 - Gửi Yêu Cầu Dự Đoán (Frontend → Backend)**: Frontend gửi HTTP POST request tới endpoint `/api/v1/predict` (hoặc `/api/v1/compare` nếu so sánh nhiều mô hình) kèm theo ảnh được mã hóa base64 hoặc dạng multipart, ID mô hình (hoặc danh sách mô hình), và flag yêu cầu Grad-CAM nếu cần. Request kèm theo JWT token để xác thực người dùng.

**Bước 3 - Xác Thực và Lưu File (Backend)**: Backend xác thực JWT token, kiểm tra quyền của người dùng. Lưu file ảnh tạm thời trong thư mục `uploads/{user_id}/{timestamp}/`. Tạo bản ghi mới trong bảng `inference_results` với trạng thái "pending". Ghi lại timestamp và user_id vào bảng `audit_logs`.

**Bước 4 - Gọi AI Service (Backend → AI Service)**: Backend gửi request tới AI Service qua HTTP endpoint `/inference`, chứa đường dẫn file ảnh, danh sách model IDs, và flag `return_gradcam`.

**Bước 5 - Xử Lý Ảnh và Suy Luận (AI Service)**: AI Service thực hiện tiền xử lý: đọc ảnh từ file, resize về 128×128, chuẩn hóa pixel về khoảng [0, 1]. Tải các mô hình từ disk nếu chưa được tải (first use) hoặc lấy từ cache nếu đã tải trước đó. Chạy forward pass qua từng mô hình để lấy logits và xác suất. Nếu yêu cầu, tính Grad-CAM bằng cách: tính gradient của logit output đối với bản đồ đặc trưng (feature map) cuối cùng, trung bình gradient theo kênh, nhân với bản đồ đặc trưng, áp dụng ReLU để lấy phần positive, resize heatmap về kích thước gốc, chuẩn hóa về [0, 255], và áp dụng colormap (Jet hoặc Viridis).

**Bước 6 - Lưu Kết Quả (Backend)**: Backend nhận response từ AI Service chứa dự đoán, xác suất, thời gian suy luận. Nếu có Grad-CAM, lưu ảnh vào `uploads/{user_id}/{result_id}_gradcam.jpg`. Cập nhật bảng `inference_results` với các giá trị này. Commit transaction.

**Bước 7 - Hiển Thị Kết Quả (Frontend)**: Frontend nhận JSON response từ Backend và hiển thị:
- Nhãn dự đoán (Normal hoặc Pneumonia)
- Xác suất dự đoán theo phần trăm
- Thời gian phản hồi tổng (ms)
- Ảnh Grad-CAM side-by-side với ảnh gốc (vùng màu đỏ/cam chỉ ra vùng mô hình quan tâm)
- Slider điều chỉnh opacity của Grad-CAM overlay
- Nút để so sánh với các mô hình khác hoặc lưu báo cáo

---

## 4.4 Triển Khai Chi Tiết Các Chức Năng Chính

### 4.4.1 Lựa Chọn Mô Hình (Model Selection)

Lựa chọn mô hình là một chức năng quan trọng giúp bác sĩ dựa vào nhu cầu cụ thể (ưu tiên độ chính xác hay tốc độ) để chọn mô hình phù hợp. Chục năng này được triển khai qua:

Endpoint `/api/v1/models` cung cấp danh sách tất cả mô hình có sẵn dưới dạng JSON chi tiết. Mỗi mô hình bao gồm: model_id (unique identifier), tên độc quyền, phiên bản, mô tả chức năng, trạng thái sẵn sàng, các metric hiệu suất (accuracy, precision, recall, F1-score, AUC-ROC), thời gian suy luận trung bình, backend được hỗ trợ (GPU hoặc CPU).

Frontend hiển thị danh sách mô hình dưới dạng dropdown, radio button, hoặc card để người dùng dễ dàng lựa chọn. Mỗi lựa chọn đi kèm tooltip giải thích sự khác biệt: DenseNet169 cân bằng tốt giữa độ chính xác (92.4%) và tốc độ (542ms), Vision Transformer nhanh nhưng độ chính xác thấp hơn (90.1%), Gated Fusion chính xác nhất (91.8%) nhưng chậm hơn (1205ms) do tính toán fusion phức tạp.

AI Service duy trì cache các mô hình đã tải trong bộ nhớ để tránh tải lại lần lượt. Nếu mô hình chưa được tải, hệ thống load từ disk (`.pth` cho PyTorch, `.h5` cho Keras, `.pkl` cho scikit-learn classifiers). Có cơ chế auto-unload para giải phóng bộ nhớ nếu một mô hình không được sử dụng trong 30 phút.

### 4.4.2 So Sánh Mô Hình (Model Comparison)

Chức năng so sánh cho phép chạy nhiều mô hình trên cùng ảnh để đánh giá sự đồng thuận và chọn kết quả đáng tin cậy nhất.

Backend endpoint `/api/v1/compare` nhận request chứa ảnh, danh sách model_ids (thường là 2-3 mô hình), và flag `include_gradcam`. Backend lưu ảnh một lần, sau đó gửi song song (hoặc tuần tự nếu GPU giới hạn) đến AI Service cho từng mô hình. Tập hợp kết quả, tính tổng thời gian.

AI Service nhân hóa quy trình: tiền xử lý ảnh một lần, sau đó chạy từng mô hình:
```python
preprocessed = preprocess(image)         # Một lần
result_densenet = densenet_model(preprocessed)
result_vit = vit_model(preprocessed)
result_fusion = fusion_model(preprocessed)
```

Response trả về danh sách dự đoán từng mô hình với nhãn, xác suất, thời gian riêng lẻ, cùng tổng thời gian.

Frontend hiển thị bảng so sánh với cột: Model, Prediction, Confidence, Inference Time. Highlight hàng hoặc cột với kết quả khác nhau bằng màu cảnh báo (vàng/đỏ) để phát hiện disagreement. Bác sĩ có thể click vào từng hàng để xem chi tiết hoặc Grad-CAM của mô hình đó.

### 4.4.3 Đo Lường Hiệu Năng (Performance Metrics)

Đo lường hiệu năng chi tiết giúp hiểu rõ hơn về tốc độ và độ tin cậy của hệ thống.

Backend ghi log cho mỗi request:
- Timestamp nhận, thời gian xử lý file, thời gian gọi AI Service, thời gian lưu DB, timestamp trả response
- Tính toán latency tổng end-to-end

AI Service ghi log chi tiết:
- Thời gian đọc/resize ảnh (preprocessing)
- Thời gian tải mô hình từ disk (nếu first-time use)
- Thời gian suy luận (forward pass)
- Thời gian sinh Grad-CAM (nếu có)

Frontend dashboard hiển thị:
- Biểu đồ cột so sánh thời gian phản hồi trung bình của từng mô hình
- Biểu đồ phân tán giữa confidence score và thời gian suy luận, cho thấy tradeoff
- Biểu đồ lịch sử thời gian phản hồi qua các ngày để phát hiện degradation

### 4.4.4 Grad-CAM và Giải Thích Mô Hình

Grad-CAM (Gradient-weighted Class Activation Mapping) cung cấp bằng chứng trực quan cho mỗi dự đoán, tăng độ tin tưởng và khả năng giải thích.

AI Service thực hiện toán toán Grad-CAM cho DenseNet169:
1. Forward pass ảnh qua mô hình, lấy logit của class dự đoán
2. Backward pass tính gradient của logit đó đối với feature map của lớp cuối cùng trước global average pooling
3. Trung bình gradient theo dimension kênh để tạo trọng số 
4. Nhân foreweight map với feature map, áp dụng ReLU để lấy phần positive activation
5. Resize heatmap về kích thước ảnh gốc (128×128)
6. Biểu chuẩn hóa vào [0, 255] và áp dụng colormap Jet

Backend lưu ảnh Grad-CAM trong `uploads/{user_id}/{result_id}_gradcam.jpg` và cung cấp endpoint `/api/v1/gradcam/{result_id}` để tải.

Frontend hiển thị side-by-side ảnh gốc và heatmap, với slider điều chỉnh opacity để có thể nhìn thấy dưới cả hai. Vùng màu đỏ/cam chỉ ra vùng mô hình tập trung, vùng xanh/tối chỉ ra vùng được bỏ qua.

---

## 4.5 Quản Lý Lịch Sử và Xuất Báo Cáo

### 4.5.1 Lưu Trữ và Truy Vấn Lịch Sử

Mỗi kết quả chẩn đoán được lưu vào bảng `inference_results` với đầy đủ metadata. Endpoint `/api/v1/inference/{result_id}` cho phép lấy chi tiết một kết quả. Endpoint `/api/v1/inference?filters` hỗ trợ lọc phức tạp:
- Theo ngày tháng (date range)
- Theo mô hình sử dụng
- Theo kết quả dự đoán (chỉ Normal hoặc chỉ Pneumonia)
- Theo khoảng xác suất
- Theo bác sĩ tạo kết quả

Frontend cung cấp giao diện tìm kiếm và lọc trực quan, cho phép bác sĩ quản lý toàn bộ lịch sử.

### 4.5.2 Xuất Báo Cáo

Hệ thống hỗ trợ xuất dạng:

**CSV**: Tập hợp tất cả kết quả thỏa mãn điều kiện filter dưới dạng bảng, chứa cột: ID, ngày giờ, bác sĩ, patient_info (tuỳ chọn), model_id, prediction, confidence, inference_time, gradcam_url. Người dùng có thể tải về, mở trong Excel để phân tích thêm hoặc tính toán thống kê.

**PDF**: Báo cáo chính thức được sinh động từ template, bao gồm ảnh X-quang gốc, kết quả dự đoán từ từng mô hình (nếu so sánh), Grad-CAM overlay, signature bác sĩ, hospital name, report date. PDF này có thể in hoặc lưu vào hồ sơ bệnh nhân.

Backend endpoint: `GET /api/v1/reports/export?format=csv&date_from=...&date_to=...` hoặc `GET /api/v1/reports/export?format=pdf&result_id={id}`

---

## 4.6 Triển Khai Thực Tế

### 4.6.1 Môi Trường Phát Triển

Trong quá trình phát triển, mỗi developer cần khởi động:
- Frontend dev server: `cd frontend && npm run dev` → auto-reload khi sửa code
- Backend server: `cd backend && ./mvnw spring-boot:run` → Spring Boot embedded Tomcat
- AI Service: `cd ai-service && python main.py` hoặc `uvicorn main:app --reload` → FastAPI
- Database (tuỳ chọn Docker): `docker-compose -f docker-compose.dev.yml up` → SQLite hoặc PostgreSQL container

### 4.6.2 Triển Khai Production

Triển khai production cần containerization:

Mỗi service nhận Dockerfile riêng. Ví dụ Dockerfile AI Service:
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

Docker Compose hoặc Kubernetes orchestration để quản lý containers. CI/CD pipeline (GitHub Actions hoặc GitLab CI) tự động: build image, chạy tests, push lên registry, update production deployment với rolling updates để tránh downtime.

---

## 4.7 Đánh Giá Kết Quả và Hiệu Năng

### 4.7.1 Hiệu Suất Mô Hình Trên Hệ Thống Web

Bảng 4.1 dưới đây so sánh các chỉ số hiệu suất của ba mô hình khi được triển khai trên hệ thống web:

| Mô Hình | Accuracy | Precision | Recall | F1-Score | AUC-ROC | Inference Time (ms) |
|---------|----------|-----------|--------|----------|---------|----------------------|
| DenseNet169 | 92.4% | 92.0% | 91.5% | 91.7% | 0.955 | 542 |
| Vision Transformer | 90.1% | 89.8% | 89.5% | 89.6% | 0.932 | 735 |
| Gated Fusion | 91.8% | 91.5% | 91.0% | 91.2% | 0.948 | 1205 |

Kết quả này cho thấy DenseNet169 đạt được sự cân bằng tốt nhất giữa độ chính xác cao (92.4%) và thời gian phản hồi nhanh (542ms), làm nó trở thành lựa chọn ưu tiên cho hầu hết các trường hợp. Gated Fusion đạt độ chính xác cao hơn (91.8%) nhưng yêu cầu thời gian dài hơn (1205ms) do quá trình trích xuất và tổng hợp đặc trưng phức tạp. Vision Transformer nhanh hơn Gated Fusion nhưng độ chính xác thấp hơn cả hai, cho thấy sự tradeoff giữa độ chính xác và tốc độ.

### 4.7.2 Hiệu Năng Hệ Thống

Đo đạc end-to-end (từ khi frontend gửi ảnh đến khi nhận response):
- Single prediction: 800ms - 1500ms (tùy mô hình + độ trễ mạng + database latency)
- Comparison (3 mô hình): 2000ms - 3500ms (parallel processing nếu có multiple cores)

Throughput (số request xử lý/giây):
- Backend có thể xử lý ~50 requests/second trên instance cấu hình vừa (4 CPU, 8GB RAM)
- AI Service có thể xử lý ~5-10 inference/second trên GPU NVIDIA V100 hoặc tương đương; trên CPU pure thì giảm xuống 1-2 inference/second

### 4.7.3 Khả Năng Mở Rộng

Hệ thống được thiết kế với khả năng mở rộng dọc (vertical scaling - tăng tài nguyên máy chủ) đơn giản:
- Tăng CPU/GPU cho AI Service để xử lý nhanh hơn các mô hình lớn
- Tăng RAM cho caching mô hình

Hoặc mở rộng ngang (horizontal scaling - thêm máy chủ):
- Backend: đặt Load Balancer (nginx, AWS ALB) trước nhiều Spring Boot instances
- AI Service: Kubernetes hoặc container orchestration cho scaling tự động
- Database: Read replicas, connection pooling, indices phù hợp

---

## 4.8 Hạn Chế Hiện Tại và Hướng Cải Tiến

### 4.8.1 Hạn Chế Hiện Tại

1. **Grad-CAM chỉ hỗ trợ DenseNet**: Các mô hình khác (ViT, Fusion) chưa có giải thích hộp đen trực quan. Giải pháp có thể là sử dụng attention maps từ ViT hoặc integrated gradients cho Fusion.

2. **Radiomics bị bỏ qua**: Mô hình Gated Fusion dự kiến sử dụng features từ pyradiomics (tumor radiomics), nhưngthư viện này yêu cầu dependencies phức tạp (SimpleITK). Hiện tại Fusion chỉ sử dụng ViT, WST, và statistical features, làm giảm chi mức độ chính xác dự kiến.

3. **Dữ liệu training cố định**: Hệ thống không hỗ trợ retrain model online (trực tuyến). Mô hình phải retrain offline, rồi manually update lên production. Giải pháp tương lai là federated learning hoặc active learning.

4. **Hỗ trợ DICOM hạn chế**: Hiện tại chỉ hỗ trợ JPEG, PNG. Hỗ trợ DICOM (định dạng tiêu chuẩn y tế) cần thêm thư viện `pydicom` và xử lý metadata DICOM.

### 4.8.2 Hướng Cải Tiến Tương Lai

1. **Grad-CAM cho ViT và Fusion**: Sử dụng attention maps trực tiếp từ Transformer layers hoặc tính integrated gradients. Điều này sẽ giúp giải thích được toàn bộ ba mô hình.

2. **Automatic Model Benchmarking**: Hệ thống chạy định kỳ (tuần 1 lần) tất cả mô hình trên test set, so sánh hiệu suất, alert nếu có degradation đột ngột.

3. **Model Registry Tập Trung**: Lưu trữ toàn bộ phiên bản mô hình, metadata, metrics changelog trong một registry (tương tự MLflow), cho phép rollback nhanh.

4. **Federated Learning**: Cho phép các bệnh viện khác nhau contribute dữ liệu để retrain mô hình chung mà không chia sẻ ảnh X-quang trực tiếp, bảo vệ privacy.

5. **Ensemble Methods**: Kết hợp dự đoán của ba mô hình với weighted voting hoặc stacking classifier, có thể đạt kết quả chính xác hơn từng model riêng lẻ.

---

## 4.9 Kết Luận Chương

Chương này đã trình bày chi tiết quá trình thiết kế, kiến trúc, và triển khai của hệ thống web hỗ trợ chẩn đoán viêm phổi từ ảnh X-quang. Hệ thống được xây dựng theo mô hình ba lớp hiện đại (Frontend, Backend, AI Service), cho phép tích hợp linh hoạt các mô hình học sâu mà không cần sửa code chính.

Những đóng góp chính của hệ thống bao gồm: (1) giao diện người dùng thân thiện cho phép lựa chọn và so sánh mô hình, (2) cung cấp ảnh Grad-CAM giải thích quyết định của mô hình, (3) quản lý toàn bộ lịch sử chẩn đoán với khả năng tìm kiếm và xuất báo cáo, (4) đo lường chi tiết hiệu năng và thời gian phản hồi. Kết quả đánh giá cho thấy DenseNet169 và Gated Fusion đạt độ chính xác cao (>91%), phù hợp cho triển khai thực tế trong các cơ sở y tế.

Tuy nhiên, hệ thống vẫn có những hạn chế cần khắc phục trong các phiên bản tương lai như hoàn thiện giải thích Grad-CAM cho toàn bộ mô hình, tích hợp radiomics, hỗ trợ DICOM, và triển khai federated learning cho retrain online. Với những cải tiến này, hệ thống sẽ trở thành một công cụ hỗ trợ chẩn đoán mạnh mẽ và đáng tin cậy cho các chuyên gia y tế.
