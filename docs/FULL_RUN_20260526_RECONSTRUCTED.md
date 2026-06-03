# full_run_20260526 - Bản tái dựng chi tiết

Tài liệu này là bản tái dựng quy trình của lần chạy `full_run_20260526` dựa trên các script, artifact và file metrics hiện có trong workspace.

Lưu ý quan trọng:
- Tôi không tìm thấy log gốc hoặc notebook gốc có tên chính xác `full_run_20260526` trong repo.
- Vì vậy, nội dung dưới đây được suy ra từ các file thực tế đang tồn tại, đặc biệt là `scripts/train_gated_fusion_local.py`, `models/full_run_20260526_run2/gated_fusion_metrics.json`, `models/full_run_20260526_run2/lr_classifier_gf.pkl`, và các loader trong `models/fusion_api.py`.
- Đây là bản mô tả rất sát với quy trình đã chạy, nhưng không phải biên bản log nguyên bản.

## 1. Mục tiêu của lần chạy

Mục tiêu của run này là huấn luyện lại pipeline Gated Fusion từ dữ liệu ảnh X-ray đã có sẵn, sau đó:
- trích xuất feature từ từng ảnh;
- tạo fused feature bằng mạng Gated Fusion;
- huấn luyện lại bộ phân loại Logistic Regression trên fused feature;
- đánh giá trên validation và test;
- lưu lại classifier và file metrics.

## 2. Script đã dùng

Script phù hợp nhất với artifact hiện có là:

- `ai-service/scripts/train_gated_fusion_local.py`

Script này làm các bước sau:
- đọc `train/images.npy`, `train/labels.npy`, `test/images.npy`, `test/labels.npy`;
- chia train thành train/val bằng `train_test_split`;
- trích xuất 3 nhóm feature: ViT, WST, radiomics + thống kê;
- nạp các artifact PCA/scaler từ thư mục model;
- cho feature đi qua `GatedFusion` để lấy vector fused;
- train `LogisticRegression` với `class_weight="balanced"`;
- đánh giá validation/test;
- ghi `lr_classifier_gf.pkl` và `gated_fusion_metrics.json`.

## 3. Dữ liệu đầu vào

Theo script, dữ liệu được đọc từ:

- `ai-service/dataset/chest-xray/train/images.npy`
- `ai-service/dataset/chest-xray/train/labels.npy`
- `ai-service/dataset/chest-xray/test/images.npy`
- `ai-service/dataset/chest-xray/test/labels.npy`

Các ảnh được chuyển về PIL image grayscale trước khi extract feature.

## 4. Artifact đầu vào cần có

Run này không train Gated Fusion từ đầu, mà dùng lại các artifact đã tồn tại:

- `ai-service/models/pca_vit.pkl`
- `ai-service/models/pca_wst.pkl`
- `ai-service/models/scaler_radsta.pkl`
- `ai-service/models/scaler_vit.pkl` nếu có
- `ai-service/models/scaler_wst.pkl` nếu có
- `ai-service/models/gated_fusion_model.pth`

Ngoài ra, classifier đầu ra được lưu thành:

- `ai-service/models/full_run_20260526_run2/lr_classifier_gf.pkl`

và metrics được lưu thành:

- `ai-service/models/full_run_20260526_run2/gated_fusion_metrics.json`

## 5. Quy trình chạy lại được tái dựng

### Bước 1: Kích hoạt môi trường Python

```powershell
cd d:\TieuLuan\pneumonia-diagnosis-system\ai-service
.\venv\Scripts\activate
```

### Bước 2: Chạy script train

Lệnh phù hợp nhất là:

```powershell
python scripts\train_gated_fusion_local.py --model-dir .\models --out .\models\full_run_20260526_run2
```

Lệnh này sẽ:
- dùng model artifacts trong `models/`;
- sinh classifier mới `lr_classifier_gf.pkl`;
- sinh metrics mới `gated_fusion_metrics.json`.

### Bước 3: Đánh giá validation và test

Script sẽ tự chia dữ liệu train thành train/val với `val_size=0.1` và `seed=42`.

Các độ đo được in ra cho cả validation và test:
- Accuracy
- Precision
- Recall
- F1
- AUC
- Confusion matrix

### Bước 4: Lưu kết quả

Kết quả được ghi ra:

- `lr_classifier_gf.pkl`
- `gated_fusion_metrics.json`

## 6. Cách feature được tạo

Mỗi ảnh được xử lý theo chuỗi sau:

1. Ảnh numpy được chuyển sang PIL grayscale.
2. `extract_vit_from_pil()` tạo feature ViT.
3. `extract_wst_from_pil()` tạo feature WST.
4. `extract_radiomics_stats_from_pil()` tạo radiomics + thống kê.
5. Nếu có, ViT/WST được scale bằng `scaler_vit.pkl` và `scaler_wst.pkl`.
6. Radiomics + statistics được ghép lại và scale bằng `scaler_radsta.pkl`.
7. ViT và WST đi qua PCA.
8. Ba nhánh được đưa vào `GatedFusion(..., return_feature=True)` để lấy fused vector.
9. Fused vector được dùng để train Logistic Regression.

## 7. Model và thư viện đã dùng

### Model
- GatedFusion neural network
- LogisticRegression classifier

### Feature extractors
- ViT feature extractor
- WST feature extractor
- Radiomics + statistical feature extractor

### Thư viện chính
- `torch`
- `numpy`
- `PIL`
- `joblib`
- `scikit-learn`

Trong code hiện có, `train_gated_fusion_local.py` import trực tiếp:
- `LogisticRegression`
- `accuracy_score`, `precision_score`, `recall_score`, `f1_score`, `roc_auc_score`, `confusion_matrix`, `classification_report`

## 8. Kết quả run hiện có

File metrics hiện có cho thấy run đã hoàn tất với các số sau:

### Split
- Train samples: 4185
- Validation samples: 1047
- Test samples: 624
- Feature dim: 64

### Thời gian trích xuất feature
- Train: 6738.4868 giây
- Val: 4149.2826 giây
- Test: 1089.8676 giây

### Validation
- Accuracy: 0.9723018147086915
- Precision: 0.9934036939313984
- Recall: 0.9691119691119691
- F1: 0.9811074918566776
- AUC: 0.9967252967252966
- Confusion matrix:

```text
[[265,   5],
 [ 24, 753]]
```

### Test
- Accuracy: 0.9166666666666666
- Precision: 0.9289340101522843
- Recall: 0.9384615384615385
- F1: 0.9336734693877551
- AUC: 0.9675432829278983
- Confusion matrix:

```text
[[206,  28],
 [ 24, 366]]
```

## 9. Artifact đầu ra

Thư mục `ai-service/models/full_run_20260526_run2/` hiện chứa:

- `gated_fusion_metrics.json`
- `lr_classifier_gf.pkl`

Thư mục `ai-service/models/full_run_20260526_run1/` hiện đang trống trong workspace, nên nhiều khả năng run1 là lần tạo dở dang hoặc run thử trước khi chốt run2.

## 10. Những gì đang được backend/service dùng sau đó

Từ `models/fusion_api.py`, hệ thống runtime hiện dùng các artifact sau:

- `gated_fusion_model.pth`
- `lr_classifier_gf.pkl`
- `pca_vit.pkl`
- `pca_wst.pkl`
- `scaler_radsta.pkl`
- tùy chọn `scaler_vit.pkl`
- tùy chọn `scaler_wst.pkl`

Điều này cho thấy run `full_run_20260526` nhiều khả năng là bước tái train classifier cho pipeline Gated Fusion đang phục vụ AI service.

## 11. Tóm tắt ngắn gọn quy trình

Nếu phải mô tả ngắn một câu, thì `full_run_20260526` là:

> Chạy lại pipeline Gated Fusion trên dữ liệu X-ray đã tách sẵn, trích xuất ViT/WST/radiomics features, tạo fused feature bằng `gated_fusion_model.pth`, huấn luyện Logistic Regression, rồi lưu classifier + metrics vào thư mục run.

## 12. Lệnh tái chạy đề xuất

```powershell
cd d:\TieuLuan\pneumonia-diagnosis-system\ai-service
.\venv\Scripts\activate
python scripts\train_gated_fusion_local.py --model-dir .\models --out .\models\full_run_20260526_run2
```

## 13. Ghi chú về tính chính xác của tài liệu

- Các metric và artifact đầu ra ở trên là có thật trong workspace.
- Lệnh chạy là lệnh tái dựng hợp lý nhất từ code hiện tại.
- Nếu bạn muốn bản “chuẩn log gốc”, cần thêm file output terminal hoặc notebook run ban đầu; hiện workspace chưa có.
