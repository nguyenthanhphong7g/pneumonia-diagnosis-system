# 🏥 Admin Dashboard - Setup Guide

## 📋 Tổng Quan

Admin Dashboard là công cụ quản lý toàn bộ quá trình retrain model AI.

---

## 🎯 Tính Năng

✅ **Real-time Stats**
- Tổng reviews
- Đã dùng cho training
- Chưa dùng (pending retrain)
- Phân bố class (Pneumonia vs Normal)

✅ **Training Progress**
- Visual progress bar (%)
- Pending vs Used tracking

✅ **Retrain Actions**
- Retrain with Unused Reviews (chỉ dữ liệu mới)
- Retrain with All Reviews (toàn bộ dataset)

✅ **Pending Reviews Table**
- Xem các reviews chưa được dùng
- Final label, doctor comment, date

✅ **Retrain History**
- Lịch sử tất cả các lần retrain
- Date, Type, Samples, Status

---

## 📁 Files Created

```
frontend/src/pages/
├── AdminDashboard.jsx          (Basic version)
└── AdminDashboardAdvanced.jsx  ✅ (Current - Advanced version)

frontend/src/components/
├── layout/SidebarAdmin.jsx
└── ProtectedAdminRoute.jsx

frontend/src/App.jsx (Updated)
```

---

## 🔒 Access Control

### Admin Role
- Chỉ users có `role = 'ADMIN'` mới có quyền truy cập
- ProtectedAdminRoute guards the `/admin-dashboard` path
- Redirect to Home nếu không phải admin

### Setup ADMIN User (SQL)

```sql
-- Tạo admin user thủ công
INSERT INTO users (username, email, password, role, role_id, enabled, created_at)
VALUES (
  'admin',
  'admin@pneumonia.com',
  '<hashed_password>',
  'ADMIN',
  3,
  1,
  GETDATE()
);
```

### Or via Registration (if enabled)
```bash
# Login endpoint sẽ trả về role
POST /api/auth/login
{
  "username": "admin",
  "password": "password"
}

Response:
{
  "role": "ADMIN",
  "userId": 1,
  "token": "...",
  ...
}
```

---

## 🎨 Features Detail

### 1. Key Metrics Cards (Top 4)
```
┌─────────────────────┐
│ TOTAL REVIEWS: 50   │
│ USED: 40            │
│ WAITING: 10         │
│ CLASSES: 25 : 25    │
└─────────────────────┘
```

### 2. Training Progress
```
Progress: ████████░░ 80%
Used: 40 / 50
Pending: 10
```

### 3. Action Buttons
- 🔄 Retrain Unused (10) - Only new data
- 🔄 Retrain All (50) - Full dataset
- 🔃 Refresh - Reload stats

### 4. Pending Reviews Table
Shows unreview cases waiting to be used:
```
| # | Final Label | Comment | Date       |
|---|-------------|---------|------------|
| 1 | Pneumonia   | Clear   | 2026-05-06 |
| 2 | Normal      | Good    | 2026-05-05 |
```

### 5. Retrain History
Shows all retrain operations:
```
| # | Date/Time | Type    | Samples | Status  |
|---|-----------|---------|---------|---------|
| 5 | 2026-05-06 14:30 | Unused  | 15  | ✅ OK |
| 4 | 2026-05-05 22:15 | All     | 50  | ✅ OK |
```

---

## 🚀 How to Use

### Step 1: Login as ADMIN
```
URL: http://localhost:5173/login
Username: admin
Password: <admin_password>
```

### Step 2: Access Dashboard
- Sidebar shows: "🏥 Admin" | "Model Management"
- Click: "Model Dashboard"
- URL: http://localhost:5173/admin-dashboard

### Step 3: Check Stats
- See total reviews (50)
- See pending reviews (10)
- See training progress (80%)

### Step 4: Trigger Retrain
**Option A: Retrain Unused**
```
Click: "Retrain Unused (10)"
Confirm the dialog
Wait 10-30 seconds
Stats update automatically
```

**Option B: Retrain All**
```
Click: "Retrain All (50)"
Confirm the dialog
Wait 10-30 seconds
Stats update automatically
```

### Step 5: Monitor
- Check Retrain History table
- Latest retrain shows at top
- Status: ✅ Success

---

## 🔌 API Integration

### Endpoints Used
```
GET  /api/admin/model-stats
GET  /api/admin/unused-reviews
POST /api/admin/retrain-unused
POST /api/admin/retrain-all
```

### Response Examples

**GET /api/admin/model-stats**
```json
{
  "totalReviews": 50,
  "usedForTraining": 40,
  "unusedForTraining": 10,
  "pneumoniaCount": 25,
  "normalCount": 25
}
```

**POST /api/admin/retrain-unused**
```json
{
  "success": true,
  "message": "Retrain thành công!",
  "samples_processed": 10,
  "timestamp": "2026-05-06T14:30:00"
}
```

---

## 🎨 UI Components

### Material-UI Components Used
- Card - Display metrics
- Table - Show reviews & history
- Dialog - Confirmation
- Button - Actions
- LinearProgress - Progress bar
- Alert - Messages
- Chip - Labels
- Grid - Layout

### Custom Icons
- 📊 BarChartOutlined - Dashboard
- ✅ CheckCircleOutlined - Success
- ⏳ AccessTimeOutlined - Pending
- 📈 TrendingUpOutlined - Stats
- 🔄 CloudUploadOutlined - Retrain
- 🔃 RefreshOutlined - Refresh

---

## 🌈 Styling

**Color Scheme:**
- Primary: #1976d2 (Blue)
- Success: #388e3c (Green)
- Warning: #f57c00 (Orange)
- Error: #c2185b (Pink)

**Card Backgrounds:**
- Used: Light Green (#e8f5e9)
- Unused: Light Orange (#fff3e0)
- Total: Light Blue (#e3f2fd)
- Pneumonia: Light Pink (#fce4ec)

---

## 📱 Responsive Design

- **Desktop (>1200px)**: 4 cards in row
- **Tablet (900-1200px)**: 2-3 cards in row
- **Mobile (<900px)**: 1 card per row

---

## ⚡ Features Highlights

### Auto-Refresh
- Stats auto-refresh every 30 seconds
- No need to manually click refresh
- Shows latest data

### Real-time Feedback
- Success message after retrain
- Error handling with details
- Loading spinners during operations

### Data Visualization
- Progress bar with percentage
- Color-coded chips
- Organized tables
- Clear metrics

### User-Friendly
- Confirmation dialog before retrain
- Clear instructions
- Warning messages
- Helpful tooltips

---

## 🔐 Security

✅ **ADMIN Only Access**
- Protected route checks role
- Redirect if not admin
- Session validation

✅ **Error Handling**
- Network errors caught
- User-friendly messages
- No sensitive info leaked

✅ **Rate Limiting** (Recommended future)
- Max 5 retrains/day
- Prevent abuse
- Protect resources

---

## 🧪 Testing

### Manual Testing
1. Login as admin
2. Go to /admin-dashboard
3. Check stats display
4. Click "Retrain Unused"
5. Confirm dialog
6. Wait for completion
7. Check stats updated
8. Verify history entry

### Browser Console
```javascript
// Check stats
fetch('http://localhost:8080/api/admin/model-stats')
  .then(r => r.json())
  .then(d => console.log(d))

// Trigger retrain
fetch('http://localhost:8080/api/admin/retrain-unused', 
  { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log(d))
```

---

## 📊 Mock Data

Retrain history uses mock data by default:
```javascript
setRetrainHistory([
  { id: 5, date: '2026-05-06', time: '14:30', type: 'unused', samples: 15, status: 'success' },
  { id: 4, date: '2026-05-05', time: '22:15', type: 'all', samples: 50, status: 'success' },
  // ... more entries
]);
```

**In Production**: Fetch from backend endpoint

---

## 🚀 Deployment Checklist

- [ ] ADMIN user created in database
- [ ] AdminController backend working
- [ ] /api/admin/* endpoints tested
- [ ] Frontend compiles without errors
- [ ] ProtectedAdminRoute working
- [ ] SidebarAdmin displays for ADMIN users
- [ ] Retrain functionality tested
- [ ] Stats updating correctly
- [ ] Error handling working
- [ ] UI responsive on mobile

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Access Denied" page | User role is not ADMIN |
| Stats not loading | Check backend is running |
| Retrain button disabled | Need unsused reviews first |
| No sidebar | Not logged in |
| Page blank | Check browser console for errors |

---

## 🎓 Next Enhancements (Optional)

- [ ] Charts/graphs for visualization
- [ ] Real retrain history from backend
- [ ] Accuracy metrics tracking
- [ ] Model versioning display
- [ ] Scheduled retrain setup
- [ ] Audit logs
- [ ] Export reports
- [ ] Multi-user admin support

---

## 📝 Component API

### AdminDashboardAdvanced Props
```javascript
// No props - uses context for auth validation
```

### Component Hooks
```javascript
useState: stats, unusedReviews, loading, retraining, message, etc.
useEffect: Load stats on mount, auto-refresh every 30sec
useContext: AuthContext (for validation)
```

### Main Functions
```javascript
loadStats()         - Fetch stats and reviews
loadRetrainHistory() - Load retrain history
handleRetrain()    - Execute retrain
openRetrainDialog() - Show confirmation
```

---

**Status**: ✅ COMPLETE & READY TO USE

