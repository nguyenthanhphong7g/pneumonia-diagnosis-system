# Lộ Trình Phát Triển Tương Lai Cho Chẩn Đoán

Tài liệu này mô tả định hướng phát triển sắp tới của hệ thống. Đây chỉ là kế hoạch, **không phải** phần triển khai.

## 1. Mục tiêu tổng quát

Hiện tại hệ thống đang có một số nhánh suy luận như Gated Fusion, Random Forest, ViT, và Grad-CAM dựa trên DenseNet. Trong giai đoạn tiếp theo, tôi muốn mở rộng hệ thống để người dùng có thể:

- Chọn mô hình chẩn đoán mong muốn trước khi dự đoán.
- So sánh nhiều mô hình trên cùng một ảnh.
- Xem thời gian dự đoán ước tính trước khi chạy hoặc ngay sau khi chạy.
- Xem thêm nhiều chỉ số đánh giá ngoài accuracy.
- Giữ Grad-CAM cố định theo DenseNet ở giai đoạn đầu để đảm bảo ổn định.

## 2. Hướng phát triển chính

### 2.1 Chức năng chọn model

Người dùng sẽ có một nút hoặc danh sách lựa chọn để chọn model muốn dùng cho chẩn đoán.

Kỳ vọng:

- Không còn phụ thuộc duy nhất vào Gated Fusion.
- Có thể chọn từng model riêng lẻ như ViT, Random Forest, Gated Fusion, hoặc các model mới sau này.
- Hệ thống phải trả kết quả đúng theo model đã chọn.

Ghi chú:

- Grad-CAM hiện tại vẫn chỉ gắn với DenseNet.
- Phần trực quan hóa sẽ giữ cố định theo DenseNet cho đến khi có model giải thích mới phù hợp hơn.

### 2.2 Chức năng so sánh mô hình

Tôi muốn thêm chế độ so sánh nhiều model trên cùng một ảnh.

Kỳ vọng:

- Chạy nhiều model cùng lúc hoặc lần lượt trên cùng ảnh đầu vào.
- Hiển thị label, confidence, thời gian chạy và các metric liên quan.
- Cho phép người dùng nhìn thấy model nào ổn định hơn trong từng trường hợp.

### 2.3 Chức năng dự đoán thời gian

Hệ thống sẽ có thêm thông tin dự đoán thời gian xử lý để người dùng biết trước hoặc ước lượng sau khi chạy.

Kỳ vọng:

- Hiển thị thời gian dự đoán ước tính trước khi gửi request.
- Ghi nhận latency thực tế sau khi model phản hồi.
- So sánh thời gian giữa các model trong chế độ benchmark.

### 2.4 Bổ sung nhiều metric đánh giá

Ngoài accuracy, hệ thống sẽ hiển thị thêm các chỉ số quan trọng khác.

Các metric dự kiến:

- Precision
- Recall
- F1-score
- AUC-ROC
- Specificity
- Sensitivity
- Confusion matrix
- Latency trung bình và p95

## 3. Định hướng giao diện người dùng

Giao diện dự kiến sẽ có thêm:

- Dropdown hoặc nút chọn model.
- Nút so sánh nhiều model.
- Khối hiển thị thời gian dự đoán.
- Khối hiển thị metric chi tiết.
- Grad-CAM vẫn hiển thị từ DenseNet như hiện tại.

## 4. Định hướng backend

Backend trong tương lai cần đóng vai trò điều phối nhiều model thay vì chỉ chuyển tiếp một đường suy luận cố định.

Kỳ vọng:

- Có lớp định tuyến model theo lựa chọn của người dùng.
- Có cơ chế chuẩn hóa response giữa các model.
- Có thể gọi một model đơn lẻ hoặc gọi nhiều model để so sánh.
- Có thể ghi log thời gian và metric của từng lần suy luận.

## 5. Định hướng AI service

AI service trong tương lai nên tách rõ ba lớp:

- Lớp nạp model.
- Lớp suy luận.
- Lớp đánh giá và benchmark.

Kỳ vọng:

- Một model có thể được chọn độc lập để chẩn đoán.
- Grad-CAM vẫn mặc định gắn với DenseNet.
- Có thể mở rộng thêm model mới mà không phải viết lại toàn bộ pipeline.

## 6. Trình tự ưu tiên thực hiện

### Giai đoạn 1: Chuẩn hóa model registry

Mục tiêu là xây dựng danh sách model có thể chọn từ giao diện.

### Giai đoạn 2: Chọn model khi chẩn đoán

Mục tiêu là cho phép người dùng chọn model và backend sẽ chạy đúng model đó.

### Giai đoạn 3: Hiển thị so sánh mô hình

Mục tiêu là tạo màn hình so sánh nhiều model trên cùng một ảnh.

### Giai đoạn 4: Thêm latency và metric mở rộng

Mục tiêu là hiển thị thời gian và các metric quan trọng bên cạnh accuracy.

### Giai đoạn 5: Mở rộng model mới

Mục tiêu là thêm model mới mà không phá vỡ cơ chế chọn model hiện tại.

## 7. Tiêu chí hoàn thành mong đợi

Tôi xem hướng phát triển này là đạt khi:

- Người dùng chọn được model trước khi chẩn đoán.
- Hệ thống chẩn đoán đúng model đã chọn.
- Có chế độ so sánh ít nhất 2 model trên cùng ảnh.
- Có hiển thị thời gian dự đoán.
- Có hiển thị nhiều metric hơn accuracy.
- Grad-CAM vẫn chạy ổn định bằng DenseNet.

## 8. Ghi chú phạm vi

Tài liệu này chỉ mô tả định hướng tương lai. Nó không thay đổi code hiện tại và không triển khai bất kỳ chức năng nào.
