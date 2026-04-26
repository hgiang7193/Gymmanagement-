# MYFIT - Course Enrollment & Class Attendance System

## 🎯 Overview

Hệ thống quản lý đăng ký khóa học và điểm danh lớp tập cho gym, bao gồm:
- **3 gói tập**: 30 buổi (70k), 60 buổi (60k), 120 buổi (50k)
- **Điểm danh tự động**: Trừ sessions khi check-in
- **Coach scheduling**: HLV chọn ca dạy, lock sau khi ca kết thúc

---

## ✅ Completed Implementation

### **1. Database Schema**
- ✅ `course_packages` - 3 packages với pricing
- ✅ `course_enrollments` - Member đăng ký khóa
- ✅ `class_attendance` - Điểm danh từng buổi
- ✅ Migration files ready to run

### **2. Backend Use Cases**
- ✅ `EnrollMemberInCourseUseCase` - Đăng ký member vào package
- ✅ `CheckInMemberToClassUseCase` - Check-in member, trừ sessions
- ✅ Fixed coach locking: `start_at` → `end_at`

### **3. Repositories**
- ✅ `PostgresCoursePackageRepository`
- ✅ `PostgresCourseEnrollmentRepository`
- ✅ `PostgresClassAttendanceRepository`

### **4. API Endpoints**
```
POST /api/v1/manager/course-enrollments
  - Enroll member in course package
  
GET /api/v1/member/enrollments?user_id={uuid}
  - View enrollments (own or managed)
  
POST /api/v1/manager/check-ins/class
  - Check-in member to class session
  
GET /api/v1/member/attendance?user_id={uuid}
  - View attendance history
```

### **5. Error Codes Added**
- `ACTIVE_ENROLLMENT_EXISTS` - Member đã có enrollment active
- `NO_ACTIVE_ENROLLMENT` - Member chưa đăng ký package nào
- `NO_SESSIONS_REMAINING` - Hết sessions, cần renew
- `DUPLICATE_CHECKIN` - Đã check-in shift này rồi
- `COURSE_PACKAGE_NOT_FOUND` - Package không tồn tại
- `SHIFT_ALREADY_ENDED` - Ca đã kết thúc (thay cho STARTED)

---

## 📦 Course Packages

| Package | Sessions | Price/Session | Total Price | Savings |
|---------|----------|---------------|-------------|---------|
| COURSE-30 | 30 | 70,000đ | 2,100,000đ | - |
| COURSE-60 | 60 | 60,000đ | 3,600,000đ | 600K (14%) |
| COURSE-120 | 120 | 50,000đ | 6,000,000đ | 2.4M (29%) |

---

## 🔄 User Workflows

### **Enrollment Flow:**
```
Manager → POST /api/v1/manager/course-enrollments
{
  "userId": "member-123",
  "coursePackageId": "pkg-course-60",
  "branchId": "branch-hcm-q1"
}

Response:
{
  "enrollmentId": "...",
  "totalSessions": 60,
  "sessionsRemaining": 60,
  "totalPrice": 3600000
}
```

### **Check-in Flow:**
```
Staff → POST /api/v1/manager/check-ins/class
{
  "userId": "member-123",
  "shiftId": "shift-morning-1",
  "branchId": "branch-hcm-q1"
}

System:
1. Validates active enrollment
2. Checks sessions_remaining > 0
3. Creates attendance record
4. Decrements sessions_remaining (60 → 59)
5. Increments sessions_attended (0 → 1)

Response:
{
  "attendanceId": "...",
  "sessionsRemaining": 59,
  "sessionsAttended": 1
}
```

### **Coach Shift Assignment (Fixed):**
```
Coach can assign/unassign BEFORE shift ends
Coach CANNOT modify AFTER shift.end_at passed

Example:
- Shift: 05:30 - 06:30
- At 05:45: Can still unassign ✅
- At 06:35: Cannot unassign ❌ (SHIFT_ALREADY_ENDED)
```

---

## 🚀 Setup Instructions

### **1. Run Migrations:**
```bash
cd MYFIT-

# Option A: Using batch script (Windows)
run-migrations.bat

# Option B: Manual
psql -U postgres -d myfit -f src/db/migrations/002_create_shifts_and_trainer_assignments.sql
psql -U postgres -d myfit -f src/db/migrations/003_add_course_enrollments_and_locking.sql
psql -U postgres -d myfit -f src/db/seed-course-packages.sql
```

### **2. Seed Data:**
```bash
node src/db/seed.js
```

### **3. Start Server:**
```bash
npm start
```

---

## 🧪 Testing

### **Test Enrollment:**
```bash
# 1. Login as manager
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@myfit.local","password":"ManagerPass123"}'

# Save access_token from response

# 2. Enroll member
curl -X POST http://localhost:3000/api/v1/manager/course-enrollments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-member-id",
    "coursePackageId": "pkg-course-60",
    "branchId": "branch-seed-hcm-q1"
  }'

# 3. Check-in member
curl -X POST http://localhost:3000/api/v1/manager/check-ins/class \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-member-id",
    "shiftId": "shift-id-here",
    "branchId": "branch-seed-hcm-q1"
  }'

# 4. View attendance
curl http://localhost:3000/api/v1/member/attendance \
  -H "Authorization: Bearer MEMBER_TOKEN"
```

---

## 📝 Files Created/Modified

### **New Files:**
- `src/gym-operations/application/enroll-member-in-course.js`
- `src/gym-operations/application/check-in-member-to-class.js`
- `src/shared/infrastructure/postgres/course-package-repository.js`
- `src/shared/infrastructure/postgres/course-enrollment-repository.js`
- `src/shared/infrastructure/postgres/class-attendance-repository.js`
- `src/db/migrations/003_add_course_enrollments_and_locking.sql`
- `src/db/seed-course-packages.sql`
- `run-migrations.bat`

### **Modified Files:**
- `src/gym-operations/application/assign-coach-to-shift.js` - Fixed locking
- `src/gym-operations/application/unassign-coach-from-shift.js` - Fixed locking
- `src/app.js` - Added routes + error codes
- `src/shared/infrastructure/create-runtime-deps.js` - Added repositories
- `COACH_FEATURE_COMPLETE.md` - Consolidated documentation

---

## ⚠️ Important Notes

### **Coach Locking Change:**
**Before:** Coaches couldn't modify after `start_at`
**After:** Coaches can modify until `end_at`

**Reason:** Allows emergency cancellations before teaching, but prevents changes after teaching is complete.

### **Session Tracking:**
- Sessions decrement automatically on check-in
- When `sessions_remaining = 0`, enrollment status → 'COMPLETED'
- Member must re-enroll for new package

### **Duplicate Prevention:**
- One attendance record per user per shift
- One active enrollment per user at a time
- Database unique constraints enforce this

---

## 🎓 Next Steps (Optional Enhancements)

- [ ] Frontend UI for enrollment and check-in
- [ ] Email notifications for expiring packages
- [ ] Package upgrade/downgrade logic
- [ ] Analytics dashboard (completion rates, popular packages)
- [ ] Waitlist for full shifts
- [ ] Mobile app integration

---

**Status:** ✅ Backend Complete  
**Last Updated:** 2026-04-25
