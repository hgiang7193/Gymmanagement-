# MYFIT - Hệ Thống Quản Lý Gym & Coach Scheduling

## 📋 Tổng Quan Dự Án

Hệ thống MYFIT quản lý phòng gym với các tính năng chính:
- **Coach Scheduling**: HLV chọn ca dạy, điểm danh
- **Course Enrollment**: Học viên đăng ký gói 30/60/120 buổi
- **Class Attendance**: Điểm danh từng buổi, cân đo chỉ số
- **RBAC**: Admin, Manager, Coach, Member roles

---

## 🎯 Course Packages (Gói Tập)

### **3 Gói Tập với Volume Discount:**

| Gói | Số buổi | Giá/buổi | Tổng | Tiết kiệm |
|-----|---------|----------|------|-----------|
| **COURSE-30** | 30 | 70,000đ | 2.1M | - |
| **COURSE-60** | 60 | 60,000đ | 3.6M | 600K (14%) |
| **COURSE-120** | 120 | 50,000đ | 6.0M | 2.4M (29%) 🔥 |

**Pricing Strategy:**
- Entry-level affordable (70k/buổi)
- Volume discount encourages commitment (14-29% off)
- 120 sessions = ~4-6 months realistic commitment
- Profitable at all tiers (no loss)

---

## 🔄 User Workflows

### **1. Coach Shift Assignment**

```
HLV xem lịch → Chọn ca trống (1-3 HLV/ca) → Đăng ký
→ Có thể hủy TRƯỚC khi ca kết thúc
→ KHÔNG thể hủy SAU khi ca kết thúc (end_at passed)
```

**Business Rules:**
- ✅ Mỗi ca: 1 <= số HLV <= 3
- ✅ Lock sau khi `now >= end_at` (không phải start_at!)
- ✅ Branch scope enforcement
- ✅ Auto-generate 6 shifts/ngày (5h30-20h30)

### **2. Member Course Enrollment**

```
Manager đăng ký member → Chọn gói (30/60/120 buổi)
→ Thanh toán → Enrollment created
→ sessions_remaining = total_sessions
```

### **3. Daily Class Attendance**

```
Member đến tập → Check-in vào shift
→ Tạo attendance record
→ sessions_remaining -= 1
→ sessions_attended += 1
```

**Business Rules:**
- ✅ Chỉ check-in nếu `sessions_remaining > 0`
- ✅ Không check-in trùng 1 shift 2 lần
- ✅ Attendance link với enrollment

### **4. Body Measurements**

```
Trước/Sau tập → Nhập chỉ số (cân nặng, mỡ, cơ...)
→ Lưu với shift_id
→ is_locked = false (có thể sửa)
→ Sau khi shift.end_at passed → is_locked = true (không thể sửa)
```

---

## 🗄️ Database Schema

### **Core Tables:**

**1. shifts** - Ca tập hàng ngày
```sql
CREATE TABLE shifts (
  id TEXT PRIMARY KEY,
  branch_id TEXT REFERENCES branches(id),
  shift_code TEXT NOT NULL,
  date DATE NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  coach_capacity INTEGER DEFAULT 3
);
```

**2. trainer_assignments** - HLV đăng ký ca
```sql
CREATE TABLE trainer_assignments (
  id TEXT PRIMARY KEY,
  trainer_user_id TEXT REFERENCES users(id),
  shift_id TEXT REFERENCES shifts(id),
  is_locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMPTZ NULL
);
```

**3. course_packages** - Gói tập (30/60/120)
```sql
CREATE TABLE course_packages (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  total_sessions INTEGER NOT NULL,
  price_per_session BIGINT NOT NULL,
  total_price BIGINT NOT NULL
);
```

**4. course_enrollments** - Member đăng ký khóa
```sql
CREATE TABLE course_enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  course_package_id TEXT REFERENCES course_packages(id),
  total_sessions INTEGER NOT NULL,
  sessions_remaining INTEGER NOT NULL
);
```

**5. class_attendance** - Điểm danh từng buổi
```sql
CREATE TABLE class_attendance (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT REFERENCES course_enrollments(id),
  user_id TEXT REFERENCES users(id),
  shift_id TEXT REFERENCES shifts(id)
);
```

---

## 🔧 API Endpoints

### **Coach:**
```
GET /api/v1/coach/shifts?branch_id=&date=
POST /api/v1/coach/shifts/{id}/assign
DELETE /api/v1/coach/shifts/{id}/assign
```

### **Manager:**
```
POST /api/v1/manager/course-enrollments (TODO)
POST /api/v1/manager/check-ins/class (TODO)
```

### **Member:**
```
GET /api/v1/member/enrollments (TODO)
POST /api/v1/member/measurements (TODO)
```

---

## ⚙️ Implementation Files

### **Backend:**
- `src/db/migrations/002_create_shifts_and_trainer_assignments.sql`
- `src/db/migrations/003_add_course_enrollments_and_locking.sql`
- `src/db/seed-course-packages.sql` - 3 packages pricing
- `gym-operations/application/*coach*.js` - Use cases
- `shared/infrastructure/postgres/*shift*.js` - Repositories

### **Frontend:**
- `frontend/src/components/features/coach-shifts-panel.tsx`
- `frontend/src/app/coach/page.tsx`
- `frontend/src/app/coach/shifts/page.tsx`

---

## 🚀 Quick Start

### **1. Setup Database:**
```bash
psql -U postgres -d myfit_db -f src/db/migrations/002_create_shifts_and_trainer_assignments.sql
psql -U postgres -d myfit_db -f src/db/migrations/003_add_course_enrollments_and_locking.sql
psql -U postgres -d myfit_db -f src/db/seed-course-packages.sql
node src/db/seed.js
```

### **2. Start Servers:**
```bash
# Backend
cd MYFIT- && npm start

# Frontend
cd frontend && npm run dev
```

### **3. Test:**
- Login: `coach@myfit.local` / `CoachPass123`
- Navigate to: `/coach/shifts`
- Assign/unassign from shifts

---

## 📝 TODO List

### **High Priority:**
- [ ] Implement `EnrollMemberInCourseUseCase`
- [ ] Implement `CheckInMemberToClassUseCase`
- [ ] Fix coach locking: `start_at` → `end_at`
- [ ] Add course enrollment API endpoints
- [ ] Cron job for auto-locking expired shifts

### **Medium Priority:**
- [ ] Frontend: Course enrollment UI
- [ ] Frontend: Attendance history
- [ ] Body measurements recording UI

---

**Last Updated:** 2026-04-25  
**Status:** Coach scheduling complete, Course enrollment TODO
