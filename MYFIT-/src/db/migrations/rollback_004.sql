-- ==========================================
-- ROLLBACK Migration 004
-- ==========================================
-- Use this ONLY if you need to undo migration 004
-- This will remove all triggers, views, and columns added by migration 004
-- ==========================================

BEGIN;

-- 1. Drop triggers
DROP TRIGGER IF EXISTS trg_after_class_attendance_insert ON class_attendance;
DROP TRIGGER IF EXISTS trg_prevent_duplicate_checkin ON class_attendance;
DROP TRIGGER IF EXISTS trg_refresh_after_checkin ON class_attendance;
DROP TRIGGER IF EXISTS trg_refresh_after_measurement ON member_body_measurements;
DROP TRIGGER IF EXISTS trg_enforce_measurement_lock ON member_body_measurements;

-- 2. Drop functions
DROP FUNCTION IF EXISTS update_enrollment_after_checkin();
DROP FUNCTION IF EXISTS prevent_duplicate_checkin();
DROP FUNCTION IF EXISTS trigger_refresh_after_checkin();
DROP FUNCTION IF EXISTS trigger_refresh_after_measurement();
DROP FUNCTION IF EXISTS enforce_measurement_lock();
DROP FUNCTION IF EXISTS refresh_dashboard_views();

-- 3. Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS shift_attendance_summary;
DROP MATERIALIZED VIEW IF EXISTS shift_measurement_stats;
DROP MATERIALIZED VIEW IF EXISTS coach_shift_summary;
DROP MATERIALIZED VIEW IF EXISTS member_schedule_view;

-- 4. Remove column from course_enrollments
ALTER TABLE course_enrollments DROP COLUMN IF EXISTS session_price_at_registration;

-- 5. Remove constraint from shifts
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS chk_coach_capacity_range;

COMMIT;

-- Verify rollback
SELECT 'Rollback complete' as status;

-- Check triggers are gone
SELECT COUNT(*) as remaining_triggers
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trg_%';
-- Expected: 0

-- Check materialized views are gone
SELECT COUNT(*) as remaining_views
FROM pg_matviews 
WHERE schemaname = 'public';
-- Expected: 0 (or only views from other migrations)
