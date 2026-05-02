-- ==========================================
-- AUTO SESSION DECREMENT & PERFORMANCE OPTIMIZATIONS
-- ==========================================
-- Migration 004: Adds automatic session tracking, price snapshots, 
-- coach capacity constraints, and real-time dashboard views
-- ==========================================

-- 1. ADD PRICE SNAPSHOT TO COURSE_ENROLLMENTS
-- ==========================================
ALTER TABLE course_enrollments 
  ADD COLUMN IF NOT EXISTS session_price_at_registration bigint null;

-- Backfill existing enrollments with current package prices
UPDATE course_enrollments ce
SET session_price_at_registration = cp.price_per_session
FROM course_packages cp
WHERE ce.course_package_id = cp.id
  AND ce.session_price_at_registration IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE course_enrollments 
  ALTER COLUMN session_price_at_registration SET NOT NULL;

COMMENT ON COLUMN course_enrollments.session_price_at_registration IS 'Price per session at time of registration (prevents invoice errors if package price changes)';


-- 2. ADD COACH CAPACITY CHECK CONSTRAINT
-- ==========================================
ALTER TABLE shifts 
  ADD CONSTRAINT chk_coach_capacity_range 
  CHECK (coach_capacity >= 1 AND coach_capacity <= 3);

COMMENT ON COLUMN shifts.coach_capacity IS 'Max coaches per shift (1-3). Enforced by CHECK constraint.';


-- 3. AUTO-DECREMENT SESSIONS TRIGGER
-- ==========================================
-- Function to automatically update enrollment when attendance is recorded
CREATE OR REPLACE FUNCTION update_enrollment_after_checkin()
RETURNS TRIGGER AS $$
DECLARE
  v_remaining integer;
BEGIN
  -- Atomically decrement sessions and get new value
  UPDATE course_enrollments 
  SET sessions_remaining = sessions_remaining - 1,
      sessions_attended = sessions_attended + 1,
      status = CASE 
        WHEN sessions_remaining - 1 = 0 THEN 'COMPLETED' 
        ELSE status 
      END,
      updated_at = NOW()
  WHERE id = NEW.enrollment_id
    AND status = 'ACTIVE'
  RETURNING sessions_remaining INTO v_remaining;
  
  -- Verify the update succeeded
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ENROLLMENT_NOT_ACTIVE: Enrollment % is not active or not found', NEW.enrollment_id;
  END IF;
  
  -- Safety check: should never go negative
  IF v_remaining < 0 THEN
    RAISE EXCEPTION 'SESSION_OVERFLOW: Cannot have negative sessions remaining';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for re-running migration)
DROP TRIGGER IF EXISTS trg_after_class_attendance_insert ON class_attendance;

-- Create trigger
CREATE TRIGGER trg_after_class_attendance_insert
AFTER INSERT ON class_attendance
FOR EACH ROW
EXECUTE FUNCTION update_enrollment_after_checkin();

COMMENT ON FUNCTION update_enrollment_after_checkin() IS 'Automatically decrements sessions_remaining when attendance is recorded';


-- 4. PREVENT DUPLICATE CHECK-IN PER SHIFT
-- ==========================================
-- This is already enforced by UNIQUE constraint, but let's add explicit error handling
CREATE OR REPLACE FUNCTION prevent_duplicate_checkin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if attendance already exists for this user in this shift
  IF EXISTS (
    SELECT 1 FROM class_attendance 
    WHERE user_id = NEW.user_id 
      AND shift_id = NEW.shift_id
      AND id != NEW.id  -- Allow self in UPDATE
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_CHECKIN: User % already checked in to shift %', NEW.user_id, NEW.shift_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_checkin ON class_attendance;

CREATE TRIGGER trg_prevent_duplicate_checkin
BEFORE INSERT ON class_attendance
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_checkin();


-- 5. REAL-TIME DASHBOARD MATERIALIZED VIEWS
-- ==========================================

-- 5a. Shift Attendance Summary
-- Shows how many members checked in per shift
DROP MATERIALIZED VIEW IF EXISTS shift_attendance_summary;

CREATE MATERIALIZED VIEW shift_attendance_summary AS
SELECT 
  s.id as shift_id,
  s.branch_id,
  s.date,
  s.shift_code,
  s.start_at,
  s.end_at,
  COUNT(ca.id) as total_checkins,
  COUNT(DISTINCT ca.user_id) as unique_members,
  CASE 
    WHEN NOW() > s.end_at THEN 'ENDED'
    WHEN NOW() >= s.start_at AND NOW() <= s.end_at THEN 'IN_PROGRESS'
    ELSE 'UPCOMING'
  END as shift_status
FROM shifts s
LEFT JOIN class_attendance ca ON s.id = ca.shift_id
GROUP BY s.id, s.branch_id, s.date, s.shift_code, s.start_at, s.end_at
WITH DATA;

-- Indexes for fast queries
CREATE INDEX idx_shift_attendance_branch_date 
  ON shift_attendance_summary (branch_id, date DESC);

CREATE INDEX idx_shift_attendance_status 
  ON shift_attendance_summary (shift_status);

COMMENT ON MATERIALIZED VIEW shift_attendance_summary IS 'Real-time summary of attendance per shift. Refresh after each check-in.';


-- 5b. Shift Measurement Completion Stats
-- Shows which members have been measured vs pending
DROP MATERIALIZED VIEW IF EXISTS shift_measurement_stats;

CREATE MATERIALIZED VIEW shift_measurement_stats AS
SELECT 
  s.id as shift_id,
  s.branch_id,
  s.date,
  s.shift_code,
  COUNT(DISTINCT ca.user_id) as total_attendees,
  COUNT(DISTINCT mbm.user_id) FILTER (WHERE mbm.shift_id = s.id AND mbm.measured_at IS NOT NULL) as measured_count,
  COUNT(DISTINCT ca.user_id) - COUNT(DISTINCT mbm.user_id) FILTER (WHERE mbm.shift_id = s.id AND mbm.measured_at IS NOT NULL) as pending_measurement,
  CASE 
    WHEN COUNT(DISTINCT ca.user_id) = 0 THEN 0
    ELSE ROUND(
      (COUNT(DISTINCT mbm.user_id) FILTER (WHERE mbm.shift_id = s.id AND mbm.measured_at IS NOT NULL)::numeric / 
       COUNT(DISTINCT ca.user_id)::numeric) * 100, 
      2
    )
  END as measurement_completion_pct
FROM shifts s
LEFT JOIN class_attendance ca ON s.id = ca.shift_id
LEFT JOIN member_body_measurements mbm ON ca.user_id = mbm.user_id AND mbm.shift_id = s.id
GROUP BY s.id, s.branch_id, s.date, s.shift_code
WITH DATA;

-- Indexes
CREATE INDEX idx_shift_measurement_branch_date 
  ON shift_measurement_stats (branch_id, date DESC);

COMMENT ON MATERIALIZED VIEW shift_measurement_stats IS 'Shows measurement completion stats per shift. Use for coach dashboards.';


-- 5c. Coach Shift Summary
-- Quick view of coach assignments and their status
DROP MATERIALIZED VIEW IF EXISTS coach_shift_summary;

CREATE MATERIALIZED VIEW coach_shift_summary AS
SELECT 
  s.id as shift_id,
  s.branch_id,
  s.date,
  s.shift_code,
  s.start_at,
  s.end_at,
  s.coach_capacity,
  COUNT(ta.trainer_user_id) FILTER (WHERE ta.unassigned_at IS NULL) as assigned_coaches,
  s.coach_capacity - COUNT(ta.trainer_user_id) FILTER (WHERE ta.unassigned_at IS NULL) as remaining_slots,
  CASE 
    WHEN NOW() > s.end_at THEN 'ENDED'
    WHEN NOW() >= s.start_at AND NOW() <= s.end_at THEN 'IN_PROGRESS'
    ELSE 'UPCOMING'
  END as shift_status
FROM shifts s
LEFT JOIN trainer_assignments ta ON s.id = ta.shift_id
GROUP BY s.id, s.branch_id, s.date, s.shift_code, s.start_at, s.end_at, s.coach_capacity
WITH DATA;

-- Indexes
CREATE INDEX idx_coach_shift_summary_branch_date 
  ON coach_shift_summary (branch_id, date DESC);

CREATE INDEX idx_coach_shift_summary_status 
  ON coach_shift_summary (shift_status);

COMMENT ON MATERIALIZED VIEW coach_shift_summary IS 'Coach availability per shift. Use before assigning coaches.';


-- 6. REFRESH FUNCTIONS
-- ==========================================
-- Helper function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY shift_attendance_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY shift_measurement_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY coach_shift_summary;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_dashboard_views() IS 'Refreshes all dashboard materialized views. Call after check-ins or measurements.';


-- 7. AUTO-REFRESH TRIGGERS
-- ==========================================
-- Automatically refresh views after key operations

-- 7a. After check-in
CREATE OR REPLACE FUNCTION trigger_refresh_after_checkin()
RETURNS TRIGGER AS $$
BEGIN
  -- Non-blocking refresh (CONCURRENTLY allows reads during refresh)
  PERFORM refresh_dashboard_views();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_after_checkin ON class_attendance;

CREATE TRIGGER trg_refresh_after_checkin
AFTER INSERT ON class_attendance
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_after_checkin();


-- 7b. After measurement
CREATE OR REPLACE FUNCTION trigger_refresh_after_measurement()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_dashboard_views();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_after_measurement ON member_body_measurements;

CREATE TRIGGER trg_refresh_after_measurement
AFTER INSERT OR UPDATE OF shift_id ON member_body_measurements
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_after_measurement();


-- 8. MEMBER SCHEDULE VIEW (OPTIMIZATION)
-- ==========================================
DROP MATERIALIZED VIEW IF EXISTS member_schedule_view;

CREATE MATERIALIZED VIEW member_schedule_view AS
SELECT 
  ca.user_id,
  u.full_name as member_name,
  s.id as shift_id,
  s.date,
  s.shift_code,
  s.start_at,
  s.end_at,
  s.branch_id,
  b.name as branch_name,
  STRING_AGG(DISTINCT p.full_name, ', ' ORDER BY p.full_name) as coaches,
  ca.attended_at,
  ca.status as attendance_status
FROM class_attendance ca
JOIN users u ON ca.user_id = u.id
JOIN shifts s ON ca.shift_id = s.id
JOIN branches b ON s.branch_id = b.id
LEFT JOIN trainer_assignments ta ON s.id = ta.shift_id AND ta.unassigned_at IS NULL
LEFT JOIN users p ON ta.trainer_user_id = p.id
GROUP BY ca.user_id, u.full_name, s.id, s.date, s.shift_code, s.start_at, s.end_at, s.branch_id, b.name, ca.attended_at, ca.status
WITH DATA;

-- Indexes
CREATE INDEX idx_member_schedule_user_date 
  ON member_schedule_view (user_id, date DESC);

CREATE INDEX idx_member_schedule_branch_date 
  ON member_schedule_view (branch_id, date DESC);

COMMENT ON MATERIALIZED VIEW member_schedule_view IS 'Pre-computed member schedule with coach info. Refresh daily or after schedule changes.';


-- 9. ENFORCE MEASUREMENT LOCKING
-- ==========================================
-- Trigger to prevent modification of locked measurements
CREATE OR REPLACE FUNCTION enforce_measurement_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_shift_end timestamptz;
BEGIN
  -- Only check if shift_id is set
  IF NEW.shift_id IS NOT NULL THEN
    SELECT s.end_at INTO v_shift_end
    FROM shifts s
    WHERE s.id = NEW.shift_id;
    
    -- If shift has ended and this is an update, block it
    IF v_shift_end IS NOT NULL AND NOW() > v_shift_end AND TG_OP = 'UPDATE' THEN
      RAISE EXCEPTION 'MEASUREMENT_LOCKED: Cannot modify measurements after shift ends (shift ended at %)', v_shift_end;
    END IF;
    
    -- Auto-lock if shift has ended
    IF v_shift_end IS NOT NULL AND NOW() > v_shift_end THEN
      NEW.is_locked := true;
      NEW.locked_at := NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_measurement_lock ON member_body_measurements;

CREATE TRIGGER trg_enforce_measurement_lock
BEFORE UPDATE ON member_body_measurements
FOR EACH ROW
EXECUTE FUNCTION enforce_measurement_lock();


-- 10. DOCUMENTATION COMMENTS
-- ==========================================
COMMENT ON TABLE course_enrollments IS 'Member course enrollments with price snapshot. Sessions auto-decrement via trigger on attendance insert.';
COMMENT ON TABLE class_attendance IS 'Attendance records. Inserting a record automatically decrements enrollment sessions_remaining via trigger.';
COMMENT ON TABLE shifts IS 'Training shifts. Auto-ends when end_at < NOW(). No manual button needed.';
COMMENT ON TABLE trainer_assignments IS 'Coach assignments. Max coaches enforced by CHECK constraint on shifts.coach_capacity.';
COMMENT ON MATERIALIZED VIEW shift_attendance_summary IS 'Real-time attendance dashboard. Auto-refreshes on check-in.';
COMMENT ON MATERIALIZED VIEW shift_measurement_stats IS 'Measurement completion tracking. Auto-refreshes on measurement insert/update.';
COMMENT ON MATERIALIZED VIEW coach_shift_summary IS 'Coach availability tracker. Query this before assigning coaches to shifts.';


-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Run these to verify the migration worked:

-- Check new column exists
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'course_enrollments' AND column_name = 'session_price_at_registration';

-- Check constraint exists
-- SELECT conname, contype 
-- FROM pg_constraint 
-- WHERE conrelid = 'shifts'::regclass AND contype = 'c';

-- Check triggers exist
-- SELECT trigger_name, event_manipulation, action_statement 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public' AND trigger_name LIKE 'trg_%';

-- Check materialized views exist
-- SELECT matviewname 
-- FROM pg_matviews 
-- WHERE schemaname = 'public';

-- Test auto-decrement (uncomment to test):
-- INSERT INTO class_attendance (id, enrollment_id, user_id, shift_id, branch_id, attended_at, check_in_time, status, created_by)
-- VALUES ('test-attendance-1', 'your-enrollment-id', 'your-user-id', 'your-shift-id', 'your-branch-id', NOW(), NOW(), 'PRESENT', 'your-user-id');
-- SELECT sessions_remaining, sessions_attended FROM course_enrollments WHERE id = 'your-enrollment-id';
