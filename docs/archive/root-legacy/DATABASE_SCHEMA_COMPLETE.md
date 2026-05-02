# MYFIT - Complete Database Schema Documentation

Tổng hợp đầy đủ tất cả các bảng trong hệ thống MYFIT để vẽ sơ đồ ERD (Entity Relationship Diagram).

---

## 📊 Tổng quan

**Tổng số bảng:** 30 tables  
**Nhóm chức năng:** 
1. Identity & Access Management (6 tables)
2. Organization & Branches (3 tables)
3. Membership & Subscriptions (5 tables)
4. Trial Booking System (2 tables)
5. Staff & Operations (2 tables)
6. PT & Training (2 tables)
7. Billing & Payments (2 tables)
8. Health Tracking (3 tables)
9. Shifts & Course Management (4 tables)
10. Audit & Security (2 tables)

---

## 1️⃣ IDENTITY & ACCESS MANAGEMENT

### **users** - Bảng người dùng chính
```sql
- id (PK, text)
- email (unique, text)
- password_hash (text)
- status (text) -- 'active', 'inactive', 'suspended', etc.
- email_verified_at (timestamptz, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### **profiles** - Thông tin hồ sơ người dùng
```sql
- id (PK, text)
- user_id (FK → users.id)
- full_name (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### **roles** - Định nghĩa vai trò
```sql
- id (PK, text)
- code (unique, text) -- 'MANAGER', 'TRAINER', 'STAFF', 'MEMBER'
- name (text)
```

### **user_role_assignments** - Gán vai trò cho user
```sql
- id (PK, text)
- user_id (FK → users.id)
- role_id (FK → roles.id)
- branch_id (FK → branches.id, nullable) -- Vai trò theo chi nhánh
- assigned_at (timestamptz)
```

### **refresh_sessions** - Quản lý refresh token
```sql
- id (PK, text)
- user_id (FK → users.id)
- token (unique, text)
- revoked_at (timestamptz, nullable)
- created_at (timestamptz)
```

### **password_reset_tokens** - Token đặt lại mật khẩu
```sql
- id (PK, text)
- user_id (FK → users.id)
- token (unique, text)
- expires_at (timestamptz)
- used_at (timestamptz, nullable)
- created_at (timestamptz)
```

---

## 2️⃣ ORGANIZATION & BRANCHES

### **organizations** - Tổ chức/Công ty mẹ
```sql
- id (PK, text)
- name (text)
- tax_id (text, nullable) -- Mã số thuế
- created_at (timestamptz)
- updated_at (timestamptz)
```

### **branches** - Chi nhánh phòng gym
```sql
- id (PK, text)
- organization_id (FK → organizations.id, nullable)
- code (unique, text) -- 'HCM-Q1', 'HN-HBT', etc.
- name (text)
- address (text)
- phone_number (text, nullable)
- status (text) -- 'active', 'inactive', 'maintenance'
- created_at (timestamptz)
- updated_at (timestamptz)
```

### **branch_manager_assignments** - Phân công quản lý chi nhánh
```sql
- id (PK, text)
- branch_id (FK → branches.id)
- manager_user_id (FK → users.id)
- active_from (timestamptz)
- active_to (timestamptz, nullable)
- created_at (timestamptz)

-- Unique constraint: One active assignment per branch per manager
UNIQUE (branch_id, manager_user_id) WHERE active_to IS NULL
```

---

## 3️⃣ MEMBERSHIP & SUBSCRIPTIONS

### **membership_plans** - Các gói thành viên
```sql
- id (PK, text)
- code (unique, text) -- 'MONTHLY', 'QUARTERLY', 'YEARLY'
- name (text)
- price (bigint) -- Price in VND
- duration_days (integer)
- total_sessions (integer)
- is_active (boolean)
- created_at (timestamptz)
```

### **subscriptions** - Đăng ký thành viên
```sql
- id (PK, text)
- user_id (FK → users.id)
- membership_plan_id (FK → membership_plans.id)
- home_branch_id (FK → branches.id)
- status (text) -- 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'
- started_at (timestamptz)
- expires_at (timestamptz)
- total_sessions (integer)
- sessions_used (integer)
- sessions_remaining (integer)
- activated_by (FK → users.id) -- Staff who activated
- activated_at (timestamptz)
```

### **subscription_status_history** - Lịch sử thay đổi trạng thái
```sql
- id (PK, text)
- subscription_id (FK → subscriptions.id)
- from_status (text, nullable)
- to_status (text)
- changed_by (FK → users.id)
- reason (text, nullable)
- created_at (timestamptz)
```

### **member_check_ins** - Lịch sử check-in
```sql
- id (PK, text)
- user_id (FK → users.id)
- branch_id (FK → branches.id)
- subscription_id (FK → subscriptions.id, nullable)
- check_in_time (timestamptz)
- created_by (FK → users.id, nullable)
- created_at (timestamptz)
```

### **course_packages** - Gói tập theo buổi (NEW)
```sql
- id (PK, text)
- code (unique, text) -- 'COURSE-30', 'COURSE-60', 'COURSE-120'
- name (text) -- 'Gói 30 buổi', etc.
- total_sessions (integer) -- 30, 60, or 120
- price_per_session (bigint) -- 70k, 60k, 50k
- total_price (bigint) -- total_sessions * price_per_session
- description (text, nullable)
- is_active (boolean, default true)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### **course_enrollments** - Đăng ký khóa học (NEW)
```sql
- id (PK, text)
- user_id (FK → users.id)
- course_package_id (FK → course_packages.id)
- branch_id (FK → branches.id)
- status (text) -- 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'
- enrolled_at (timestamptz)
- started_at (timestamptz, nullable)
- completed_at (timestamptz, nullable)
- expires_at (timestamptz, nullable)
- total_sessions (integer)
- sessions_attended (integer, default 0)
- sessions_remaining (integer)
- session_price_at_registration (bigint) -- ⚠️ IMPORTANT: Price at time of registration (prevents invoice errors if package price changes)
- created_by (FK → users.id) -- Manager who enrolled
- created_at (timestamptz)
- updated_at (timestamptz)

-- Index
INDEX (user_id, status)
INDEX (branch_id)

-- ⚠️ IMPORTANT: Session tracking logic
-- When class_attendance is created, application MUST:
-- 1. Decrement sessions_remaining by 1
-- 2. Increment sessions_attended by 1
-- 3. If sessions_remaining = 0, set status = 'COMPLETED'
-- 
-- Recommended: Add database trigger for atomicity
-- CREATE OR REPLACE FUNCTION update_enrollment_after_checkin()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   UPDATE course_enrollments 
--   SET sessions_remaining = sessions_remaining - 1,
--       sessions_attended = sessions_attended + 1,
--       status = CASE WHEN sessions_remaining - 1 = 0 THEN 'COMPLETED' ELSE status END
--   WHERE id = NEW.enrollment_id;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- 
-- CREATE TRIGGER trg_after_class_attendance_insert
-- AFTER INSERT ON class_attendance
-- FOR EACH ROW
-- EXECUTE FUNCTION update_enrollment_after_checkin();
```

---

## 4️⃣ TRIAL BOOKING SYSTEM

### **trial_bookings** - Đặt lịch tập thử
```sql
- id (PK, text)
- guest_user_id (FK → users.id, nullable)
- full_name (text)
- phone_number (text)
- email (text)
- branch_id (FK → branches.id)
- trial_plan_name (text)
- scheduled_at (timestamptz)
- status (text) -- 'scheduled', 'completed', 'cancelled', 'no_show'
- notes (text, nullable)
- converted_subscription_id (FK → subscriptions.id, nullable)
- converted_at (timestamptz, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

-- Index
INDEX (branch_id, scheduled_at DESC)
```

### **trial_status_history** - Lịch sử trạng thái booking
```sql
- id (PK, text)
- trial_booking_id (FK → trial_bookings.id)
- from_status (text, nullable)
- to_status (text)
- changed_by (FK → users.id)
- created_at (timestamptz)
```

---

## 5️⃣ STAFF & OPERATIONS

### **staff_profiles** - Hồ sơ nhân viên
```sql
- id (PK, text)
- user_id (FK → users.id, unique)
- employee_code (unique, text)
- job_title (text) -- 'Personal Trainer', 'Receptionist', 'Manager'
- primary_branch_id (FK → branches.id)
- hire_date (date)
- status (text) -- 'active', 'inactive', 'terminated'
- created_at (timestamptz)
- updated_at (timestamptz)

-- Unique constraint
UNIQUE (user_id)
```

### **shifts** - Ca tập hàng ngày (NEW)
```sql
- id (PK, text)
- branch_id (FK → branches.id)
- shift_code (text) -- 'MORNING_1', 'MORNING_2', 'AFTERNOON_1', 'AFTERNOON_2', 'EVENING_1', 'EVENING_2'
- date (date)
- start_at (timestamptz)
- end_at (timestamptz)
- coach_capacity (integer, default 3) -- Max coaches per shift (1-3)
- created_at (timestamptz)
- updated_at (timestamptz)

-- Constraints & Indexes
UNIQUE (branch_id, date, shift_code)
INDEX (branch_id, date)
INDEX (start_at, end_at)

-- ⚠️ IMPORTANT: Application-level enforcement required
-- CHECK constraint for coach_capacity range should be added:
-- ALTER TABLE shifts ADD CONSTRAINT chk_coach_capacity 
--   CHECK (coach_capacity >= 1 AND coach_capacity <= 3);
```

#### 🔄 Real-time Coach Assignment Cache (Recommended Enhancement)
```sql
-- Optional materialized view for fast coach availability queries
CREATE MATERIALIZED VIEW IF NOT EXISTS shift_coach_summary AS
SELECT 
  s.id as shift_id,
  s.branch_id,
  s.date,
  s.shift_code,
  s.coach_capacity,
  COUNT(ta.trainer_user_id) FILTER (WHERE ta.unassigned_at IS NULL) as assigned_coaches,
  s.coach_capacity - COUNT(ta.trainer_user_id) FILTER (WHERE ta.unassigned_at IS NULL) as remaining_slots
FROM shifts s
LEFT JOIN trainer_assignments ta ON s.id = ta.shift_id
GROUP BY s.id
WITH DATA;

-- Refresh periodically or after each assignment/unassignment
CREATE INDEX idx_shift_coach_summary_branch_date 
  ON shift_coach_summary (branch_id, date);
```

---

## 6️⃣ PT & TRAINING

### **pt_packages** - Gói Personal Training
```sql
- id (PK, text)
- code (unique, text) -- 'PT-10', 'PT-20', 'PT-50'
- name (text)
- price (bigint)
- total_sessions (integer)
- is_active (boolean)
- created_at (timestamptz)
```

### **pt_sessions** - Buổi tập PT
```sql
- id (PK, text)
- member_user_id (FK → users.id)
- trainer_user_id (FK → users.id)
- pt_package_id (FK → pt_packages.id, nullable)
- branch_id (FK → branches.id)
- scheduled_at (timestamptz)
- status (text) -- 'scheduled', 'completed', 'cancelled', 'no_show'
- attended_at (timestamptz, nullable)
- notes (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### **trainer_assignments** - Phân công HLV vào ca (NEW)
```sql
- id (PK, text)
- trainer_user_id (FK → users.id)
- shift_id (FK → shifts.id)
- branch_id (FK → branches.id)
- note (text, nullable)
- assigned_at (timestamptz)
- unassigned_at (timestamptz, nullable)
- assigned_by (FK → users.id, nullable)
- active_from (timestamptz)
- active_to (timestamptz, nullable)
- is_locked (boolean, default false) -- Locked after shift ends
- locked_at (timestamptz, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

-- Constraints & Indexes
UNIQUE (trainer_user_id, shift_id) WHERE unassigned_at IS NULL
INDEX (trainer_user_id)
INDEX (shift_id)
INDEX (branch_id)
INDEX (shift_id, trainer_user_id) WHERE unassigned_at IS NULL

-- ⚠️ IMPORTANT: Coach capacity enforcement
-- Before assigning a coach, application MUST check:
-- SELECT COUNT(*) FROM trainer_assignments 
-- WHERE shift_id = ? AND unassigned_at IS NULL;
-- If count >= shifts.coach_capacity, reject assignment
```

### **class_attendance** - Điểm danh lớp tập (NEW)
```sql
- id (PK, text)
- enrollment_id (FK → course_enrollments.id) -- Links to enrollment for session tracking
- user_id (FK → users.id)
- shift_id (FK → shifts.id)
- branch_id (FK → branches.id)
- attended_at (timestamptz)
- check_in_time (timestamptz)
- status (text, default 'PRESENT') -- 'PRESENT', 'ABSENT', 'LATE', 'CANCELLED'
- notes (text, nullable)
- created_by (FK → users.id, nullable) -- Staff who checked in
- created_at (timestamptz)

-- Constraints & Indexes
UNIQUE (user_id, shift_id) -- One attendance per user per shift
INDEX (enrollment_id)
INDEX (shift_id)

-- ⚠️ IMPORTANT: Session auto-decrement on check-in
-- When creating class_attendance record:
-- 1. Verify enrollment is ACTIVE
-- 2. Verify sessions_remaining > 0
-- 3. Create attendance record
-- 4. Atomically decrement sessions_remaining in course_enrollments
-- 
-- See course_enrollments table for trigger implementation
```

-- Constraints & Indexes
UNIQUE (user_id, shift_id) -- One attendance per user per shift
INDEX (enrollment_id)
INDEX (shift_id)
```

---

## 7️⃣ BILLING & PAYMENTS

### **invoices** - Hóa đơn
```sql
- id (PK, text)
- invoice_number (unique, text) -- 'INV-2026-0001'
- user_id (FK → users.id)
- branch_id (FK → branches.id)
- total_amount (bigint) -- Amount in VND
- status (text) -- 'pending', 'paid', 'cancelled'
- due_date (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### **payments** - Thanh toán
```sql
- id (PK, text)
- invoice_id (FK → invoices.id)
- amount (bigint)
- payment_method (text) -- 'cash', 'transfer', 'pos'
- status (text) -- 'success', 'failed'
- transaction_ref (text, nullable)
- processed_at (timestamptz)
- created_by (FK → users.id)
```

---

## 8️⃣ HEALTH TRACKING

### **member_health_profiles** - Hồ sơ sức khỏe
```sql
- id (PK, text)
- user_id (FK → users.id, unique)
- date_of_birth (date, nullable)
- gender (text, nullable)
- height_cm (numeric(5,2), nullable)
- primary_goal (text, nullable) -- 'weight_loss', 'muscle_gain', 'endurance'
- medical_conditions (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

-- Unique constraint
UNIQUE (user_id)
```

### **member_weight_logs** - Nhật ký cân nặng
```sql
- id (PK, text)
- user_id (FK → users.id)
- weight_kg (numeric(5,2))
- measured_at (timestamptz)
- measurement_source (text) -- 'manual', 'inbody', 'scale'
- device_id (text, nullable)
- note (text, nullable)
- created_by (FK → users.id)
- created_at (timestamptz)
```

### **member_body_measurements** - Số đo cơ thể
```sql
- id (PK, text)
- user_id (FK → users.id)
- measurement_type (text) -- 'waist', 'chest', 'hips', 'arms', 'body_fat_percentage'
- value (numeric(6,2))
- unit (text) -- 'cm', '%', 'kg'
- measured_at (timestamptz) -- Time of actual measurement
- measurement_source (text) -- 'manual', 'inbody', 'scale'
- created_by (FK → users.id)
- created_at (timestamptz)
- shift_id (FK → shifts.id, nullable) -- Links to training session for audit trail
- is_locked (boolean, default false) -- Locked after shift ends
- locked_at (timestamptz, nullable)

-- Index
INDEX (shift_id) WHERE shift_id IS NOT NULL

-- ⚠️ IMPORTANT: Measurement workflow
-- When coach measures member during a shift:
-- 1. Create new record with shift_id = current shift
-- 2. measured_at = actual measurement time
-- 3. After shift.end_at passes, is_locked = true
-- 4. Locked measurements cannot be modified (audit integrity)
-- 
-- For real-time dashboard performance:
-- Consider materialized view for coach stats:
-- CREATE MATERIALIZED VIEW IF NOT EXISTS shift_measurement_summary AS
-- SELECT 
--   s.id as shift_id,
--   COUNT(DISTINCT ca.user_id) as total_attendees,
--   COUNT(DISTINCT mbm.user_id) FILTER (WHERE mbm.shift_id IS NOT NULL) as measured_count,
--   COUNT(DISTINCT ca.user_id) - COUNT(DISTINCT mbm.user_id) FILTER (WHERE mbm.shift_id IS NOT NULL) as not_measured_count
-- FROM shifts s
-- LEFT JOIN class_attendance ca ON s.id = ca.shift_id
-- LEFT JOIN member_body_measurements mbm ON ca.user_id = mbm.user_id AND mbm.shift_id = s.id
-- GROUP BY s.id
-- WITH DATA;
```

---

## 9️⃣ AUDIT & SECURITY

### **audit_logs** - Nhật ký hoạt động
```sql
- id (PK, text)
- actor_user_id (FK → users.id, nullable)
- action_code (text) -- 'USER_LOGIN', 'SUBSCRIPTION_ACTIVATED', etc.
- entity_type (text, nullable) -- 'User', 'Subscription', 'Branch'
- entity_id (text, nullable)
- branch_id (FK → branches.id, nullable)
- metadata_json (jsonb, default '{}')
- created_at (timestamptz)
```

### **security_events** - Sự kiện bảo mật
```sql
- id (PK, text)
- user_id (FK → users.id, nullable)
- event_type (text) -- 'LOGIN_FAILED', 'PASSWORD_CHANGED', 'BRUTE_FORCE_DETECTED'
- severity (text) -- 'low', 'medium', 'high', 'critical'
- metadata_json (jsonb, default '{}')
- created_at (timestamptz)
```

---

## 🔗 RELATIONSHIPS SUMMARY

### Core Relationships:
1. **users** ← → **profiles** (1:1)
2. **users** ← → **user_role_assignments** ← → **roles** (M:M)
3. **organizations** ← → **branches** (1:N)
4. **branches** ← → **branch_manager_assignments** ← → **users** (M:M with attributes)
5. **users** ← → **subscriptions** ← → **membership_plans** (M:1)
6. **users** ← → **trial_bookings** (1:N)
7. **users** ← → **staff_profiles** (1:1)
8. **users** ← → **pt_sessions** ← → **pt_packages** (M:1)
9. **users** ← → **invoices** ← → **payments** (1:N)
10. **users** ← → **member_health_profiles** (1:1)
11. **users** ← → **member_weight_logs** (1:N)
12. **users** ← → **member_body_measurements** (1:N)

### New Course Enrollment Relationships:
13. **users** ← → **course_enrollments** ← → **course_packages** (M:1)
14. **course_enrollments** ← → **class_attendance** (1:N)
15. **shifts** ← → **class_attendance** (1:N)
16. **shifts** ← → **trainer_assignments** ← → **users** (M:M with attributes)
17. **member_body_measurements** ← → **shifts** (N:1, optional)

---

## 📝 BUSINESS RULES

### Important Constraints:
1. **One active enrollment per user**: A user can only have one ACTIVE course_enrollment at a time
2. **One attendance per shift**: UNIQUE (user_id, shift_id) in class_attendance
3. **Coach capacity**: Max 3 coaches per shift (enforced at application level)
4. **Shift locking**: Coaches cannot modify assignments after shift.end_at
5. **Session tracking**: sessions_remaining decremented on each check-in
6. **Staff uniqueness**: Each user has at most one staff_profile
7. **Health profile uniqueness**: Each user has at most one health_profile

### Status Enums:
- **users.status**: 'active', 'inactive', 'suspended', 'deleted'
- **branches.status**: 'active', 'inactive', 'maintenance'
- **subscriptions.status**: 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'
- **trial_bookings.status**: 'scheduled', 'completed', 'cancelled', 'no_show'
- **staff_profiles.status**: 'active', 'inactive', 'terminated'
- **course_enrollments.status**: 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'
- **class_attendance.status**: 'PRESENT', 'ABSENT', 'LATE', 'CANCELLED'
- **pt_sessions.status**: 'scheduled', 'completed', 'cancelled', 'no_show'
- **invoices.status**: 'pending', 'paid', 'cancelled'
- **payments.status**: 'success', 'failed'

---

## ⚠️ IMPORTANT IMPROVEMENTS & RECOMMENDATIONS

### 1. Coach Capacity Constraint (CRITICAL)

**Problem:** `shifts.coach_capacity` is just an integer without database-level enforcement.

**Current State:**
- No CHECK constraint in SQL to limit capacity to 1-3
- Application must manually check before assigning coaches

**Recommendation:**
```sql
-- Add CHECK constraint
ALTER TABLE shifts 
  ADD CONSTRAINT chk_coach_capacity_range 
  CHECK (coach_capacity >= 1 AND coach_capacity <= 3);

-- Application-level check before assignment
SELECT COUNT(*) as current_coaches
FROM trainer_assignments 
WHERE shift_id = ? AND unassigned_at IS NULL;

-- Reject if current_coaches >= shifts.coach_capacity
```

---

### 2. Real-time Dashboard Cache for Coaches (PERFORMANCE)

**Problem:** When multiple coaches refresh dashboards during busy shifts, direct queries to `class_attendance` + `member_body_measurements` cause high DB load.

**Solution: Materialized Views**

```sql
-- Shift attendance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS shift_attendance_summary AS
SELECT 
  s.id as shift_id,
  s.branch_id,
  s.date,
  s.shift_code,
  COUNT(ca.id) as total_attendees,
  COUNT(DISTINCT ca.user_id) as unique_members
FROM shifts s
LEFT JOIN class_attendance ca ON s.id = ca.shift_id
GROUP BY s.id
WITH DATA;

-- Shift measurement completion stats
CREATE MATERIALIZED VIEW IF NOT EXISTS shift_measurement_stats AS
SELECT 
  s.id as shift_id,
  COUNT(DISTINCT ca.user_id) as total_attendees,
  COUNT(DISTINCT mbm.user_id) FILTER (WHERE mbm.shift_id = s.id) as measured_count,
  COUNT(DISTINCT ca.user_id) - COUNT(DISTINCT mbm.user_id) FILTER (WHERE mbm.shift_id = s.id) as pending_measurement
FROM shifts s
LEFT JOIN class_attendance ca ON s.id = ca.shift_id
LEFT JOIN member_body_measurements mbm ON ca.user_id = mbm.user_id AND mbm.shift_id = s.id
GROUP BY s.id
WITH DATA;

-- Refresh after each check-in or measurement
REFRESH MATERIALIZED VIEW CONCURRENTLY shift_attendance_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY shift_measurement_stats;
```

---

### 3. Auto-decrement Sessions on Check-in (DATA INTEGRITY)

**Problem:** Currently no automatic trigger to decrement `sessions_remaining` when `class_attendance` is created.

**Risk:** If application logic fails, sessions won't be decremented, causing data inconsistency.

**Solution: Database Trigger**

```sql
CREATE OR REPLACE FUNCTION update_enrollment_after_checkin()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE course_enrollments 
  SET sessions_remaining = sessions_remaining - 1,
      sessions_attended = sessions_attended + 1,
      status = CASE 
        WHEN sessions_remaining - 1 = 0 THEN 'COMPLETED' 
        ELSE status 
      END,
      updated_at = NOW()
  WHERE id = NEW.enrollment_id
    AND status = 'ACTIVE';
  
  -- Verify the update succeeded
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found or not active: %', NEW.enrollment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_class_attendance_insert
AFTER INSERT ON class_attendance
FOR EACH ROW
EXECUTE FUNCTION update_enrollment_after_checkin();
```

---

### 4. Price Snapshot at Registration (FINANCIAL ACCURACY)

**Problem:** `course_packages.price_per_session` can change over time. If prices are updated, historical enrollments will show incorrect pricing.

**Example:**
- Package price: 60k/session in Jan 2026
- Member enrolls for 60 sessions = 3,600,000đ
- In Mar 2026, price increases to 70k/session
- Without snapshot, old enrollment appears to be worth 4,200,000đ (incorrect!)

**Solution: Add `session_price_at_registration` field**

Already added to `course_enrollments` table schema above.

**Usage:**
```sql
-- When creating enrollment
INSERT INTO course_enrollments (
  user_id, 
  course_package_id, 
  branch_id,
  session_price_at_registration,  -- Capture current price
  total_sessions,
  sessions_remaining,
  ...
)
SELECT 
  ?,
  ?,
  ?,
  cp.price_per_session,  -- Snapshot the price
  cp.total_sessions,
  cp.total_sessions,
  ...
FROM course_packages cp
WHERE cp.id = ?;
```

---

### 5. Measurement Workflow Clarity (AUDIT TRAIL)

**Current State:**
- `member_body_measurements` has `shift_id` and `is_locked` ✅
- Has `measured_at` for actual measurement time ✅

**Workflow:**
1. Coach measures member during shift
2. Create record with `shift_id` = current shift
3. `measured_at` = actual measurement timestamp
4. After `shift.end_at` passes, set `is_locked = true`
5. Locked measurements cannot be modified (preserves audit integrity)

**Implementation Note:**
Application should enforce locking:
```javascript
// Before updating measurement
const shift = await shiftsRepository.findById(measurement.shift_id);
if (shift && new Date() > shift.end_at) {
  throw new Error('MEASUREMENT_LOCKED: Cannot modify measurements after shift ends');
}
```

---

### 6. Schedule Query Optimization (OPTIONAL)

**Current State:**
- Can query schedules via `shifts`, `trainer_assignments`, `class_attendance`
- Works fine for small datasets

**Optimization for Large Scale:**
If you have 1000+ shifts per month across branches, consider:

```sql
-- Pre-computed schedule cache
CREATE MATERIALIZED VIEW IF NOT EXISTS member_schedule_view AS
SELECT 
  ca.user_id,
  s.id as shift_id,
  s.date,
  s.shift_code,
  s.start_at,
  s.end_at,
  s.branch_id,
  b.name as branch_name,
  STRING_AGG(DISTINCT u.full_name, ', ') as coaches
FROM class_attendance ca
JOIN shifts s ON ca.shift_id = s.id
JOIN branches b ON s.branch_id = b.id
LEFT JOIN trainer_assignments ta ON s.id = ta.shift_id AND ta.unassigned_at IS NULL
LEFT JOIN users u ON ta.trainer_user_id = u.id
GROUP BY ca.user_id, s.id, s.date, s.shift_code, s.start_at, s.end_at, s.branch_id, b.name
WITH DATA;

-- Refresh daily or after major schedule changes
REFRESH MATERIALIZED VIEW CONCURRENTLY member_schedule_view;
```

---

## 📋 IMPLEMENTATION PRIORITY

| Priority | Improvement | Impact | Effort | Recommended Timeline |
|----------|-------------|--------|--------|---------------------|
| **HIGH** | Session auto-decrement trigger | Data Integrity | Low | Immediate |
| **HIGH** | Price snapshot field | Financial Accuracy | Low | Immediate |
| **MEDIUM** | Coach capacity CHECK constraint | Data Validation | Low | Next Sprint |
| **MEDIUM** | Real-time dashboard cache | Performance | Medium | When scaling |
| **LOW** | Schedule materialized view | UX Performance | Medium | Optional |
| **LOW** | Measurement lock enforcement | Audit Trail | Low | When needed |

---

## 🎯 RECOMMENDED ERD LAYOUT

### Suggested Grouping for Visualization:

**Top Layer (Identity):**
- users, profiles, roles, user_role_assignments

**Left Side (Organization):**
- organizations, branches, branch_manager_assignments

**Center (Core Business):**
- membership_plans, subscriptions, subscription_status_history
- course_packages, course_enrollments, class_attendance
- shifts, trainer_assignments

**Right Side (Operations):**
- trial_bookings, trial_status_history
- staff_profiles, pt_packages, pt_sessions
- member_check_ins

**Bottom (Supporting):**
- invoices, payments
- member_health_profiles, member_weight_logs, member_body_measurements
- audit_logs, security_events
- refresh_sessions, password_reset_tokens

---

**Last Updated:** 2026-04-25  
**Database:** PostgreSQL  
**Total Tables:** 30  
**Status:** Schema Complete with Enhancement Recommendations