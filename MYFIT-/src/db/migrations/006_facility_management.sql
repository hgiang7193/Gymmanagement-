-- ==========================================
-- MIGRATION 006: FACILITY MANAGEMENT
-- Adds: areas, assets, maintenance_tickets
-- ==========================================

CREATE TABLE IF NOT EXISTS areas (
  id          text PRIMARY KEY,
  branch_id   text NOT NULL REFERENCES branches(id),
  name        text NOT NULL,
  description text NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_by  text NOT NULL REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_areas_branch ON areas (branch_id, is_active);

CREATE TABLE IF NOT EXISTS assets (
  id             text PRIMARY KEY,
  branch_id      text NOT NULL REFERENCES branches(id),
  area_id        text NULL REFERENCES areas(id),
  asset_code     text UNIQUE NOT NULL,
  name           text NOT NULL,
  asset_type     text NOT NULL,
  purchase_date  date NULL,
  purchase_price bigint NULL,
  status         text NOT NULL DEFAULT 'ACTIVE',
  notes          text NULL,
  created_by     text NOT NULL REFERENCES users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_branch_status ON assets (branch_id, status);
CREATE INDEX IF NOT EXISTS idx_assets_area ON assets (area_id);

CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id           text PRIMARY KEY,
  asset_id     text NOT NULL REFERENCES assets(id),
  branch_id    text NOT NULL REFERENCES branches(id),
  title        text NOT NULL,
  description  text NULL,
  status       text NOT NULL DEFAULT 'OPEN',
  reported_by  text NOT NULL REFERENCES users(id),
  assigned_to  text NULL REFERENCES users(id),
  resolved_at  timestamptz NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_branch_status ON maintenance_tickets (branch_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_asset ON maintenance_tickets (asset_id, status);
