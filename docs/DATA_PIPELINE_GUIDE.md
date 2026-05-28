# Thiết kế hệ thống & kiến trúc
# MLOps Course: Giai đoạn Design - Systems

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                      │
│  Port 5173 | Giao diện theo vai trò (Doctor, Patient, Admin)   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────┴──────────────────────────────────────────┐
│                   LOAD BALANCER (Nginx)                         │
│  Port 443 (HTTPS) | Rate Limiting | Authentication             │
└──────────────────────┬──────────────────────────────────────────┘
         │             │             │
    ┌────▼────┐   ┌───▼───┐   ┌────▼────┐
    │Backend  │   │Backend│   │Backend  │  (Mở rộng ngang)
    │Pod 1    │   │Pod 2  │   │Pod N    │
    │Spring   │   │Spring │   │Spring   │
    │Boot 8080│   │Boot   │   │Boot     │
    └────┬────┘   └───┬───┘   └────┬────┘
         │            │            │
         └────────────┬────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼────┐  ┌───▼──┐  ┌─────▼───┐
    │PostgreSQL│  │ Redis│  │ MLflow  │
    │(DB chính)│  │(Cache)│ (Tracking)
    │Port 5432 │  │Port 6379│Port 5000
    └──────────┴──────────┴─────────┘
         │
         └────Cụm AI Service──────┐
              ┌───────────────────┘
    ┌────────▼────────┐
    │  AI Service Pod  │  (Kubernetes)
    │  FastAPI 8000    │  (Auto-scaling)
    │  - /predict      │  ViT + LR
    │  - /gradcam      │  DenseNet169
    └──────────────────┘

## Luồng dữ liệu

1. Người dùng upload ảnh X-ray từ frontend
2. Frontend gửi đến backend (`/diagnosis/upload`)
3. Backend lưu ảnh vào thư mục uploads
4. Backend gọi AI Service (`/predict` hoặc `/gradcam`)
5. AI Service trả về dự đoán và giải thích
6. Backend lưu kết quả vào PostgreSQL
7. Frontend hiển thị kết quả và heatmap GradCAM

## Trách nhiệm từng thành phần

┌─────────────────────────────────────────────────────────┐
│                   MA TRẬN THÀNH PHẦN                    │
├─────────────────┬────────────────┬──────────────────────┤
│ Thành phần      │ Công nghệ      │ Trách nhiệm          │
├─────────────────┼────────────────┼──────────────────────┤
│ Frontend        │ React + Vite   │ UI/UX, điều hướng    │
│ Backend         │ Spring Boot    │ API, auth, nghiệp vụ │
│ AI Service      │ FastAPI        │ Suy luận model       │
│ Database        │ PostgreSQL     │ Dữ liệu bền vững     │
│ Cache           │ Redis          │ Session, kết quả     │
│ Model Registry  │ MLflow/HF      │ Quản lý phiên bản    │
│ Monitoring      │ Prometheus     │ Thu thập metrics     │
│ Logging         │ ELK/Loki       │ Log tập trung        │
│ Orchestration   │ Kubernetes     │ Scale container      │
└─────────────────┴────────────────┴──────────────────────┘

## Topology triển khai

### Môi trường phát triển
- Local: Frontend + Backend + AI Service + PostgreSQL
- Docker Compose: chạy tất cả trên một máy

### Môi trường production
- Kubernetes cluster (EKS, AKS, GKE)
- Nhiều replica cho mỗi service
- Health probe + auto-restart
- Giới hạn và request tài nguyên
- Network policy cho bảo mật

## Thiết kế độ sẵn sàng cao

1. **Frontend**: CDN + cache file tĩnh
2. **Backend**: Nhiều replica sau load balancer
3. **AI Service**: Node hỗ trợ GPU, queue request, sharding model
4. **Database**: PostgreSQL HA (replication + failover)
5. **Cache**: Redis Sentinel cho HA
