# Tài liệu yêu cầu sản phẩm (PRD)
# MLOps Course: Giai đoạn Design - Product

## 1. Bài toán
Tự động chẩn đoán viêm phổi từ ảnh X-ray ngực, hỗ trợ bác sĩ với:
- Dự đoán nhanh (< 500ms)
- Có giải thích rõ ràng (GradCAM)
- Độ chính xác cao (>90%) trên tập test

## 2. Các chỉ số thành công
### Chỉ số hiệu năng model
- **Accuracy**: ≥ 90%
- **Precision**: ≥ 88% (giảm false positives)
- **Recall**: ≥ 92% (giảm false negatives)
- **F1-Score**: ≥ 0.90
- **AUC-ROC**: ≥ 0.95

### Chỉ số hiệu năng hệ thống
- **Độ trễ dự đoán**: < 500ms (p95)
- **Độ trễ GradCAM**: < 2s (p95)
- **Throughput**: ≥ 100 req/s
- **Availability**: ≥ 99.5% uptime
- **Tỷ lệ lỗi**: < 0.5%

### Chỉ số trải nghiệm người dùng
- **Khả năng giải thích**: Heatmap GradCAM phải khớp hợp lý với vùng ảnh bác sĩ quan tâm
- **Hiệu chỉnh độ tin cậy**: Confidence dự đoán phải phản ánh đúng độ chính xác thực tế
- **Mức hài lòng**: NPS ≥ 7/10

## 3. Yêu cầu
### Yêu cầu chức năng
- ✅ Dự đoán: Normal vs Pneumonia (phân lớp 2 lớp)
- ✅ Giải thích: Hiển thị GradCAM cho biết vùng ảnh ảnh hưởng quyết định
- ✅ Lịch sử: Lưu kết quả dự đoán cùng timestamp và metadata
- ✅ Phân quyền theo vai trò: Doctor, Patient, Admin
- ✅ Xử lý hàng loạt: Hỗ trợ xử lý nhiều ảnh

### Yêu cầu phi chức năng
- ✅ Bảo mật: HTTPS, xác thực, giới hạn tần suất
- ✅ Khả năng mở rộng: scale ngang với load balancing
- ✅ Độ tin cậy: có fallback model khi lỗi
- ✅ Giám sát: cảnh báo và dashboard theo thời gian thực
- ✅ Khả năng kiểm thử: unit + integration test (>80% coverage)

## 4. Yêu cầu dữ liệu
- **Nguồn**: ChexPert/ChestX-ray14
- **Tỷ lệ train/val/test**: 90% (90%/ 10%)/10%
- **Định dạng ảnh**: JPEG, PNG (grayscale 8-bit, 512-1000px)
- **Lớp**: NORMAL (0), PNEUMONIA (1)
- **Mất cân bằng**: Cần xử lý vì normal >> pneumonia

## 5. Ràng buộc
- **Kích thước model**: < 500MB (để phục vụ serving)
- **Bộ nhớ**: < 4GB cho mỗi replica
- **Độ trễ**: Phải đáp ứng SLA (< 500ms)
- **Chi phí**: Chi phí inference < $0.01 cho mỗi lần dự đoán
- **Tuân thủ**: Sẵn sàng cho HIPAA/GDPR (bảo mật dữ liệu)

## 6. Tiêu chí đạt cổng review
- [ ] Accuracy model ≥ 90% trên validation set
- [ ] API endpoints < 500ms latency
- [ ] GradCAM được xác nhận bởi bác sĩ/chuyên gia
- [ ] Unit test coverage ≥ 80%
- [ ] Kiểm tra bảo mật đạt yêu cầu
- [ ] Xử lý được 100+ request đồng thời
