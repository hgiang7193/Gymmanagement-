-- ==========================================
-- MIGRATION 005: MISSING FEATURES
-- Adds: override check-in, promotions, reviews,
--       system_config, refunds, profile phone,
--       support requests, catalog mgmt fields
-- ==========================================

-- ==========================================
-- 1. CLASS_ATTENDANCE: OVERRIDE / PROXY FLAGS
-- ==========================================
ALTER TABLE class_attendance
  ADD COLUMN IF NOT EXISTS proxy_checkin   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS override_reason text    NULL,
  ADD COLUMN IF NOT EXISTS override_actor  text    NULL REFERENCES users(id);

COMMENT ON COLUMN class_attendance.proxy_checkin   IS 'True when checked in by manager or coach on behalf of member';
COMMENT ON COLUMN class_attendance.override_reason IS 'Required when proxy_checkin is true';
COMMENT ON COLUMN class_attendance.override_actor  IS 'User ID of manager/coach who performed proxy check-in';

-- ==========================================
-- 2. PROFILES: PHONE NUMBER
-- ==========================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_number text NULL,
  ADD COLUMN IF NOT EXISTS avatar_url   text NULL;

-- ==========================================
-- 3. PROMOTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS promotions (
  id            text PRIMARY KEY,
  code          text UNIQUE NOT NULL,
  name          text NOT NULL,
  type          text NOT NULL,           -- 'percent' | 'fixed_amount'
  value         bigint NOT NULL,         -- percent (0-100) or fixed VND
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  min_order_amount bigint NOT NULL DEFAULT 0,
  max_uses      integer NULL,            -- NULL = unlimited
  uses_count    integer NOT NULL DEFAULT 0,
  stackable     boolean NOT NULL DEFAULT false,
  scope         text NOT NULL DEFAULT 'branch', -- 'branch' | 'global'
  branch_id     text NULL REFERENCES branches(id),
  is_active     boolean NOT NULL DEFAULT false,
  created_by    text NOT NULL REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotions_branch_active
  ON promotions (branch_id, is_active, ends_at);

CREATE INDEX IF NOT EXISTS idx_promotions_code_active
  ON promotions (code, is_active);

-- ==========================================
-- 4. INVOICE: DISCOUNT SNAPSHOT + CANCEL/REFUND
-- ==========================================
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS discount_amount bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promotion_id    text   NULL REFERENCES promotions(id),
  ADD COLUMN IF NOT EXISTS cancelled_at    timestamptz NULL,
  ADD COLUMN IF NOT EXISTS cancel_reason   text   NULL,
  ADD COLUMN IF NOT EXISTS cancelled_by    text   NULL REFERENCES users(id);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id            text PRIMARY KEY,
  invoice_id    text NOT NULL REFERENCES invoices(id),
  amount        bigint NOT NULL,
  reason        text NOT NULL,
  status        text NOT NULL DEFAULT 'pending', -- pending | completed | rejected
  processed_by  text NOT NULL REFERENCES users(id),
  processed_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refunds_invoice
  ON refunds (invoice_id);

-- ==========================================
-- 5. REVIEWS / RATINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS reviews (
  id             text PRIMARY KEY,
  reviewer_id    text NOT NULL REFERENCES users(id),
  target_type    text NOT NULL, -- 'shift' | 'coach' | 'equipment' | 'exercise'
  target_id      text NOT NULL,
  rating         integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        text NULL,
  tags           jsonb NOT NULL DEFAULT '[]'::jsonb,
  status         text NOT NULL DEFAULT 'visible', -- 'visible' | 'flagged' | 'hidden'
  branch_id      text NULL REFERENCES branches(id),
  attendance_id  text NULL REFERENCES class_attendance(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_review_per_shift
  ON reviews (reviewer_id, target_type, target_id)
  WHERE target_type = 'shift';

CREATE INDEX IF NOT EXISTS idx_reviews_target
  ON reviews (target_type, target_id, status);

CREATE INDEX IF NOT EXISTS idx_reviews_branch_status
  ON reviews (branch_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS review_moderation_logs (
  id           text PRIMARY KEY,
  review_id    text NOT NULL REFERENCES reviews(id),
  actor_id     text NOT NULL REFERENCES users(id),
  from_status  text NOT NULL,
  to_status    text NOT NULL,
  reason       text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- 6. SUPPORT REQUESTS (UC-MEMBER-07)
-- ==========================================
CREATE TABLE IF NOT EXISTS support_requests (
  id          text PRIMARY KEY,
  member_id   text NOT NULL REFERENCES users(id),
  shift_id    text NULL REFERENCES shifts(id),
  branch_id   text NOT NULL REFERENCES branches(id),
  reason      text NULL,
  status      text NOT NULL DEFAULT 'open', -- open | resolved
  resolved_by text NULL REFERENCES users(id),
  resolved_at timestamptz NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_requests_branch_status
  ON support_requests (branch_id, status, created_at DESC);

-- ==========================================
-- 7. SYSTEM CONFIG (UC-ADMIN-08)
-- ==========================================
CREATE TABLE IF NOT EXISTS system_config (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  description text NULL,
  updated_by  text NULL REFERENCES users(id),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO system_config (key, value, description) VALUES
  ('checkin_window_minutes',  '30',  'Minutes before shift start that check-in window opens'),
  ('override_grace_period_minutes', '60', 'Minutes after shift end that manager can override check-in'),
  ('review_max_per_day',      '5',   'Max reviews a member can submit per day per target type'),
  ('trial_slot_capacity',     '10',  'Max trial bookings per slot')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 8. MEMBERSHIP_PLANS / CATALOG MANAGEMENT
-- ==========================================
ALTER TABLE membership_plans
  ADD COLUMN IF NOT EXISTS description   text NULL,
  ADD COLUMN IF NOT EXISTS plan_type     text NOT NULL DEFAULT 'membership', -- 'membership' | 'course' | 'pt' | 'fee'
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz NOT NULL DEFAULT now();

ALTER TABLE course_packages
  ADD COLUMN IF NOT EXISTS plan_type  text NOT NULL DEFAULT 'course',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ==========================================
-- 9. HEALTH PROFILE: MISSING FIELDS
-- ==========================================
ALTER TABLE member_health_profiles
  ADD COLUMN IF NOT EXISTS target_weight_kg   numeric(5,2) NULL,
  ADD COLUMN IF NOT EXISTS food_allergies     text NULL,
  ADD COLUMN IF NOT EXISTS activity_level     text NULL; -- sedentary | lightly_active | moderately_active | very_active

-- ==========================================
-- 10. TRIAL BOOKINGS: FUNNEL TRACKING STATUS
-- ==========================================
-- Add funnel stages that match the use case spec
-- Current status: BOOKED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
-- Spec status:    registered, confirmed, attended, no_show, converted
-- No schema change needed - status is text, values already cover the cases
-- Add an index for funnel analytics
CREATE INDEX IF NOT EXISTS idx_trial_bookings_status_branch
  ON trial_bookings (branch_id, status, scheduled_at DESC);
