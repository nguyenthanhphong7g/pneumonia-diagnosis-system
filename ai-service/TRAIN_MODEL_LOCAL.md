# Hướng Dẫn Train 3 Model Local

Tài liệu này chỉ hướng dẫn train model trực tiếp trong `ai-service`, không liên quan tới web, backend, hay API retrain.

## 1. Bạn đang train những model nào

Trong repo này có 3 hướng model bạn đang nhắc tới:

- Gated Fusion: model ghép nhiều đặc trưng, train bằng feature đã trích xuất sẵn.
- ViT + LogisticRegression: nhánh ViT feature + classifier.
- DenseNet169: nhánh ảnh gốc phục vụ inference và Grad-CAM, nếu muốn train lại thì cần fine-tune riêng từ ảnh X-ray.

Lưu ý quan trọng:

- `train_gated_fusion.py` chỉ là file định nghĩa lớp `GatedFusion` để service load checkpoint, không phải script train độc lập.
- Repo hiện tại có script train trực tiếp cho fusion là `scripts/train_fusion_klt.py` và `scripts/train_fusion.py`.
- Với ViT và DenseNet, repo chưa có script train offline hoàn chỉnh, nên bạn cần chuẩn bị dữ liệu theo đúng format để fine-tune hoặc bổ sung script train riêng.

## 2. Chuẩn bị môi trường

Mở terminal tại thư mục `ai-service` rồi kích hoạt môi trường Python của bạn. Ví dụ trên Windows:

```powershell
cd d:\TieuLuan\pneumonia-diagnosis-system\ai-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements-frozen.txt
```

Hoặc bạn có thể chạy script tự động tạo và cài đặt môi trường:

```powershell
cd d:\TieuLuan\pneumonia-diagnosis-system\ai-service
.\setup_env.ps1
```

Với macOS/Linux, dùng:

```bash
cd /path/to/pneumonia-diagnosis-system/ai-service
./setup_env.sh
```

Nếu bạn đã có môi trường sẵn thì chỉ cần activate lại môi trường đó.

## 3. Cần chuẩn bị gì trước khi train

### 3.1 Dữ liệu chung

- Dataset đã chia rõ `train`, `val`, `test`.
- Label chỉ có 2 lớp: `NORMAL` và `PNEUMONIA`.
- Ảnh không lỗi, không trống, và cùng định dạng nhất quán.
- Nên giữ test set riêng, không dùng lẫn vào train.

### 3.2 Nếu train Gated Fusion

Bạn cần sẵn các feature sau cho mỗi mẫu:

- ViT feature
- WST feature
- Radiomics feature
- Statistical feature
- Label

Nếu dùng layout hiện có trong repo, feature phải nằm theo cấu trúc mà script train đọc được.

### 3.3 Nếu train ViT + LogisticRegression

Bạn cần:

- Ảnh gốc X-ray.
- Chia `train/val/test` rõ ràng.
- Pipeline trích xuất ViT features nhất quán giữa train và test.
- Scaler và classifier được fit chỉ trên train.

### 3.4 Nếu train DenseNet169

Bạn cần:

- Ảnh gốc X-ray kích thước chuẩn, thường resize về `224x224`.
- Chia `train/val/test` rõ ràng.
- Augmentation cho train nếu muốn tăng độ bền mô hình.
- Checkpoint để lưu model tốt nhất theo metric validation.

## 4. Cách train theo từng model

### Cách A: Train từ feature KLT đã có sẵn

Dùng lệnh này khi bạn đã có dữ liệu feature nằm trong `models/KLTN_Feature`:

```powershell
python scripts\train_fusion_klt.py --feature-root .\models\KLTN_Feature --labels .\dataset\chest_xray\train\labels.npy --out .\models
```

Nếu muốn chạy nhanh để test luồng train:

```powershell
python scripts\train_fusion_klt.py --feature-root .\models\KLTN_Feature --labels .\dataset\chest_xray\train\labels.npy --out .\models --max-samples 1000
```

### Cách B: Train từ feature trong `dataset/chest_xray`

Dùng lệnh này khi các file `vit_train.npy`, `wst_train.npy`, `rad_train.npy`, `sta_train.npy`, `labels.npy` nằm trong `dataset/chest_xray/train` và `test`:

```powershell
python scripts\train_fusion.py --data .\dataset\chest_xray --out .\models
```

Chạy thử với ít mẫu hơn:

```powershell
python scripts\train_fusion.py --data .\dataset\chest_xray --out .\models --max-samples 1000
```

### Cách C: Train ViT hoặc DenseNet

Hiện repo chưa có script train offline riêng cho 2 nhánh này, nhưng nếu bạn bổ sung script fine-tune thì nên theo nguyên tắc sau:

- ViT: train trên ảnh gốc hoặc feature đã chuẩn hóa, sau đó lưu classifier/scaler/weights riêng.
- DenseNet: fine-tune trực tiếp từ ảnh gốc, lưu best checkpoint theo validation loss hoặc validation AUC.

Nếu bạn muốn, tôi có thể viết tiếp script train riêng cho ViT và DenseNet cho đúng layout repo này.

## 5. Độ đo cần lấy khi train

Để “train xong là có metric luôn”, bạn nên xuất tối thiểu các độ đo sau cho cả 3 model:

- Accuracy
- Precision
- Recall
- F1-score
- AUC-ROC
- Confusion matrix

Ngoài ra nên ghi thêm:

- Train loss
- Validation loss
- Thời gian train
- Thời gian suy luận trung bình

### Với Gated Fusion

Hai script fusion hiện tại đã có sẵn:

- `accuracy_score`
- `classification_report`

Nghĩa là đã có precision, recall, f1 trong báo cáo test.

Muốn có AUC thì cần thêm `roc_auc_score` và gọi `predict_proba` ở phần đánh giá.

### Với ViT + LogisticRegression

Nên đo:

- Feature extraction time
- Accuracy trên test
- Precision / Recall / F1
- AUC-ROC nếu classifier hỗ trợ `predict_proba`

### Với DenseNet169

Nên đo theo epoch:

- Train loss
- Val loss
- Val accuracy
- Val precision
- Val recall
- Val F1
- Val AUC

Sau khi train xong, chạy thêm test set để có metric cuối cùng.

## 6. Output sau khi train

Cả hai script trên sẽ ghi artifact ra thư mục `models/`:

- `pca_vit.pkl`
- `pca_wst.pkl`
- `scaler_radsta.pkl`
- `rf_classifier.pkl`

Nếu train thành công, bạn sẽ thấy log kiểu:

- `Training RandomForest...`
- `Saved artifacts to ...`

## 7. Khi nào dùng script nào

- Bạn đã có feature sinh sẵn theo bộ KLTN: dùng `train_fusion_klt.py`.
- Bạn đang có feature tách sẵn trong `dataset/chest_xray`: dùng `train_fusion.py`.
- Bạn muốn train ViT hoặc DenseNet: cần script fine-tune riêng, hiện repo chưa có sẵn.
- Bạn chỉ muốn train local và kiểm tra artifact, không cần backend/web: chỉ chạy các lệnh ở mục 4.

## 8. Ghi nhớ nhanh

```powershell
cd d:\TieuLuan\pneumonia-diagnosis-system\ai-service
.\venv\Scripts\activate
python scripts\train_fusion_klt.py --feature-root .\models\KLTN_Feature --labels .\dataset\chest_xray\train\labels.npy --out .\models
```

Hoặc:

```powershell
python scripts\train_fusion.py --data .\dataset\chest_xray --out .\models
```

Nếu bạn muốn có metric đầy đủ cho cả 3 model, bước tiếp theo tốt nhất là:

1. Train Gated Fusion bằng script hiện có và thêm AUC.
2. Viết script fine-tune ViT để lưu metric validation/test.
3. Viết script fine-tune DenseNet để lưu checkpoint best model và metric cuối cùng.