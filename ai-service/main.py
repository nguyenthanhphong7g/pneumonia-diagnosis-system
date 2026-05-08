from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from PIL import Image
import numpy as np
import torch
from transformers import ViTModel, ViTImageProcessor
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import io
from typing import List
from datetime import datetime

# ================= INIT APP =================
app = FastAPI(title="AI Pneumonia Detection Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= LOAD MODEL =================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"🚀 Using device: {device}")

print("🔄 Loading ViT model...")
processor = ViTImageProcessor.from_pretrained(
    "google/vit-large-patch16-224-in21k"
)

vit_model = ViTModel.from_pretrained(
    "google/vit-large-patch16-224-in21k"
)
vit_model.to(device)
vit_model.eval()
print("✅ ViT loaded")

print("🔄 Loading ML model...")
model = joblib.load("model_lr.pkl")      # Logistic Regression
scaler = joblib.load("scaler.pkl")       # StandardScaler
print("✅ ML model loaded")


# ================= TEST API =================
@app.get("/")
def home():
    return {"message": "API is running 🚀"}


# ================= FEATURE EXTRACTION =================
def extract_features(image: Image.Image):
    image = image.resize((224, 224))
    image = np.array(image)

    inputs = processor(images=image, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = vit_model(**inputs)

    features = outputs.last_hidden_state[:, 0, :]  # CLS token
    features = features.cpu().numpy()

    return features


# ================= PREDICT =================
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # đọc ảnh
        image = Image.open(file.file).convert("RGB")

        # extract feature
        features = extract_features(image)

        # scale
        features_scaled = scaler.transform(features)

        # predict
        pred = model.predict(features_scaled)[0]
        prob = model.predict_proba(features_scaled)[0]

        label = "Pneumonia" if pred == 1 else "Normal"
        confidence = float(np.max(prob))

        return {
            "label": label,
            "confidence": round(confidence, 4)
        }

    except Exception as e:
        return {"error": str(e)}


# ================= RETRAIN MODEL =================
@app.post("/retrain")
async def retrain(files: List[UploadFile] = File(...), labels: str = Form(...)):
    """
    Retrain model với dữ liệu từ expert reviews
    files: danh sách file ảnh training
    labels: JSON string chứa labels tương ứng, format: '["Pneumonia", "Normal", ...]'
    """
    try:
        import json
        
        print(f"🔄 Starting retrain with {len(files)} samples...")
        
        # Parse labels
        label_list = json.loads(labels)
        
        if len(files) != len(label_list):
            return {
                "success": False,
                "error": f"Số lượng files ({len(files)}) không khớp với labels ({len(label_list)})"
            }
        
        # Extract features từ tất cả ảnh
        all_features = []
        all_labels = []
        
        for file, label in zip(files, label_list):
            try:
                image = Image.open(file.file).convert("RGB")
                features = extract_features(image)
                all_features.append(features[0])  # Lấy cái đầu tiên vì nó trả về batch
                # Convert label thành 0/1: Normal=0, Pneumonia=1
                label_encoded = 1 if label == "Pneumonia" else 0
                all_labels.append(label_encoded)
                print(f"✅ Processed: {file.filename} -> {label}")
            except Exception as e:
                print(f"❌ Error processing {file.filename}: {str(e)}")
                continue
        
        if len(all_features) < 2:
            return {
                "success": False,
                "error": "Cần ít nhất 2 sample để huấn luyện"
            }
        
        # Convert to numpy arrays
        X_train = np.array(all_features)
        y_train = np.array(all_labels)
        
        print(f"📊 Training data shape: {X_train.shape}")
        print(f"📊 Labels: {np.bincount(y_train)}")
        
        # Fit scaler với dữ liệu mới
        global scaler
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        
        # Fit model
        global model
        model = LogisticRegression(max_iter=1000, random_state=42)
        model.fit(X_train_scaled, y_train)
        
        # Save model
        joblib.dump(model, "model_lr.pkl")
        joblib.dump(scaler, "scaler.pkl")
        
        print("✅ Model saved!")
        
        return {
            "success": True,
            "message": "Retrain thành công!",
            "samples_processed": len(all_labels),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Retrain error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/retrain-status")
async def retrain_status():
    """Kiểm tra trạng thái model hiện tại"""
    try:
        return {
            "model_loaded": model is not None,
            "scaler_loaded": scaler is not None,
            "device": str(device),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


# ================= RUN =================
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)