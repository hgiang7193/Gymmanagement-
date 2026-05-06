-- ==========================================
-- MIGRATION 007: BRANCH CONTACT + MAINTENANCE SCHEDULES
-- UC-GUEST-05 (zalo contact) + UC-FAC-07 (lịch bảo trì định kỳ)
-- ==========================================

-- 1. BRANCH CONTACT FIELDS
ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS zalo_link  text NULL,
  ADD COLUMN IF NOT EXISTS zalo_phone text NULL,
  ADD COLUMN IF NOT EXISTS contact_email text NULL;

COMMENT ON COLUMN branches.zalo_link  IS 'Zalo OA / direct chat link (e.g. https://zalo.me/0xxxxxxxxx)';
COMMENT ON COLUMN branches.zalo_phone IS 'Phone number used for Zalo redirect when zalo_link is null';

-- 2. MAINTENANCE SCHEDULES (UC-FAC-07)
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id              text PRIMARY KEY,
  branch_id       text NOT NULL REFERENCES branches(id),
  asset_id        text NULL REFERENCES assets(id),
  title           text NOT NULL,
  description     text NULL,
  frequency       text NOT NULL,        -- 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'once'
  interval_days   integer NOT NULL,     -- chu kỳ tính theo ngày
  next_due_at     timestamptz NOT NULL,
  last_run_at     timestamptz NULL,
  is_active       boolean NOT NULL DEFAULT true,
  created_by      text NOT NULL REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_branch_due
  ON maintenance_schedules (branch_id, is_active, next_due_at);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_asset
  ON maintenance_schedules (asset_id) WHERE asset_id IS NOT NULL;

-- 3. Lịch sử chạy maintenance (mỗi lần due tạo 1 ticket)
CREATE TABLE IF NOT EXISTS maintenance_schedule_runs (
  id           text PRIMARY KEY,
  schedule_id  text NOT NULL REFERENCES maintenance_schedules(id),
  ticket_id    text NULL REFERENCES maintenance_tickets(id),
  triggered_at timestamptz NOT NULL DEFAULT now(),
  triggered_by text NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_runs_schedule
  ON maintenance_schedule_runs (schedule_id, triggered_at DESC);
