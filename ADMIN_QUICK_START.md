# ⚡ Admin Dashboard - Quick Start (5 minutes)

## 🎯 What You Get

✅ Admin Dashboard to manage model retraining  
✅ Real-time statistics  
✅ One-click retrain capability  
✅ Retrain history tracking  

---

## 📦 What Was Added

### Frontend Components
```
frontend/src/pages/
  ├── AdminDashboard.jsx           (Basic UI)
  └── AdminDashboardAdvanced.jsx   ✅ (Used - Advanced UI with history)

frontend/src/components/
  ├── layout/SidebarAdmin.jsx      (Admin sidebar)
  └── ProtectedAdminRoute.jsx      (Access control)
```

### Modified Files
```
frontend/src/
  ├── App.jsx (Added admin routes)
  └── context/AuthContext.jsx (Already supports admin role)

backend/src/main/java/com/example/demo/entity/
  └── User.java (Updated: ADMIN role support)
```

---

## 🚀 100% Setup (3 Steps)

### Step 1: Create Admin User (SQL)

Run this SQL command in MSSQL:

```sql
-- Check if admin exists
SELECT * FROM users WHERE username = 'admin_user';

-- Create new admin user (if doesn't exist)
INSERT INTO users (username, email, password, role, enabled, created_at)
VALUES (
  'admin_user', 
  'admin@pneumonia.local', 
  'bcrypt_hash_here',  -- Use BCryptPasswordEncoder
  'ADMIN',
  1,
  GETDATE()
);

-- Or update existing user to ADMIN
UPDATE users SET role = 'ADMIN' WHERE username = 'admin_user';
```

**For Password Hashing**, use Java BCrypt:
```java
// In your Java code
String rawPassword = "admin123";
String encodedPassword = new BCryptPasswordEncoder().encode(rawPassword);
// Use encodedPassword in SQL INSERT
```

**Quick Test Password**:  
If you have a simple password encoder, use this format.

### Step 2: Frontend is Ready ✅

No additional setup needed!
- AdminDashboardAdvanced component exists
- Routes configured in App.jsx
- ProtectedAdminRoute guards access
- SidebarAdmin component ready

### Step 3: Test It

```
1. Start Frontend: npm run dev
2. Go to: http://localhost:5173/login
3. Username: admin_user
4. Password: <your_password>
5. Click "Model Dashboard" in sidebar
6. Done! You're in the admin dashboard
```

---

## 📊 Dashboard Overview

### Top Section: Key Metrics (4 cards)
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ TOTAL REVIEWS│ USED TRAINING│ WAITING      │ CLASS DIST.  │
│     50       │      40      │      10      │  25 : 25     │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Middle Section: Progress Bar
```
Training Progress: ████████░░ 80%
Used: 40 / 50 | Pending: 10
```

### Action Buttons
```
[Retrain Unused (10)] [Retrain All (50)] [Refresh]
```

### Pending Reviews Table
```
Shows 10 reviews waiting to be used for retrain
Click row for details
```

### Retrain History Table
```
All previous retrain operations
Date, Type, Samples, Status
```

---

## 🔄 How to Retrain

### Option 1: Retrain with Unused Reviews (Recommended)
```
1. Click: "Retrain Unused (10)" button
2. See confirmation dialog
3. Click: "Confirm"
4. Wait 10-30 seconds (loading spinner shows)
5. ✅ Success message appears
6. Stats update automatically
7. New entry in Retrain History
```

**When to use:**
- When you have 10+ new reviews
- Daily/weekly updates
- Incremental improvement

### Option 2: Retrain with All Reviews
```
1. Click: "Retrain All (50)" button
2. See confirmation dialog
3. Click: "Confirm"
4. Wait 10-30 seconds
5. ✅ Success message
6. Stats update
7. History entry added
```

**When to use:**
- Weekly/monthly full optimization
- Performance baseline reset
- Full dataset retraining

### Option 3: Refresh Stats
```
1. Click: "Refresh" button
2. Stats reload immediately
3. Shows latest data
```

**Note:** Stats auto-refresh every 30 seconds anyway!

---

## 📈 What Happens Behind Scenes

```
Admin clicks "Retrain Unused"
        ↓
Frontend calls: POST /api/admin/retrain-unused
        ↓
Backend (TrainingDataService):
  ├─ Find 10 reviews (isUsedForTraining=false)
  ├─ Collect image files
  ├─ Prepare labels
  └─ Call AI service /retrain
        ↓
AI Service:
  ├─ Extract features (ViT)
  ├─ Scale data
  ├─ Train model
  └─ Save model_lr.pkl + scaler.pkl
        ↓
Backend:
  ├─ Update database (isUsedForTraining=true)
  └─ Return success response
        ↓
Frontend:
  ├─ Show success message
  ├─ Update stats (40 → 50, 10 → 0)
  └─ Add history entry
```

---

## 🎛️ Dashboard Features

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Real-time Stats** | Live metrics updating | Know current model state |
| **Progress Bar** | Visual training progress | See completion status |
| **One-Click Retrain** | Simple button click | No complex setup needed |
| **Confirmation Dialog** | Prevent accidental retrain | Safety mechanism |
| **Pending Reviews** | See what's ready | Plan retrain timing |
| **Retrain History** | Track all operations | Audit trail |
| **Auto-Refresh** | Updates every 30sec | Stay current |
| **Error Handling** | Clear error messages | Easy troubleshooting |

---

## 🔒 Access Control

```
User Role Detection:
┌──────────────────────────────────────┐
│ User.role == 'ADMIN'?                │
│  ├─ YES → Show AdminDashboard       │
│  └─ NO  → Show "Access Denied"      │
└──────────────────────────────────────┘

Protected Route:
  /admin-dashboard
  ├─ Guards with ProtectedAdminRoute component
  └─ Checks AuthContext.user.role
```

---

## 🧪 Quick Test Commands

### Check if ADMIN user exists
```sql
SELECT id, username, role FROM users WHERE role = 'ADMIN';
```

### Test API in Browser Console
```javascript
// Test stats endpoint
fetch('http://localhost:8080/api/admin/model-stats')
  .then(r => r.json())
  .then(d => console.log('Stats:', d))

// Test retrain endpoint
fetch('http://localhost:8080/api/admin/retrain-unused', {
  method: 'POST'
})
  .then(r => r.json())
  .then(d => console.log('Retrain result:', d))
```

### Using cURL
```bash
# Get stats
curl http://localhost:8080/api/admin/model-stats

# Trigger retrain
curl -X POST http://localhost:8080/api/admin/retrain-unused
```

---

## ⚠️ Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| **"Access Denied" page** | User role must be 'ADMIN' in database |
| **No sidebar visible** | Not logged in - go to /login |
| **Stats show 0** | Backend not running or DB empty |
| **Retrain button disabled** | Need at least 1 unused review |
| **"Lỗi khi tải dữ liệu"** | Backend API not responding |
| **Blank page** | Check browser console for JS errors |
| **Can't find /admin-dashboard** | Frontend not restarted after code changes |

---

## 🎨 Screenshots Description

### Main Dashboard
- 4 colored cards at top (Total, Used, Pending, Classes)
- Progress bar showing 80% completion
- 3 action buttons below
- Two tables for reviews and history

### Retrain Dialog
- Title: "🔄 Retrain with Unused Reviews"
- Confirmation message
- Warning: "Do not close page during retrain"
- Cancel / Confirm buttons

---

## 📱 Mobile Responsiveness

Dashboard works on:
- ✅ Desktop (1920px+)
- ✅ Laptop (1200px+)
- ✅ Tablet (768px+)
- ✅ Mobile (320px+)

Cards stack vertically on small screens.

---

## 🚀 Next Steps

After setup:
1. ✅ Login as admin
2. ✅ View Admin Dashboard
3. ✅ Check current stats
4. ✅ Review pending reviews
5. ✅ Click "Retrain Unused"
6. ✅ Monitor progress
7. ✅ See stats update
8. ✅ Check retrain history

**That's it!** Your admin dashboard is working! 🎉

---

## 📞 Support

If dashboard doesn't appear:
1. Check user role in database: `SELECT role FROM users WHERE username = 'your_username'`
2. Verify it says 'ADMIN'
3. Clear browser cache (Ctrl+Shift+Del)
4. Logout and login again
5. Check frontend console for JS errors (F12)
6. Check backend logs for API errors

---

## ✨ Summary

✅ Admin Dashboard: **READY**  
✅ Protected Routes: **WORKING**  
✅ API Endpoints: **CONFIGURED**  
✅ UI Components: **COMPLETE**  

🚀 **Status: READY TO USE**

---

**Created**: May 6, 2026  
**Time to Setup**: ~5 minutes  
**Difficulty**: Easy ⭐

