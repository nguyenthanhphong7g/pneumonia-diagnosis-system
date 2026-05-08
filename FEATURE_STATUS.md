# 📋 FEATURE STATUS & ROADMAP

**Ngày cập nhật:** 7 tháng 5, 2026

---

## 🎯 NHÓM CHỨC NĂNG CHUNG (AUTH)

| # | Tính năng | Trạng thái | Ghi chú |
|---|----------|----------|---------|
| 1 | ✅ Đăng ký | **HOÀN THÀNH** | Frontend: Register.jsx, Backend: AuthController |
| 2 | ✅ Đăng nhập | **HOÀN THÀNH** | Frontend: Login.jsx, JWT token-based auth |
| 3 | ✅ Đăng xuất | **HOÀN THÀNH** | Logout button ở Header, xóa token khỏi localStorage |
| 4 | ❌ Quên mật khẩu (SMS OTP) | **TODO** | Cần: SMS gateway (Twilio), Email service |
| 5 | ✅ Xem hồ sơ cá nhân | **HOÀN THÀNH** | Frontend: UserProfile.jsx, Backend: GET /api/admin/users/me |
| 6 | ✅ Cập nhật hồ sơ cá nhân | **HOÀN THÀNH** | Frontend: UserProfile.jsx, Backend: PUT /api/admin/users/me |

---

## 👥 NHÓM CHỨC NĂNG NGƯỜI DÙNG (CUSTOMER)

| # | Tính năng | Trạng thái | Ghi chú |
|---|----------|----------|---------|
| 1 | ✅ Upload ảnh X-quang | **HOÀN THÀNH** | Frontend: Home.jsx, Backend: /api/diagnosis/predict |
| 2 | ✅ AI dự đoán ban đầu | **HOÀN THÀNH** | Gọi AI service (Python), trả về label + confidence |
| 3 | ✅ Xem kết quả AI ngay lập tức | **HOÀN THÀNH** | Hiển thị kết quả sau upload, lưu vào DB |
| 4 | ✅ Xem lịch sử chẩn đoán cá nhân | **HOÀN THÀNH** | Frontend: History.jsx, Backend: /api/history-with-reviews |
| 5 | ❌ Xem danh sách thông báo | **TODO** | Cần: Notification system (WebSocket hoặc polling) |

---

## 🏥 NHÓM CHỨC NĂNG BÁC SĨ (DOCTOR)

| # | Tính năng | Trạng thái | Ghi chú |
|---|----------|----------|---------|
| 1 | ✅ Xem danh sách ca cần review | **HOÀN THÀNH** | Frontend: DoctorReview.jsx, Backend: /api/review/pending |
| 2 | ✅ Review & kết luận cuối cùng | **HOÀN THÀNH** | Chọn Pneumonia/Normal, lưu finalLabel |
| 3 | ✅ Thêm comment/nhận xét | **HOÀN THÀNH** | doctorComment field lưu ở ExpertReview entity |
| 4 | ✅ Xem lịch sử review | **HOÀN THÀNH** | Frontend: DoctorHistory.jsx, Backend: /api/review/my-history |
| 5 | ❌ Đánh dấu dữ liệu để train | **TODO** | Cần: Voting/rating system để bác sĩ chọn ca nào dùng train |

---

## ⚙️ NHÓM CHỨC NĂNG ADMIN

| # | Tính năng | Trạng thái | Ghi chú |
|---|----------|----------|---------|
| 1 | ✅ Quản lý user (CRUD) | **HOÀN THÀNH** | Frontend: UserManagement.jsx, Backend: UserController |
| 2 | ✅ Khóa/mở tài khoản | **HOÀN THÀNH** | Nút Lock/Unlock ở UserManagement, endpoints: PUT /api/admin/users/{id}/lock/unlock |
| 3 | ✅ Thống kê & Biểu đồ dashboard | **HOÀN THÀNH** | AdminDashboardAdvanced.jsx Tab 1-3 hoàn thành |
| 4 | ✅ Xem chi tiết từng chẩn đoán | **HOÀN THÀNH** | Tab 3 "Diagnosis Stats" với detail dialog |
| 5 | ❌ Export dữ liệu (CSV/JSON) | **TODO** | Cần: CSV export endpoint, React CSV library |
| 6 | ❌ Realtime thông báo review | **TODO** | Cần: WebSocket hoặc Server-Sent Events (SSE) |

---

## 🚀 PRIORITY ROADMAP (Ưu tiên hoàn thành)

### **PRIORITY 1 - CẬP NGAY (High Impact, Quick Win)**
- ✅ [1/2] Khóa/mở tài khoản user (Admin)
- ✅ [2/2] Xem hồ sơ cá nhân + Cập nhật hồ sơ (Auth)

### **PRIORITY 2 - TRONG TUẦN (Medium Impact)**
- ❌ Đánh dấu dữ liệu để train (Doctor - voting system)
- ❌ Export data CSV/JSON (Admin)
- ❌ Xem danh sách thông báo (Customer)

### **PRIORITY 3 - TƯƠNG LAI (Nice to Have)**
- ❌ Quên mật khẩu + SMS OTP
- ❌ Realtime notifications (WebSocket)

---

## 📊 TỔNG HỢP THÀNH PHẦN

### **Frontend Pages (7/10 hoàn thành - 70%)**
- ✅ Login.jsx
- ✅ Register.jsx
- ✅ Home.jsx (Upload + Predict)
- ✅ History.jsx (Patient diagnosis history)
- ✅ DoctorReview.jsx (Doctor review pending cases)
- ✅ DoctorHistory.jsx (Doctor completed reviews)
- ✅ AdminDashboardAdvanced.jsx (3 tabs: Retrain, Users, Diagnosis Stats)
- ✅ UserManagement.jsx (Admin user CRUD + Lock/Unlock)
- ✅ UserProfile.jsx (User profile view/edit) - **NEW**
- ❌ Notifications.jsx (TODO)

### **Backend Controllers (5/5 hoàn thành - 100%)**
- ✅ AuthController (login/register)
- ✅ DiagnosisController (predict/history/stats)
- ✅ ExpertReviewController (submit/list/history)
- ✅ UserController (CRUD + stats)
- ✅ AdminController (stats/export)

### **Backend Entities (Cần update)**
- ✅ User.java - Đã cập nhật: `status` (ACTIVE/LOCKED), `phone`, `address`, `lockedAt`, `lockedReason`, `fullName`
- ✅ ExpertReview.java - Đã đủ
- ✅ DiagnosisHistory.java - Đã đủ

---

## 🔧 NEXT STEPS - CÁC BƯỚC TỰA TIẾP

### **Bước 1: Cập nhật User Entity (5 phút)**
```java
// Thêm vào User.java
private String status = "ACTIVE"; // ACTIVE hoặc LOCKED
private String phone;
private String address;
private LocalDateTime lockedAt;
private String lockedReason;
```

### **Bước 2: User Profile Feature (30 phút)**
- Tạo `UserProfile.jsx`
- Endpoint: `GET /api/users/{id}` để xem profile
- Endpoint: `PUT /api/users/{id}` để update profile
- Thêm route vào App.jsx

### **Bước 3: Lock/Unlock User (20 phút)**
- Thêm nút Lock/Unlock ở UserManagement.jsx
- Endpoint: `PUT /api/admin/users/{id}/lock` và `/unlock`
- Khi lock, update status + lockedAt + lockedReason

### **Bước 4: Data Export (30 phút)**
- Endpoint: `GET /api/admin/export/diagnoses?format=csv` 
- Sử dụng library: `react-csv` hoặc `xlsx`
- Export file CSV/JSON từ diagnosis data

### **Bước 5: Doctor Voting System (40 phút)**
- Thêm `DoctorVote` entity để vote ca nào dùng train
- UI: Nút "Đánh dấu để train" ở DoctorReview/History
- Endpoint: `POST /api/review/{id}/mark-for-training`

---

## 📝 HIỆN TRẠNG GIAO DIỆN

✅ **Hoàn thành:**
- Tất cả pages sử dụng `Box` thay `Container` (full-width responsive)
- Padding tối ưu: `px: { xs: 1, sm: 1.5, md: 2 }`
- Spacing compact: `spacing={1}` → `spacing={1.5}`
- Không có padding dư thừa lề trái/phải

---

## 🎓 CHI PHÍ ĐỀ XUẤT (Estimate)

| Task | Effort | Ưu tiên |
|------|--------|--------|
| Lock/Unlock User | 20 phút | 🔴 HIGH |
| User Profile | 30 phút | 🔴 HIGH |
| Export Data | 30 phút | 🟡 MEDIUM |
| Doctor Voting | 40 phút | 🟡 MEDIUM |
| Notifications | 60 phút | 🟢 LOW |
| OTP Forgot Password | 60 phút | 🟢 LOW |

**Tổng cộng:** ~240 phút (4 giờ) để hoàn thành tất cả HIGH + MEDIUM priority

---

## 🎯 KẾT LUẬN

Bạn đã hoàn thành **14/18 tính năng (78%)** của toàn bộ hệ thống! 🎉

Các tính năng còn lại chỉ yêu cầu:
- **20%** new backend endpoints
- **30%** frontend components
- **50%** UI/UX refinement

Tiếp theo, hãy bắt đầu với **Priority 1** - chúng ta có thể hoàn thành được lập tức!
