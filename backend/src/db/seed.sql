-- =============================================================================
-- MYFIT Seed Data — Core MVP Tables
-- Timeline: 2026-05-09 08:00 → 2026-05-11 21:00 (UTC+7)
-- Structure: 1 Org · 2 Branches · 1 Admin · 2 Managers · 4 Coaches · 20 Members
-- =============================================================================

BEGIN;

-- Reset core MVP tables (cascades to all FK-dependent tables)
TRUNCATE TABLE
  payments, invoices, pt_sessions, member_check_ins,
  member_body_measurements, member_weight_logs, member_health_profiles,
  ai_meal_generation_logs, meal_consumption_logs, meal_items, meals,
  daily_meal_plans, recipe_ingredients, recipes, member_nutrition_goals,
  trial_status_history, trial_bookings,
  subscription_status_history, subscriptions,
  staff_profiles, branch_manager_assignments, user_role_assignments,
  password_reset_tokens, refresh_sessions, profiles,
  security_events, audit_logs,
  users, pt_packages, membership_plans, branches, organizations, roles
RESTART IDENTITY CASCADE;

-- =============================================================================
-- 1. ROLES
-- =============================================================================
INSERT INTO roles (id, code, name) VALUES
  ('11111111-1111-4111-a111-111111111101', 'ADMIN',   'Quản trị hệ thống'),
  ('11111111-1111-4111-a111-111111111102', 'MANAGER', 'Quản lý chi nhánh'),
  ('11111111-1111-4111-a111-111111111103', 'COACH',   'Huấn luyện viên'),
  ('11111111-1111-4111-a111-111111111104', 'MEMBER',  'Hội viên');

-- =============================================================================
-- 2. ORGANIZATIONS
-- =============================================================================
INSERT INTO organizations (id, name, tax_id, created_at, updated_at) VALUES
  ('22222222-2222-4222-a222-222222222201', 'MYFIT Corp', '0312456789',
   '2025-06-01 08:00:00+07', '2025-06-01 08:00:00+07');

-- =============================================================================
-- 3. BRANCHES
-- =============================================================================
INSERT INTO branches (id, organization_id, code, name, address, phone_number, status, created_at, updated_at) VALUES
  ('33333333-3333-4333-a333-333333333301', '22222222-2222-4222-a222-222222222201',
   'HN-01',  'MYFIT Hà Nội', '12 Trần Duy Hưng, Cầu Giấy, Hà Nội',
   '02437123456', 'ACTIVE', '2025-06-15 08:00:00+07', '2025-06-15 08:00:00+07'),
  ('33333333-3333-4333-a333-333333333302', '22222222-2222-4222-a222-222222222201',
   'HCM-01', 'MYFIT HCM',    '88 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh',
   '02873456789', 'ACTIVE', '2025-06-15 08:00:00+07', '2025-06-15 08:00:00+07');

-- =============================================================================
-- 4. MEMBERSHIP PLANS
-- =============================================================================
INSERT INTO membership_plans (id, code, name, price, duration_days, total_sessions, is_active, created_at) VALUES
  ('44444444-4444-4444-a444-444444444401', 'BASIC-12',      'Gói Cơ Bản 12 buổi',     1200000, 30, 12, true, '2025-06-01 08:00:00+07'),
  ('44444444-4444-4444-a444-444444444402', 'PRO-36',        'Gói Nâng Cao 36 buổi',   3000000, 90, 36, true, '2025-06-01 08:00:00+07'),
  ('44444444-4444-4444-a444-444444444403', 'PT-STARTER-10', 'Gói PT Khởi Đầu 10 buổi', 2500000, 30, 10, true, '2025-06-01 08:00:00+07');

-- =============================================================================
-- 5. PT PACKAGES
-- =============================================================================
INSERT INTO pt_packages (id, code, name, price, total_sessions, is_active, created_at) VALUES
  ('55555555-5555-4555-a555-555555555501', 'PT-BASIC-10',   'PT Cơ Bản 10 Buổi',   1500000, 10, true, '2025-06-01 08:00:00+07'),
  ('55555555-5555-4555-a555-555555555502', 'PT-PREMIUM-20', 'PT Nâng Cao 20 Buổi', 2800000, 20, true, '2025-06-01 08:00:00+07');

-- =============================================================================
-- 6. USERS  (1 admin + 2 mgr + 4 coach + 20 members)
-- Passwords (argon2id):
--   admin@myfit.vn        → Admin@2026!
--   mgr.hn/hcm@myfit.vn   → Manager@2026!
--   coachXX@myfit.vn      → Coach@2026!
--   memberXX@myfit.vn     → Member@2026!
-- =============================================================================
-- argon2 hashes (pre-computed, each role shares same hash since argon2.verify uses embedded salt)
-- admin_hash   : $argon2id$v=19$m=65536,t=3,p=4$7B5ZU66AACzniz+5J+KMhw$CwOzO9ZNJfsvyhzhbFwwVtqNRLdSFFLDeuLgC/NHG6s
-- manager_hash : $argon2id$v=19$m=65536,t=3,p=4$QqGdBv2LBFFIt1b7UWzu9Q$epqCRl6pSSIgYsMloC3ireVE2TN8vZDrbypzx2xcAgY
-- coach_hash   : $argon2id$v=19$m=65536,t=3,p=4$SbxGKPD6GO8V1UrVW9rZIw$o3SKLCaXTEZB/KVN/UVqbn2HZIO6WmfhRAu4Gk3tO24
-- member_hash  : $argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8
INSERT INTO users (id, email, password_hash, status, email_verified_at, created_at, updated_at) VALUES
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa001', 'admin@myfit.vn',         '$argon2id$v=19$m=65536,t=3,p=4$7B5ZU66AACzniz+5J+KMhw$CwOzO9ZNJfsvyhzhbFwwVtqNRLdSFFLDeuLgC/NHG6s',    'ACTIVE', '2025-06-01 08:00:00+07', '2025-06-01 08:00:00+07', '2025-06-01 08:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', 'mgr.hn@myfit.vn',        '$argon2id$v=19$m=65536,t=3,p=4$QqGdBv2LBFFIt1b7UWzu9Q$epqCRl6pSSIgYsMloC3ireVE2TN8vZDrbypzx2xcAgY',   'ACTIVE', '2025-08-01 08:00:00+07', '2025-08-01 08:00:00+07', '2025-08-01 08:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', 'mgr.hcm@myfit.vn',       '$argon2id$v=19$m=65536,t=3,p=4$QqGdBv2LBFFIt1b7UWzu9Q$epqCRl6pSSIgYsMloC3ireVE2TN8vZDrbypzx2xcAgY',   'ACTIVE', '2025-08-01 08:00:00+07', '2025-08-01 08:00:00+07', '2025-08-01 08:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004', 'coach01.hn@myfit.vn',    '$argon2id$v=19$m=65536,t=3,p=4$SbxGKPD6GO8V1UrVW9rZIw$o3SKLCaXTEZB/KVN/UVqbn2HZIO6WmfhRAu4Gk3tO24',  'ACTIVE', '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa005', 'coach02.hn@myfit.vn',    '$argon2id$v=19$m=65536,t=3,p=4$SbxGKPD6GO8V1UrVW9rZIw$o3SKLCaXTEZB/KVN/UVqbn2HZIO6WmfhRAu4Gk3tO24',  'ACTIVE', '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006', 'coach01.hcm@myfit.vn',   '$argon2id$v=19$m=65536,t=3,p=4$SbxGKPD6GO8V1UrVW9rZIw$o3SKLCaXTEZB/KVN/UVqbn2HZIO6WmfhRAu4Gk3tO24',  'ACTIVE', '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa007', 'coach02.hcm@myfit.vn',   '$argon2id$v=19$m=65536,t=3,p=4$SbxGKPD6GO8V1UrVW9rZIw$o3SKLCaXTEZB/KVN/UVqbn2HZIO6WmfhRAu4Gk3tO24',  'ACTIVE', '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008', 'member01.hn@myfit.vn',   '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 09:00:00+07', '2026-05-09 09:00:00+07', '2026-05-09 09:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa009', 'member02.hn@myfit.vn',   '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa010', 'member03.hn@myfit.vn',   '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 10:00:00+07', '2026-05-09 10:00:00+07', '2026-05-09 10:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa011', 'member04.hn@myfit.vn',   '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 10:30:00+07', '2026-05-09 10:30:00+07', '2026-05-09 10:30:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa012', 'member05.hn@myfit.vn',   '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 11:00:00+07', '2026-05-09 11:00:00+07', '2026-05-09 11:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa013', 'member06.hn@myfit.vn',   '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 14:00:00+07', '2026-05-09 14:00:00+07', '2026-05-09 14:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa014', 'member07.hn@myfit.vn',   '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa015', 'member08.hn@myfit.vn',   '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-10 09:00:00+07', '2026-05-10 09:00:00+07', '2026-05-10 09:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa016', 'member09.hn@myfit.vn',   '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-10 09:30:00+07', '2026-05-10 09:30:00+07', '2026-05-10 09:30:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa017', 'member10.hn@myfit.vn',   '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-10 10:00:00+07', '2026-05-10 10:00:00+07', '2026-05-10 10:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa018', 'member01.hcm@myfit.vn',  '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 09:00:00+07', '2026-05-09 09:00:00+07', '2026-05-09 09:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa019', 'member02.hcm@myfit.vn',  '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa020', 'member03.hcm@myfit.vn',  '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 10:00:00+07', '2026-05-09 10:00:00+07', '2026-05-09 10:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa021', 'member04.hcm@myfit.vn',  '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 10:30:00+07', '2026-05-09 10:30:00+07', '2026-05-09 10:30:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa022', 'member05.hcm@myfit.vn',  '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 11:00:00+07', '2026-05-09 11:00:00+07', '2026-05-09 11:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa023', 'member06.hcm@myfit.vn',  '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 14:00:00+07', '2026-05-09 14:00:00+07', '2026-05-09 14:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa024', 'member07.hcm@myfit.vn',  '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa025', 'member08.hcm@myfit.vn',  '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-10 09:00:00+07', '2026-05-10 09:00:00+07', '2026-05-10 09:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa026', 'member09.hcm@myfit.vn',  '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-10 09:30:00+07', '2026-05-10 09:30:00+07', '2026-05-10 09:30:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa027', 'member10.hcm@myfit.vn',  '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8',  'ACTIVE', '2026-05-10 10:00:00+07', '2026-05-10 10:00:00+07', '2026-05-10 10:00:00+07');

-- =============================================================================
-- 7. PROFILES (1 per user)
-- =============================================================================
INSERT INTO profiles (id, user_id, full_name, created_at, updated_at) VALUES
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb001', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa001', 'Nguyễn Quốc Khánh',  '2025-06-01 08:00:00+07', '2025-06-01 08:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb002', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', 'Trần Minh Đức',      '2025-08-01 08:00:00+07', '2025-08-01 08:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb003', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', 'Lê Thị Hoa',         '2025-08-01 08:00:00+07', '2025-08-01 08:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb004', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004', 'Phạm Văn Hùng',      '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb005', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa005', 'Nguyễn Thị Lan',     '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb006', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006', 'Đinh Văn Mạnh',      '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb007', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa007', 'Bùi Thị Nga',        '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb008', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008', 'Nguyễn Văn An',      '2026-05-09 09:00:00+07', '2026-05-09 09:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb009', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa009', 'Trần Thị Bích',      '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb010', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa010', 'Phạm Minh Cường',    '2026-05-09 10:00:00+07', '2026-05-09 10:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb011', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa011', 'Lê Thị Doan',        '2026-05-09 10:30:00+07', '2026-05-09 10:30:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb012', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa012', 'Hoàng Văn Đức',      '2026-05-09 11:00:00+07', '2026-05-09 11:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb013', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa013', 'Vũ Thị Phượng',      '2026-05-09 14:00:00+07', '2026-05-09 14:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb014', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa014', 'Đỗ Minh Quân',       '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb015', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa015', 'Ngô Thị Hương',      '2026-05-10 09:00:00+07', '2026-05-10 09:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb016', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa016', 'Dương Văn Hiệp',     '2026-05-10 09:30:00+07', '2026-05-10 09:30:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb017', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa017', 'Trịnh Thị Mai',      '2026-05-10 10:00:00+07', '2026-05-10 10:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb018', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa018', 'Phan Văn Bình',      '2026-05-09 09:00:00+07', '2026-05-09 09:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb019', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa019', 'Đặng Thị Cẩm',       '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb020', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa020', 'Huỳnh Minh Dũng',    '2026-05-09 10:00:00+07', '2026-05-09 10:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb021', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa021', 'Võ Thị Giang',       '2026-05-09 10:30:00+07', '2026-05-09 10:30:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb022', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa022', 'Lý Văn Hải',         '2026-05-09 11:00:00+07', '2026-05-09 11:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb023', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa023', 'Nguyễn Thị Kim',     '2026-05-09 14:00:00+07', '2026-05-09 14:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb024', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa024', 'Trần Văn Long',      '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb025', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa025', 'Lê Thị Mỹ',          '2026-05-10 09:00:00+07', '2026-05-10 09:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb026', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa026', 'Phạm Văn Nghĩa',     '2026-05-10 09:30:00+07', '2026-05-10 09:30:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb027', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa027', 'Bùi Thị Oanh',       '2026-05-10 10:00:00+07', '2026-05-10 10:00:00+07');

-- =============================================================================
-- 8. USER ROLE ASSIGNMENTS
-- =============================================================================
INSERT INTO user_role_assignments (id, user_id, role_id, branch_id, assigned_at) VALUES
  -- Admin (no branch)
  ('cccccccc-cccc-4ccc-accc-ccccccccc001', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa001', '11111111-1111-4111-a111-111111111101', NULL,                                     '2025-06-01 08:00:00+07'),
  -- Managers
  ('cccccccc-cccc-4ccc-accc-ccccccccc002', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '11111111-1111-4111-a111-111111111102', '33333333-3333-4333-a333-333333333301', '2025-08-01 08:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc003', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '11111111-1111-4111-a111-111111111102', '33333333-3333-4333-a333-333333333302', '2025-08-01 08:00:00+07'),
  -- Coaches
  ('cccccccc-cccc-4ccc-accc-ccccccccc004', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004', '11111111-1111-4111-a111-111111111103', '33333333-3333-4333-a333-333333333301', '2025-09-01 08:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc005', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa005', '11111111-1111-4111-a111-111111111103', '33333333-3333-4333-a333-333333333301', '2025-09-01 08:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc006', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006', '11111111-1111-4111-a111-111111111103', '33333333-3333-4333-a333-333333333302', '2025-09-01 08:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc007', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa007', '11111111-1111-4111-a111-111111111103', '33333333-3333-4333-a333-333333333302', '2025-09-01 08:00:00+07'),
  -- Members HN
  ('cccccccc-cccc-4ccc-accc-ccccccccc008', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333301', '2026-05-09 09:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc009', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa009', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333301', '2026-05-09 09:30:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc010', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa010', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333301', '2026-05-09 10:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc011', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa011', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333301', '2026-05-09 10:30:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc012', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa012', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333301', '2026-05-09 11:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc013', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa013', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333301', '2026-05-09 14:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc014', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa014', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333301', '2026-05-09 14:30:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc015', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa015', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333301', '2026-05-10 09:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc016', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa016', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333301', '2026-05-10 09:30:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc017', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa017', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333301', '2026-05-10 10:00:00+07'),
  -- Members HCM
  ('cccccccc-cccc-4ccc-accc-ccccccccc018', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa018', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333302', '2026-05-09 09:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc019', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa019', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333302', '2026-05-09 09:30:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc020', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa020', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333302', '2026-05-09 10:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc021', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa021', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333302', '2026-05-09 10:30:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc022', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa022', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333302', '2026-05-09 11:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc023', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa023', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333302', '2026-05-09 14:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc024', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa024', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333302', '2026-05-09 14:30:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc025', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa025', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333302', '2026-05-10 09:00:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc026', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa026', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333302', '2026-05-10 09:30:00+07'),
  ('cccccccc-cccc-4ccc-accc-ccccccccc027', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa027', '11111111-1111-4111-a111-111111111104', '33333333-3333-4333-a333-333333333302', '2026-05-10 10:00:00+07');

-- =============================================================================
-- 9. BRANCH MANAGER ASSIGNMENTS
-- =============================================================================
INSERT INTO branch_manager_assignments (id, branch_id, manager_user_id, active_from, active_to, created_at) VALUES
  ('eeeeeeee-eeee-4eee-aeee-eeeeeeee0001', '33333333-3333-4333-a333-333333333301', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2025-08-01 08:00:00+07', NULL, '2025-08-01 08:00:00+07'),
  ('eeeeeeee-eeee-4eee-aeee-eeeeeeee0002', '33333333-3333-4333-a333-333333333302', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2025-08-01 08:00:00+07', NULL, '2025-08-01 08:00:00+07');

-- =============================================================================
-- 10. STAFF PROFILES (managers + coaches)
-- =============================================================================
INSERT INTO staff_profiles (id, user_id, employee_code, job_title, primary_branch_id, hire_date, status, created_at, updated_at) VALUES
  ('dddddddd-dddd-4ddd-addd-dddddddd0001', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', 'MGR-HN-001',  'Branch Manager',   '33333333-3333-4333-a333-333333333301', '2025-08-01', 'ACTIVE', '2025-08-01 08:00:00+07', '2025-08-01 08:00:00+07'),
  ('dddddddd-dddd-4ddd-addd-dddddddd0002', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', 'MGR-HCM-001', 'Branch Manager',   '33333333-3333-4333-a333-333333333302', '2025-08-01', 'ACTIVE', '2025-08-01 08:00:00+07', '2025-08-01 08:00:00+07'),
  ('dddddddd-dddd-4ddd-addd-dddddddd0003', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004', 'CCH-HN-001',  'Personal Trainer', '33333333-3333-4333-a333-333333333301', '2025-09-01', 'ACTIVE', '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07'),
  ('dddddddd-dddd-4ddd-addd-dddddddd0004', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa005', 'CCH-HN-002',  'Personal Trainer', '33333333-3333-4333-a333-333333333301', '2025-09-01', 'ACTIVE', '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07'),
  ('dddddddd-dddd-4ddd-addd-dddddddd0005', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006', 'CCH-HCM-001', 'Personal Trainer', '33333333-3333-4333-a333-333333333302', '2025-09-01', 'ACTIVE', '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07'),
  ('dddddddd-dddd-4ddd-addd-dddddddd0006', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa007', 'CCH-HCM-002', 'Personal Trainer', '33333333-3333-4333-a333-333333333302', '2025-09-01', 'ACTIVE', '2025-09-01 08:00:00+07', '2025-09-01 08:00:00+07');

-- =============================================================================
-- 11. SUBSCRIPTIONS (20 — one per member)
-- HN 01-05 BASIC, 06-10 PRO; HCM 01-05 BASIC, 06-10 PRO
-- =============================================================================
INSERT INTO subscriptions (id, user_id, membership_plan_id, home_branch_id, status, started_at, expires_at, total_sessions, sessions_used, sessions_remaining, activated_by, activated_at) VALUES
  ('ffffffff-ffff-4fff-afff-ffffffff0001', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008', '44444444-4444-4444-a444-444444444401', '33333333-3333-4333-a333-333333333301', 'ACTIVE', '2026-05-09 09:00:00+07', '2026-02-14 09:00:00+07', 12, 2, 10, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 09:00:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0002', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa009', '44444444-4444-4444-a444-444444444401', '33333333-3333-4333-a333-333333333301', 'ACTIVE', '2026-05-09 09:30:00+07', '2026-02-14 09:30:00+07', 12, 2, 10, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 09:30:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0003', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa010', '44444444-4444-4444-a444-444444444401', '33333333-3333-4333-a333-333333333301', 'ACTIVE', '2026-05-09 10:00:00+07', '2026-02-14 10:00:00+07', 12, 1, 11, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 10:00:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0004', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa011', '44444444-4444-4444-a444-444444444401', '33333333-3333-4333-a333-333333333301', 'ACTIVE', '2026-05-09 10:30:00+07', '2026-02-14 10:30:00+07', 12, 2, 10, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 10:30:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0005', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa012', '44444444-4444-4444-a444-444444444401', '33333333-3333-4333-a333-333333333301', 'ACTIVE', '2026-05-09 11:00:00+07', '2026-02-14 11:00:00+07', 12, 1, 11, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 11:00:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0006', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa013', '44444444-4444-4444-a444-444444444402', '33333333-3333-4333-a333-333333333301', 'ACTIVE', '2026-05-09 14:00:00+07', '2026-04-15 14:00:00+07', 36, 2, 34, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 14:00:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0007', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa014', '44444444-4444-4444-a444-444444444402', '33333333-3333-4333-a333-333333333301', 'ACTIVE', '2026-05-09 14:30:00+07', '2026-04-15 14:30:00+07', 36, 1, 35, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 14:30:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0008', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa015', '44444444-4444-4444-a444-444444444402', '33333333-3333-4333-a333-333333333301', 'ACTIVE', '2026-05-10 09:00:00+07', '2026-04-16 09:00:00+07', 36, 2, 34, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-10 09:00:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0009', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa016', '44444444-4444-4444-a444-444444444402', '33333333-3333-4333-a333-333333333301', 'ACTIVE', '2026-05-10 09:30:00+07', '2026-04-16 09:30:00+07', 36, 1, 35, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-10 09:30:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0010', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa017', '44444444-4444-4444-a444-444444444402', '33333333-3333-4333-a333-333333333301', 'ACTIVE', '2026-05-10 10:00:00+07', '2026-04-16 10:00:00+07', 36, 2, 34, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-10 10:00:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0011', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa018', '44444444-4444-4444-a444-444444444401', '33333333-3333-4333-a333-333333333302', 'ACTIVE', '2026-05-09 09:00:00+07', '2026-02-14 09:00:00+07', 12, 2, 10, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-09 09:00:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0012', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa019', '44444444-4444-4444-a444-444444444401', '33333333-3333-4333-a333-333333333302', 'ACTIVE', '2026-05-09 09:30:00+07', '2026-02-14 09:30:00+07', 12, 1, 11, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-09 09:30:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0013', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa020', '44444444-4444-4444-a444-444444444401', '33333333-3333-4333-a333-333333333302', 'ACTIVE', '2026-05-09 10:00:00+07', '2026-02-14 10:00:00+07', 12, 2, 10, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-09 10:00:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0014', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa021', '44444444-4444-4444-a444-444444444401', '33333333-3333-4333-a333-333333333302', 'ACTIVE', '2026-05-09 10:30:00+07', '2026-02-14 10:30:00+07', 12, 1, 11, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-09 10:30:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0015', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa022', '44444444-4444-4444-a444-444444444401', '33333333-3333-4333-a333-333333333302', 'ACTIVE', '2026-05-09 11:00:00+07', '2026-02-14 11:00:00+07', 12, 2, 10, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-09 11:00:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0016', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa023', '44444444-4444-4444-a444-444444444402', '33333333-3333-4333-a333-333333333302', 'ACTIVE', '2026-05-09 14:00:00+07', '2026-04-15 14:00:00+07', 36, 1, 35, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-09 14:00:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0017', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa024', '44444444-4444-4444-a444-444444444402', '33333333-3333-4333-a333-333333333302', 'ACTIVE', '2026-05-09 14:30:00+07', '2026-04-15 14:30:00+07', 36, 2, 34, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-09 14:30:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0018', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa025', '44444444-4444-4444-a444-444444444402', '33333333-3333-4333-a333-333333333302', 'ACTIVE', '2026-05-10 09:00:00+07', '2026-04-16 09:00:00+07', 36, 1, 35, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-10 09:00:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0019', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa026', '44444444-4444-4444-a444-444444444402', '33333333-3333-4333-a333-333333333302', 'ACTIVE', '2026-05-10 09:30:00+07', '2026-04-16 09:30:00+07', 36, 2, 34, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-10 09:30:00+07'),
  ('ffffffff-ffff-4fff-afff-ffffffff0020', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa027', '44444444-4444-4444-a444-444444444402', '33333333-3333-4333-a333-333333333302', 'ACTIVE', '2026-05-10 10:00:00+07', '2026-04-16 10:00:00+07', 36, 1, 35, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-10 10:00:00+07');

-- =============================================================================
-- 12. SUBSCRIPTION STATUS HISTORY (1 per subscription: null → active)
-- =============================================================================
INSERT INTO subscription_status_history (id, subscription_id, from_status, to_status, changed_by, reason, created_at) VALUES
  ('00000000-0001-4000-a000-000000000001', 'ffffffff-ffff-4fff-afff-ffffffff0001', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', 'Kích hoạt sau thanh toán',                  '2026-05-09 09:00:00+07'),
  ('00000000-0001-4000-a000-000000000002', 'ffffffff-ffff-4fff-afff-ffffffff0002', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', 'Kích hoạt sau thanh toán',                  '2026-05-09 09:30:00+07'),
  ('00000000-0001-4000-a000-000000000003', 'ffffffff-ffff-4fff-afff-ffffffff0003', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', 'Kích hoạt sau thanh toán',                  '2026-05-09 10:00:00+07'),
  ('00000000-0001-4000-a000-000000000004', 'ffffffff-ffff-4fff-afff-ffffffff0004', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', 'Kích hoạt sau thanh toán',                  '2026-05-09 10:30:00+07'),
  ('00000000-0001-4000-a000-000000000005', 'ffffffff-ffff-4fff-afff-ffffffff0005', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', 'Kích hoạt sau thanh toán',                  '2026-05-09 11:00:00+07'),
  ('00000000-0001-4000-a000-000000000006', 'ffffffff-ffff-4fff-afff-ffffffff0006', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', 'Kích hoạt sau thanh toán',                  '2026-05-09 14:00:00+07'),
  ('00000000-0001-4000-a000-000000000007', 'ffffffff-ffff-4fff-afff-ffffffff0007', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', 'Kích hoạt sau thanh toán',                  '2026-05-09 14:30:00+07'),
  ('00000000-0001-4000-a000-000000000008', 'ffffffff-ffff-4fff-afff-ffffffff0008', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', 'Kích hoạt sau thanh toán',                  '2026-05-10 09:00:00+07'),
  ('00000000-0001-4000-a000-000000000009', 'ffffffff-ffff-4fff-afff-ffffffff0009', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', 'Kích hoạt sau thanh toán',                  '2026-05-10 09:30:00+07'),
  ('00000000-0001-4000-a000-000000000010', 'ffffffff-ffff-4fff-afff-ffffffff0010', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', 'Kích hoạt sau thanh toán',                  '2026-05-10 10:00:00+07'),
  ('00000000-0001-4000-a000-000000000011', 'ffffffff-ffff-4fff-afff-ffffffff0011', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', 'Kích hoạt sau thanh toán',                  '2026-05-09 09:00:00+07'),
  ('00000000-0001-4000-a000-000000000012', 'ffffffff-ffff-4fff-afff-ffffffff0012', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', 'Kích hoạt sau thanh toán',                  '2026-05-09 09:30:00+07'),
  ('00000000-0001-4000-a000-000000000013', 'ffffffff-ffff-4fff-afff-ffffffff0013', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', 'Kích hoạt sau thanh toán',                  '2026-05-09 10:00:00+07'),
  ('00000000-0001-4000-a000-000000000014', 'ffffffff-ffff-4fff-afff-ffffffff0014', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', 'Kích hoạt sau thanh toán',                  '2026-05-09 10:30:00+07'),
  ('00000000-0001-4000-a000-000000000015', 'ffffffff-ffff-4fff-afff-ffffffff0015', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', 'Kích hoạt sau thanh toán',                  '2026-05-09 11:00:00+07'),
  ('00000000-0001-4000-a000-000000000016', 'ffffffff-ffff-4fff-afff-ffffffff0016', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', 'Kích hoạt sau thanh toán',                  '2026-05-09 14:00:00+07'),
  ('00000000-0001-4000-a000-000000000017', 'ffffffff-ffff-4fff-afff-ffffffff0017', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', 'Kích hoạt sau thanh toán',                  '2026-05-09 14:30:00+07'),
  ('00000000-0001-4000-a000-000000000018', 'ffffffff-ffff-4fff-afff-ffffffff0018', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', 'Kích hoạt sau thanh toán',                  '2026-05-10 09:00:00+07'),
  ('00000000-0001-4000-a000-000000000019', 'ffffffff-ffff-4fff-afff-ffffffff0019', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', 'Kích hoạt sau thanh toán',                  '2026-05-10 09:30:00+07'),
  ('00000000-0001-4000-a000-000000000020', 'ffffffff-ffff-4fff-afff-ffffffff0020', NULL, 'ACTIVE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', 'Kích hoạt sau thanh toán',                  '2026-05-10 10:00:00+07');

-- =============================================================================
-- 13. TRIAL BOOKINGS  (3 converted + 2 pending + 1 attended)
-- =============================================================================
INSERT INTO trial_bookings (id, guest_user_id, full_name, phone_number, email, branch_id, trial_plan_name, scheduled_at, status, notes, converted_subscription_id, converted_at, created_at, updated_at) VALUES
  ('00000000-0002-4000-a000-000000000001', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008', 'Nguyễn Văn An',   '0901234001', 'member01.hn@myfit.vn',          '33333333-3333-4333-a333-333333333301', 'Trải nghiệm Cơ Bản', '2026-05-14 10:00:00+07', 'CONVERTED', 'Đăng ký gói Basic sau buổi trải nghiệm.', 'ffffffff-ffff-4fff-afff-ffffffff0001', '2026-05-09 09:00:00+07', '2026-05-13 18:00:00+07', '2026-05-09 09:00:00+07'),
  ('00000000-0002-4000-a000-000000000002', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa009', 'Trần Thị Bích',   '0901234002', 'member02.hn@myfit.vn',          '33333333-3333-4333-a333-333333333301', 'Trải nghiệm Cơ Bản', '2026-05-14 14:00:00+07', 'CONVERTED', 'Đăng ký gói Basic sau buổi trải nghiệm.', 'ffffffff-ffff-4fff-afff-ffffffff0002', '2026-05-09 09:30:00+07', '2026-05-13 19:00:00+07', '2026-05-09 09:30:00+07'),
  ('00000000-0002-4000-a000-000000000003', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa010', 'Phạm Minh Cường', '0901234003', 'member03.hn@myfit.vn',          '33333333-3333-4333-a333-333333333301', 'Trải nghiệm Cơ Bản', '2026-05-09 08:00:00+07', 'CONVERTED', 'Đăng ký gói Basic sau buổi trải nghiệm.', 'ffffffff-ffff-4fff-afff-ffffffff0003', '2026-05-09 10:00:00+07', '2026-05-14 10:00:00+07', '2026-05-09 10:00:00+07'),
  ('00000000-0002-4000-a000-000000000004', NULL,                                   'Lê Thị Dung',     '0902345004', 'guest.le.dung@gmail.com',       '33333333-3333-4333-a333-333333333301', 'Trải nghiệm Cơ Bản', '2026-05-18 10:00:00+07', 'BOOKED',    'Khách đặt lịch trải nghiệm online.',     NULL,                                   NULL,                       '2026-05-10 20:00:00+07', '2026-05-10 20:00:00+07'),
  ('00000000-0002-4000-a000-000000000005', NULL,                                   'Hoàng Văn Em',    '0902345005', 'guest.hoang.em@gmail.com',      '33333333-3333-4333-a333-333333333302', 'Trải nghiệm Cơ Bản', '2026-05-18 14:00:00+07', 'BOOKED',    'Khách đặt lịch trải nghiệm online.',     NULL,                                   NULL,                       '2026-05-11 09:00:00+07', '2026-05-11 09:00:00+07'),
  ('00000000-0002-4000-a000-000000000006', NULL,                                   'Vũ Thị Phương',   '0902345006', 'guest.vu.phuong@gmail.com',     '33333333-3333-4333-a333-333333333302', 'Trải nghiệm Cơ Bản', '2026-05-10 16:00:00+07', 'ATTENDED',  'Đã trải nghiệm, chưa quyết định.',       NULL,                                   NULL,                       '2026-05-09 12:00:00+07', '2026-05-10 17:00:00+07');

-- =============================================================================
-- 14. TRIAL STATUS HISTORY
-- =============================================================================
INSERT INTO trial_status_history (id, trial_booking_id, from_status, to_status, changed_by, created_at) VALUES
  -- trial 1 (converted)
  ('00000000-0003-4000-a000-000000000001', '00000000-0002-4000-a000-000000000001', NULL,        'BOOKED',    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-13 18:00:00+07'),
  ('00000000-0003-4000-a000-000000000002', '00000000-0002-4000-a000-000000000001', 'BOOKED',    'CONVERTED', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 09:00:00+07'),
  -- trial 2 (converted)
  ('00000000-0003-4000-a000-000000000003', '00000000-0002-4000-a000-000000000002', NULL,        'BOOKED',    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-13 19:00:00+07'),
  ('00000000-0003-4000-a000-000000000004', '00000000-0002-4000-a000-000000000002', 'BOOKED',    'CONVERTED', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 09:30:00+07'),
  -- trial 3 (converted)
  ('00000000-0003-4000-a000-000000000005', '00000000-0002-4000-a000-000000000003', NULL,        'BOOKED',    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-14 10:00:00+07'),
  ('00000000-0003-4000-a000-000000000006', '00000000-0002-4000-a000-000000000003', 'BOOKED',    'CONVERTED', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 10:00:00+07'),
  -- trial 4 (pending)
  ('00000000-0003-4000-a000-000000000007', '00000000-0002-4000-a000-000000000004', NULL,        'BOOKED',    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-10 20:00:00+07'),
  -- trial 5 (pending)
  ('00000000-0003-4000-a000-000000000008', '00000000-0002-4000-a000-000000000005', NULL,        'BOOKED',    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-11 09:00:00+07'),
  -- trial 6 (attended)
  ('00000000-0003-4000-a000-000000000009', '00000000-0002-4000-a000-000000000006', NULL,        'BOOKED',    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-09 12:00:00+07'),
  ('00000000-0003-4000-a000-000000000010', '00000000-0002-4000-a000-000000000006', 'BOOKED',    'ATTENDED',  'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-10 17:00:00+07');

-- =============================================================================
-- 15. MEMBER CHECK-INS (31 = 16 HN + 15 HCM, all between 06:00–22:00)
-- =============================================================================
INSERT INTO member_check_ins (id, user_id, branch_id, subscription_id, check_in_time, created_by, created_at) VALUES
  -- HN
  ('00000000-0004-4000-a000-000000000001', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0001', '2026-05-09 18:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 18:00:00+07'),
  ('00000000-0004-4000-a000-000000000002', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0001', '2026-05-10 18:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-10 18:00:00+07'),
  ('00000000-0004-4000-a000-000000000003', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa009', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0002', '2026-05-09 18:30:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 18:30:00+07'),
  ('00000000-0004-4000-a000-000000000004', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa009', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0002', '2026-05-11 09:15:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-11 09:15:00+07'),
  ('00000000-0004-4000-a000-000000000005', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa010', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0003', '2026-05-09 19:00:00+07', NULL,                                     '2026-05-09 19:00:00+07'),
  ('00000000-0004-4000-a000-000000000006', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa011', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0004', '2026-05-09 19:30:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 19:30:00+07'),
  ('00000000-0004-4000-a000-000000000007', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa011', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0004', '2026-05-10 18:30:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-10 18:30:00+07'),
  ('00000000-0004-4000-a000-000000000008', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa012', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0005', '2026-05-10 07:00:00+07', NULL,                                     '2026-05-10 07:00:00+07'),
  ('00000000-0004-4000-a000-000000000009', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa013', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0006', '2026-05-09 17:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-09 17:00:00+07'),
  ('00000000-0004-4000-a000-000000000010', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa013', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0006', '2026-05-11 17:30:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-11 17:30:00+07'),
  ('00000000-0004-4000-a000-000000000011', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa014', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0007', '2026-05-10 16:00:00+07', NULL,                                     '2026-05-10 16:00:00+07'),
  ('00000000-0004-4000-a000-000000000012', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa015', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0008', '2026-05-10 09:30:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-10 09:30:00+07'),
  ('00000000-0004-4000-a000-000000000013', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa015', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0008', '2026-05-11 07:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-11 07:00:00+07'),
  ('00000000-0004-4000-a000-000000000014', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa016', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0009', '2026-05-11 08:30:00+07', NULL,                                     '2026-05-11 08:30:00+07'),
  ('00000000-0004-4000-a000-000000000015', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa017', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0010', '2026-05-10 19:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-10 19:00:00+07'),
  ('00000000-0004-4000-a000-000000000016', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa017', '33333333-3333-4333-a333-333333333301', 'ffffffff-ffff-4fff-afff-ffffffff0010', '2026-05-11 20:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002', '2026-05-11 20:00:00+07'),
  -- HCM
  ('00000000-0004-4000-a000-000000000017', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa018', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0011', '2026-05-09 18:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-09 18:00:00+07'),
  ('00000000-0004-4000-a000-000000000018', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa018', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0011', '2026-05-10 07:30:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-10 07:30:00+07'),
  ('00000000-0004-4000-a000-000000000019', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa019', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0012', '2026-05-09 18:30:00+07', NULL,                                     '2026-05-09 18:30:00+07'),
  ('00000000-0004-4000-a000-000000000020', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa020', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0013', '2026-05-10 10:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-10 10:00:00+07'),
  ('00000000-0004-4000-a000-000000000021', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa020', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0013', '2026-05-11 10:30:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-11 10:30:00+07'),
  ('00000000-0004-4000-a000-000000000022', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa021', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0014', '2026-05-09 20:00:00+07', NULL,                                     '2026-05-09 20:00:00+07'),
  ('00000000-0004-4000-a000-000000000023', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa022', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0015', '2026-05-09 19:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-09 19:00:00+07'),
  ('00000000-0004-4000-a000-000000000024', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa022', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0015', '2026-05-11 08:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-11 08:00:00+07'),
  ('00000000-0004-4000-a000-000000000025', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa023', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0016', '2026-05-09 16:30:00+07', NULL,                                     '2026-05-09 16:30:00+07'),
  ('00000000-0004-4000-a000-000000000026', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa024', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0017', '2026-05-10 17:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-10 17:00:00+07'),
  ('00000000-0004-4000-a000-000000000027', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa024', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0017', '2026-05-11 18:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-11 18:00:00+07'),
  ('00000000-0004-4000-a000-000000000028', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa025', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0018', '2026-05-10 19:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-10 19:00:00+07'),
  ('00000000-0004-4000-a000-000000000029', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa026', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0019', '2026-05-10 20:00:00+07', NULL,                                     '2026-05-10 20:00:00+07'),
  ('00000000-0004-4000-a000-000000000030', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa026', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0019', '2026-05-11 19:30:00+07', NULL,                                     '2026-05-11 19:30:00+07'),
  ('00000000-0004-4000-a000-000000000031', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa027', '33333333-3333-4333-a333-333333333302', 'ffffffff-ffff-4fff-afff-ffffffff0020', '2026-05-11 07:00:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003', '2026-05-11 07:00:00+07');

-- =============================================================================
-- 16. PT SESSIONS (18 sessions across 4 coaches, 3-5 per coach)
-- =============================================================================
INSERT INTO pt_sessions (id, member_user_id, trainer_user_id, pt_package_id, branch_id, scheduled_at, status, attended_at, notes, created_at, updated_at) VALUES
  -- Coach HN 1 (u004) — 5 sessions
  ('00000000-0005-4000-a000-000000000001', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333301', '2026-05-09 09:00:00+07', 'completed', '2026-05-09 09:00:00+07', 'Buổi PT đầu — đánh giá thể trạng.',     '2026-05-14 10:00:00+07', '2026-05-09 10:00:00+07'),
  ('00000000-0005-4000-a000-000000000002', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333301', '2026-05-10 09:00:00+07', 'completed', '2026-05-10 09:00:00+07', 'Tập sức bền — chạy bộ 30 phút.',         '2026-05-09 10:30:00+07', '2026-05-10 10:00:00+07'),
  ('00000000-0005-4000-a000-000000000003', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa009', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333301', '2026-05-09 10:00:00+07', 'completed', '2026-05-09 10:00:00+07', 'Tập tay vai — kỹ thuật cơ bản.',         '2026-05-14 11:00:00+07', '2026-05-09 11:00:00+07'),
  ('00000000-0005-4000-a000-000000000004', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa009', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333301', '2026-05-11 10:00:00+07', 'scheduled', NULL,                       'Lịch buổi 3.',                            '2026-05-09 11:00:00+07', '2026-05-09 11:00:00+07'),
  ('00000000-0005-4000-a000-000000000005', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa010', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333301', '2026-05-11 11:00:00+07', 'scheduled', NULL,                       'Lịch buổi giới thiệu.',                  '2026-05-09 12:00:00+07', '2026-05-09 12:00:00+07'),
  -- Coach HN 2 (u005) — 4 sessions
  ('00000000-0005-4000-a000-000000000006', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa013', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa005', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333301', '2026-05-09 14:00:00+07', 'completed', '2026-05-09 14:00:00+07', 'Buổi PT đầu — focus core.',              '2026-05-14 14:00:00+07', '2026-05-09 15:00:00+07'),
  ('00000000-0005-4000-a000-000000000007', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa013', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa005', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333301', '2026-05-11 14:00:00+07', 'scheduled', NULL,                       'Tiếp tục lịch buổi 2.',                  '2026-05-09 15:30:00+07', '2026-05-09 15:30:00+07'),
  ('00000000-0005-4000-a000-000000000008', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa014', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa005', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333301', '2026-05-10 15:00:00+07', 'scheduled', NULL,                       'Buổi đầu cho member 07.',                '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07'),
  ('00000000-0005-4000-a000-000000000009', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa014', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa005', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333301', '2026-05-11 15:00:00+07', 'scheduled', NULL,                       'Tiếp tục buổi 2.',                       '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07'),
  -- Coach HCM 1 (u006) — 5 sessions
  ('00000000-0005-4000-a000-000000000010', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa018', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333302', '2026-05-09 09:00:00+07', 'completed', '2026-05-09 09:00:00+07', 'Buổi PT đầu — đánh giá thể trạng.',     '2026-05-14 10:00:00+07', '2026-05-09 10:00:00+07'),
  ('00000000-0005-4000-a000-000000000011', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa018', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333302', '2026-05-10 09:00:00+07', 'completed', '2026-05-10 09:00:00+07', 'Buổi 2 — tập kéo lưng.',                 '2026-05-09 10:30:00+07', '2026-05-10 10:00:00+07'),
  ('00000000-0005-4000-a000-000000000012', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa019', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333302', '2026-05-09 10:00:00+07', 'completed', '2026-05-09 10:00:00+07', 'Tập chân — squat cơ bản.',               '2026-05-14 11:00:00+07', '2026-05-09 11:00:00+07'),
  ('00000000-0005-4000-a000-000000000013', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa019', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333302', '2026-05-11 10:00:00+07', 'scheduled', NULL,                       'Lịch buổi 3.',                            '2026-05-09 11:00:00+07', '2026-05-09 11:00:00+07'),
  ('00000000-0005-4000-a000-000000000014', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa020', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333302', '2026-05-11 11:00:00+07', 'scheduled', NULL,                       'Buổi đầu cho member HCM-03.',            '2026-05-09 12:00:00+07', '2026-05-09 12:00:00+07'),
  -- Coach HCM 2 (u007) — 4 sessions
  ('00000000-0005-4000-a000-000000000015', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa023', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa007', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333302', '2026-05-09 14:00:00+07', 'completed', '2026-05-09 14:00:00+07', 'Buổi PT đầu — focus mobility.',          '2026-05-14 14:00:00+07', '2026-05-09 15:00:00+07'),
  ('00000000-0005-4000-a000-000000000016', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa023', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa007', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333302', '2026-05-11 14:00:00+07', 'scheduled', NULL,                       'Tiếp tục buổi 2.',                       '2026-05-09 15:30:00+07', '2026-05-09 15:30:00+07'),
  ('00000000-0005-4000-a000-000000000017', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa024', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa007', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333302', '2026-05-10 15:00:00+07', 'scheduled', NULL,                       'Buổi đầu cho member HCM-07.',            '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07'),
  ('00000000-0005-4000-a000-000000000018', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa024', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa007', '55555555-5555-4555-a555-555555555501', '33333333-3333-4333-a333-333333333302', '2026-05-11 15:00:00+07', 'scheduled', NULL,                       'Tiếp tục buổi 2.',                       '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07');

-- =============================================================================
-- 17. INVOICES (20 membership + 4 PT = 24 invoices)
-- =============================================================================
INSERT INTO invoices (id, invoice_number, user_id, branch_id, total_amount, status, due_date, created_at, updated_at) VALUES
  -- Membership invoices HN
  ('00000000-0006-4000-a000-000000000001', 'INV-2026-0001', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008', '33333333-3333-4333-a333-333333333301', 1200000, 'paid', '2026-05-09 09:00:00+07', '2026-05-09 09:00:00+07', '2026-05-09 09:00:00+07'),
  ('00000000-0006-4000-a000-000000000002', 'INV-2026-0002', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa009', '33333333-3333-4333-a333-333333333301', 1200000, 'paid', '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07'),
  ('00000000-0006-4000-a000-000000000003', 'INV-2026-0003', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa010', '33333333-3333-4333-a333-333333333301', 1200000, 'paid', '2026-05-09 10:00:00+07', '2026-05-09 10:00:00+07', '2026-05-09 10:00:00+07'),
  ('00000000-0006-4000-a000-000000000004', 'INV-2026-0004', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa011', '33333333-3333-4333-a333-333333333301', 1200000, 'paid', '2026-05-09 10:30:00+07', '2026-05-09 10:30:00+07', '2026-05-09 10:30:00+07'),
  ('00000000-0006-4000-a000-000000000005', 'INV-2026-0005', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa012', '33333333-3333-4333-a333-333333333301', 1200000, 'paid', '2026-05-09 11:00:00+07', '2026-05-09 11:00:00+07', '2026-05-09 11:00:00+07'),
  ('00000000-0006-4000-a000-000000000006', 'INV-2026-0006', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa013', '33333333-3333-4333-a333-333333333301', 3000000, 'paid', '2026-05-09 14:00:00+07', '2026-05-09 14:00:00+07', '2026-05-09 14:00:00+07'),
  ('00000000-0006-4000-a000-000000000007', 'INV-2026-0007', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa014', '33333333-3333-4333-a333-333333333301', 3000000, 'paid', '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07'),
  ('00000000-0006-4000-a000-000000000008', 'INV-2026-0008', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa015', '33333333-3333-4333-a333-333333333301', 3000000, 'paid', '2026-05-10 09:00:00+07', '2026-05-10 09:00:00+07', '2026-05-10 09:00:00+07'),
  ('00000000-0006-4000-a000-000000000009', 'INV-2026-0009', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa016', '33333333-3333-4333-a333-333333333301', 3000000, 'paid', '2026-05-10 09:30:00+07', '2026-05-10 09:30:00+07', '2026-05-10 09:30:00+07'),
  ('00000000-0006-4000-a000-000000000010', 'INV-2026-0010', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa017', '33333333-3333-4333-a333-333333333301', 3000000, 'paid', '2026-05-10 10:00:00+07', '2026-05-10 10:00:00+07', '2026-05-10 10:00:00+07'),
  -- Membership invoices HCM
  ('00000000-0006-4000-a000-000000000011', 'INV-2026-0011', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa018', '33333333-3333-4333-a333-333333333302', 1200000, 'paid', '2026-05-09 09:00:00+07', '2026-05-09 09:00:00+07', '2026-05-09 09:00:00+07'),
  ('00000000-0006-4000-a000-000000000012', 'INV-2026-0012', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa019', '33333333-3333-4333-a333-333333333302', 1200000, 'paid', '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07'),
  ('00000000-0006-4000-a000-000000000013', 'INV-2026-0013', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa020', '33333333-3333-4333-a333-333333333302', 1200000, 'paid', '2026-05-09 10:00:00+07', '2026-05-09 10:00:00+07', '2026-05-09 10:00:00+07'),
  ('00000000-0006-4000-a000-000000000014', 'INV-2026-0014', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa021', '33333333-3333-4333-a333-333333333302', 1200000, 'paid', '2026-05-09 10:30:00+07', '2026-05-09 10:30:00+07', '2026-05-09 10:30:00+07'),
  ('00000000-0006-4000-a000-000000000015', 'INV-2026-0015', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa022', '33333333-3333-4333-a333-333333333302', 1200000, 'paid', '2026-05-09 11:00:00+07', '2026-05-09 11:00:00+07', '2026-05-09 11:00:00+07'),
  ('00000000-0006-4000-a000-000000000016', 'INV-2026-0016', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa023', '33333333-3333-4333-a333-333333333302', 3000000, 'paid', '2026-05-09 14:00:00+07', '2026-05-09 14:00:00+07', '2026-05-09 14:00:00+07'),
  ('00000000-0006-4000-a000-000000000017', 'INV-2026-0017', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa024', '33333333-3333-4333-a333-333333333302', 3000000, 'paid', '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07'),
  ('00000000-0006-4000-a000-000000000018', 'INV-2026-0018', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa025', '33333333-3333-4333-a333-333333333302', 3000000, 'paid', '2026-05-10 09:00:00+07', '2026-05-10 09:00:00+07', '2026-05-10 09:00:00+07'),
  ('00000000-0006-4000-a000-000000000019', 'INV-2026-0019', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa026', '33333333-3333-4333-a333-333333333302', 3000000, 'paid', '2026-05-10 09:30:00+07', '2026-05-10 09:30:00+07', '2026-05-10 09:30:00+07'),
  ('00000000-0006-4000-a000-000000000020', 'INV-2026-0020', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa027', '33333333-3333-4333-a333-333333333302', 3000000, 'paid', '2026-05-10 10:00:00+07', '2026-05-10 10:00:00+07', '2026-05-10 10:00:00+07'),
  -- PT package invoices
  ('00000000-0006-4000-a000-000000000021', 'INV-2026-0021', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008', '33333333-3333-4333-a333-333333333301', 1500000, 'paid', '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07'),
  ('00000000-0006-4000-a000-000000000022', 'INV-2026-0022', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa013', '33333333-3333-4333-a333-333333333301', 1500000, 'paid', '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07'),
  ('00000000-0006-4000-a000-000000000023', 'INV-2026-0023', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa018', '33333333-3333-4333-a333-333333333302', 1500000, 'paid', '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07'),
  ('00000000-0006-4000-a000-000000000024', 'INV-2026-0024', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa023', '33333333-3333-4333-a333-333333333302', 1500000, 'paid', '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07', '2026-05-09 14:30:00+07');

-- =============================================================================
-- 18. PAYMENTS (1 success per invoice = 24 payments)
-- =============================================================================
INSERT INTO payments (id, invoice_id, amount, payment_method, status, transaction_ref, processed_at, created_by) VALUES
  ('00000000-0007-4000-a000-000000000001', '00000000-0006-4000-a000-000000000001', 1200000, 'transfer', 'success', 'TXN-2026011500001', '2026-05-09 09:05:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
  ('00000000-0007-4000-a000-000000000002', '00000000-0006-4000-a000-000000000002', 1200000, 'pos',      'success', 'TXN-2026011500002', '2026-05-09 09:35:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
  ('00000000-0007-4000-a000-000000000003', '00000000-0006-4000-a000-000000000003', 1200000, 'cash',     'success', 'TXN-2026011500003', '2026-05-09 10:05:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
  ('00000000-0007-4000-a000-000000000004', '00000000-0006-4000-a000-000000000004', 1200000, 'transfer', 'success', 'TXN-2026011500004', '2026-05-09 10:35:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
  ('00000000-0007-4000-a000-000000000005', '00000000-0006-4000-a000-000000000005', 1200000, 'pos',      'success', 'TXN-2026011500005', '2026-05-09 11:05:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
  ('00000000-0007-4000-a000-000000000006', '00000000-0006-4000-a000-000000000006', 3000000, 'transfer', 'success', 'TXN-2026011500006', '2026-05-09 14:05:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
  ('00000000-0007-4000-a000-000000000007', '00000000-0006-4000-a000-000000000007', 3000000, 'transfer', 'success', 'TXN-2026011500007', '2026-05-09 14:35:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
  ('00000000-0007-4000-a000-000000000008', '00000000-0006-4000-a000-000000000008', 3000000, 'transfer', 'success', 'TXN-2026011600008', '2026-05-10 09:05:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
  ('00000000-0007-4000-a000-000000000009', '00000000-0006-4000-a000-000000000009', 3000000, 'pos',      'success', 'TXN-2026011600009', '2026-05-10 09:35:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
  ('00000000-0007-4000-a000-000000000010', '00000000-0006-4000-a000-000000000010', 3000000, 'transfer', 'success', 'TXN-2026011600010', '2026-05-10 10:05:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
  ('00000000-0007-4000-a000-000000000011', '00000000-0006-4000-a000-000000000011', 1200000, 'transfer', 'success', 'TXN-2026011500011', '2026-05-09 09:05:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003'),
  ('00000000-0007-4000-a000-000000000012', '00000000-0006-4000-a000-000000000012', 1200000, 'cash',     'success', 'TXN-2026011500012', '2026-05-09 09:35:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003'),
  ('00000000-0007-4000-a000-000000000013', '00000000-0006-4000-a000-000000000013', 1200000, 'pos',      'success', 'TXN-2026011500013', '2026-05-09 10:05:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003'),
  ('00000000-0007-4000-a000-000000000014', '00000000-0006-4000-a000-000000000014', 1200000, 'transfer', 'success', 'TXN-2026011500014', '2026-05-09 10:35:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003'),
  ('00000000-0007-4000-a000-000000000015', '00000000-0006-4000-a000-000000000015', 1200000, 'cash',     'success', 'TXN-2026011500015', '2026-05-09 11:05:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003'),
  ('00000000-0007-4000-a000-000000000016', '00000000-0006-4000-a000-000000000016', 3000000, 'transfer', 'success', 'TXN-2026011500016', '2026-05-09 14:05:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003'),
  ('00000000-0007-4000-a000-000000000017', '00000000-0006-4000-a000-000000000017', 3000000, 'pos',      'success', 'TXN-2026011500017', '2026-05-09 14:35:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003'),
  ('00000000-0007-4000-a000-000000000018', '00000000-0006-4000-a000-000000000018', 3000000, 'transfer', 'success', 'TXN-2026011600018', '2026-05-10 09:05:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003'),
  ('00000000-0007-4000-a000-000000000019', '00000000-0006-4000-a000-000000000019', 3000000, 'transfer', 'success', 'TXN-2026011600019', '2026-05-10 09:35:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003'),
  ('00000000-0007-4000-a000-000000000020', '00000000-0006-4000-a000-000000000020', 3000000, 'transfer', 'success', 'TXN-2026011600020', '2026-05-10 10:05:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003'),
  -- PT payments
  ('00000000-0007-4000-a000-000000000021', '00000000-0006-4000-a000-000000000021', 1500000, 'transfer', 'success', 'TXN-2026011500021', '2026-05-09 09:35:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
  ('00000000-0007-4000-a000-000000000022', '00000000-0006-4000-a000-000000000022', 1500000, 'transfer', 'success', 'TXN-2026011500022', '2026-05-09 14:35:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
  ('00000000-0007-4000-a000-000000000023', '00000000-0006-4000-a000-000000000023', 1500000, 'transfer', 'success', 'TXN-2026011500023', '2026-05-09 09:35:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003'),
  ('00000000-0007-4000-a000-000000000024', '00000000-0006-4000-a000-000000000024', 1500000, 'pos',      'success', 'TXN-2026011500024', '2026-05-09 14:35:00+07', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003');

-- =============================================================================
-- 19. MEMBER HEALTH PROFILES (~70% members = 14)
-- =============================================================================
INSERT INTO member_health_profiles (id, user_id, date_of_birth, gender, height_cm, primary_goal, medical_conditions, created_at, updated_at) VALUES
  ('00000000-0008-4000-a000-000000000001', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008', '1998-03-15', 'male',   172.0, 'weight_loss', NULL,                 '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07'),
  ('00000000-0008-4000-a000-000000000002', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa009', '2000-07-22', 'female', 160.0, 'muscle_gain', NULL,                 '2026-05-09 09:50:00+07', '2026-05-09 09:50:00+07'),
  ('00000000-0008-4000-a000-000000000003', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa010', '1995-11-05', 'male',   178.0, 'fitness',     NULL,                 '2026-05-09 10:20:00+07', '2026-05-09 10:20:00+07'),
  ('00000000-0008-4000-a000-000000000004', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa011', '2001-01-30', 'female', 158.0, 'weight_loss', 'Hen suyễn nhẹ',      '2026-05-09 10:50:00+07', '2026-05-09 10:50:00+07'),
  ('00000000-0008-4000-a000-000000000005', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa012', '1993-06-18', 'male',   183.0, 'muscle_gain', NULL,                 '2026-05-09 11:20:00+07', '2026-05-09 11:20:00+07'),
  ('00000000-0008-4000-a000-000000000006', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa013', '1999-09-12', 'female', 162.0, 'fitness',     NULL,                 '2026-05-09 14:20:00+07', '2026-05-09 14:20:00+07'),
  ('00000000-0008-4000-a000-000000000007', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa014', '1997-04-25', 'male',   175.0, 'weight_loss', 'Đau lưng nhẹ',       '2026-05-09 14:50:00+07', '2026-05-09 14:50:00+07'),
  ('00000000-0008-4000-a000-000000000008', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa018', '1996-02-14', 'male',   170.0, 'muscle_gain', NULL,                 '2026-05-09 09:30:00+07', '2026-05-09 09:30:00+07'),
  ('00000000-0008-4000-a000-000000000009', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa019', '2002-08-20', 'female', 155.0, 'weight_loss', NULL,                 '2026-05-09 09:50:00+07', '2026-05-09 09:50:00+07'),
  ('00000000-0008-4000-a000-000000000010', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa020', '1994-12-03', 'male',   181.0, 'fitness',     'Huyết áp cao nhẹ',   '2026-05-09 10:20:00+07', '2026-05-09 10:20:00+07'),
  ('00000000-0008-4000-a000-000000000011', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa021', '2000-05-17', 'female', 163.0, 'weight_loss', NULL,                 '2026-05-09 10:50:00+07', '2026-05-09 10:50:00+07'),
  ('00000000-0008-4000-a000-000000000012', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa022', '1992-10-28', 'male',   185.0, 'muscle_gain', NULL,                 '2026-05-09 11:20:00+07', '2026-05-09 11:20:00+07'),
  ('00000000-0008-4000-a000-000000000013', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa023', '1998-07-09', 'female', 157.0, 'fitness',     NULL,                 '2026-05-09 14:20:00+07', '2026-05-09 14:20:00+07'),
  ('00000000-0008-4000-a000-000000000014', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa024', '2001-03-22', 'male',   173.0, 'weight_loss', NULL,                 '2026-05-09 14:50:00+07', '2026-05-09 14:50:00+07');

-- =============================================================================
-- 20. GUEST USERS (đăng ký nhưng chưa được gán role)
-- =============================================================================
INSERT INTO users (id, email, password_hash, status, email_verified_at, created_at, updated_at) VALUES
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa028', 'guest01@myfit.vn', '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8', 'ACTIVE', '2026-02-01 08:00:00+07', '2026-02-01 08:00:00+07', '2026-02-01 08:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa029', 'guest02@myfit.vn', '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8', 'ACTIVE', '2026-02-02 08:00:00+07', '2026-02-02 08:00:00+07', '2026-02-02 08:00:00+07'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa030', 'guest03@myfit.vn', '$argon2id$v=19$m=65536,t=3,p=4$jLHpQ9NGhwQwtNvPoic5fA$i+tD8TckU/lCmla5XEgYHMtjsvfJlx63eV8N1ZTGOF8', 'ACTIVE', '2026-02-03 08:00:00+07', '2026-02-03 08:00:00+07', '2026-02-03 08:00:00+07');

INSERT INTO profiles (id, user_id, full_name, created_at, updated_at) VALUES
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb028', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa028', 'Ngô Văn Tân',  '2026-02-01 08:00:00+07', '2026-02-01 08:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb029', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa029', 'Hà Thị Uyên',  '2026-02-02 08:00:00+07', '2026-02-02 08:00:00+07'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbb030', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa030', 'Trần Bá Vũ',   '2026-02-03 08:00:00+07', '2026-02-03 08:00:00+07');
-- không có user_role_assignments → primary_role = 'GUEST'

-- =============================================================================
-- 21. SHIFTS (8 ca/ngày × 3 ngày × 2 chi nhánh = 48 ca)
-- Khung giờ (UTC+7): S1=06:00 · S2=07:30 · S3=09:00 · S4=10:30 · S5=14:00 · S6=15:30 · S7=17:00 · S8=18:30
-- =============================================================================
DO $$
DECLARE
  hn  text := '33333333-3333-4333-a333-333333333301';
  hcm text := '33333333-3333-4333-a333-333333333302';
  shift_codes text[] := ARRAY['MORNING_1','MORNING_2','MORNING_3','MORNING_4','AFTERNOON_1','AFTERNOON_2','EVENING_1','EVENING_2'];
  shift_starts time[] := ARRAY['06:00','07:30','09:00','10:30','14:00','15:30','17:00','18:30']::time[];
  shift_ends   time[] := ARRAY['07:00','08:30','10:00','11:30','15:00','16:30','18:00','19:30']::time[];
  day_dates date[] := ARRAY['2026-05-09','2026-05-10','2026-05-11']::date[];
  d int; s int; branch_label text; branch_id text;
BEGIN
  FOR d IN 1..3 LOOP
    FOREACH branch_label IN ARRAY ARRAY['hn','hcm'] LOOP
      branch_id := CASE WHEN branch_label = 'hn' THEN hn ELSE hcm END;
      FOR s IN 1..8 LOOP
        INSERT INTO shifts (id, branch_id, shift_code, date, start_at, end_at, coach_capacity, created_at, updated_at)
        VALUES (
          'shift-' || branch_label || '-d' || d || '-s' || s,
          branch_id, shift_codes[s], day_dates[d],
          (day_dates[d]::text || ' ' || shift_starts[s]::text || '+07')::timestamptz,
          (day_dates[d]::text || ' ' || shift_ends[s]::text || '+07')::timestamptz,
          2, '2025-12-01 08:00:00+07', '2025-12-01 08:00:00+07'
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- =============================================================================
-- 22. TRAINER_ASSIGNMENTS (1 HLV/ca, ca lẻ → coach1, ca chẵn → coach2)
-- =============================================================================
DO $$
DECLARE
  hn  text := '33333333-3333-4333-a333-333333333301';
  hcm text := '33333333-3333-4333-a333-333333333302';
  d int; s int; branch_label text; branch_id text; coach_id text; mgr_id text;
BEGIN
  FOR d IN 1..3 LOOP
    FOREACH branch_label IN ARRAY ARRAY['hn','hcm'] LOOP
      IF branch_label = 'hn' THEN branch_id := hn; mgr_id := 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002';
      ELSE branch_id := hcm; mgr_id := 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003'; END IF;
      FOR s IN 1..8 LOOP
        IF branch_label = 'hn' THEN
          coach_id := CASE WHEN s % 2 = 1 THEN 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004' ELSE 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa005' END;
        ELSE
          coach_id := CASE WHEN s % 2 = 1 THEN 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006' ELSE 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa007' END;
        END IF;
        INSERT INTO trainer_assignments (id, trainer_user_id, shift_id, branch_id, note, assigned_by, assigned_at, unassigned_at, created_at, updated_at)
        VALUES (
          'ta-' || branch_label || '-d' || d || '-s' || s,
          coach_id,
          'shift-' || branch_label || '-d' || d || '-s' || s,
          branch_id, NULL, mgr_id, '2025-12-01 08:00:00+07', NULL,
          '2025-12-01 08:00:00+07', '2025-12-01 08:00:00+07'
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- =============================================================================
-- 23. CLASS_ATTENDANCE (6 hội viên × 48 ca = 288 lượt điểm danh)
-- =============================================================================
DO $$
DECLARE
  hn  text := '33333333-3333-4333-a333-333333333301';
  hcm text := '33333333-3333-4333-a333-333333333302';
  hn_members  text[] := ARRAY['008','009','010','011','012','013','014','015','016','017'];
  hcm_members text[] := ARRAY['018','019','020','021','022','023','024','025','026','027'];
  shift_starts time[] := ARRAY['06:00','07:30','09:00','10:30','14:00','15:30','17:00','18:30']::time[];
  slot_offsets int[] := ARRAY[5,8,12,15,19,23];
  day_dates date[] := ARRAY['2026-05-09','2026-05-10','2026-05-11']::date[];
  day_offsets int[] := ARRAY[0,2,4];
  d int; s int; n int; member_idx int; member_id text; ts timestamptz;
  branch_label text; branch_id text; members text[];
BEGIN
  FOR d IN 1..3 LOOP
    FOREACH branch_label IN ARRAY ARRAY['hn','hcm'] LOOP
      IF branch_label = 'hn' THEN branch_id := hn; members := hn_members;
      ELSE branch_id := hcm; members := hcm_members; END IF;
      FOR s IN 1..8 LOOP
        FOR n IN 1..6 LOOP
          member_idx := ((day_offsets[d] + s - 1 + n - 1) % 10) + 1;
          member_id := 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa' || members[member_idx];
          ts := (day_dates[d]::text || ' ' || shift_starts[s]::text || '+07')::timestamptz
                + (slot_offsets[n] || ' minutes')::interval;
          INSERT INTO class_attendance (id, enrollment_id, user_id, shift_id, branch_id, attended_at, check_in_time, status, created_by, created_at, proxy_checkin, override_reason, override_actor)
          VALUES (
            'ca-' || branch_label || '-d' || d || '-s' || s || '-' || n,
            NULL, member_id,
            'shift-' || branch_label || '-d' || d || '-s' || s,
            branch_id, ts, ts, 'PRESENT', NULL, ts, false, NULL, NULL
          );
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- =============================================================================
-- 24. UPDATE 1 CA THÀNH PROXY CHECK-IN (HLV điểm danh hộ)
-- Kịch bản: hội viên 008 không tự điểm danh được do app lỗi, HLV 004 điểm danh hộ
-- =============================================================================
UPDATE class_attendance
   SET proxy_checkin    = true,
       override_reason  = 'App MYFIT lỗi không scan QR được, HLV ghi nhận thay',
       override_actor   = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004',
       created_by       = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004'
 WHERE id = 'ca-hn-d2-s5-1';

-- =============================================================================
-- 25. AREAS (khu vực vật lý trong chi nhánh)
-- =============================================================================
INSERT INTO areas (id, branch_id, name, description, is_active, created_by, created_at, updated_at) VALUES
('area-hn-01', '33333333-3333-4333-a333-333333333301','Khu tạ tự do','Khu vực tạ tay, tạ đòn, power rack', true,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('area-hn-02', '33333333-3333-4333-a333-333333333301','Khu cardio',  'Máy chạy bộ, xe đạp, máy chèo thuyền', true,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('area-hn-03', '33333333-3333-4333-a333-333333333301','Phòng yoga',  'Phòng tập yoga và functional training', true,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('area-hcm-01','33333333-3333-4333-a333-333333333302','Khu tạ tự do','Khu vực tạ tay, tạ đòn, power rack', true,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('area-hcm-02','33333333-3333-4333-a333-333333333302','Khu cardio',  'Máy chạy bộ, xe đạp, máy chèo thuyền', true,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('area-hcm-03','33333333-3333-4333-a333-333333333302','Phòng yoga',  'Phòng tập yoga và functional training', true,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07');

-- =============================================================================
-- 26. ASSETS (thiết bị vật chất)
-- =============================================================================
INSERT INTO assets (id, branch_id, area_id, asset_code, name, asset_type, purchase_date, purchase_price, status, notes, created_by, created_at, updated_at) VALUES
-- HN
('asset-hn-01','33333333-3333-4333-a333-333333333301','area-hn-02','TM-HN-001','Máy chạy bộ Technogym SkillRun',     'TREADMILL', '2025-07-15', 280000000,'ACTIVE',NULL,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('asset-hn-02','33333333-3333-4333-a333-333333333301','area-hn-02','TM-HN-002','Máy chạy bộ Life Fitness T5',         'TREADMILL', '2025-07-15', 180000000,'MAINTENANCE','Đang bảo trì','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('asset-hn-03','33333333-3333-4333-a333-333333333301','area-hn-02','BK-HN-001','Xe đạp cardio Schwinn AC Sport',      'BIKE',      '2025-08-10',  35000000,'ACTIVE',NULL,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('asset-hn-04','33333333-3333-4333-a333-333333333301','area-hn-01','DB-HN-001','Bộ tạ tay 2-50kg (cặp)',              'DUMBBELL',  '2025-07-20',  45000000,'ACTIVE','Thiếu cặp 5kg','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('asset-hn-05','33333333-3333-4333-a333-333333333301','area-hn-01','SQ-HN-001','Power rack Rogue Monster',            'RACK',      '2025-07-25',  62000000,'ACTIVE',NULL,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('asset-hn-06','33333333-3333-4333-a333-333333333301','area-hn-03','YG-HN-001','Bộ thảm yoga Liforme 30 chiếc',       'YOGA_MAT',  '2025-08-01',  18000000,'ACTIVE',NULL,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
-- HCM
('asset-hcm-01','33333333-3333-4333-a333-333333333302','area-hcm-02','TM-HCM-001','Máy chạy bộ Technogym SkillRun',  'TREADMILL', '2025-07-15', 280000000,'ACTIVE',NULL,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('asset-hcm-02','33333333-3333-4333-a333-333333333302','area-hcm-02','TM-HCM-002','Máy chạy bộ Life Fitness T5',     'TREADMILL', '2025-07-15', 180000000,'BROKEN','Màn hình hỏng, chờ thay','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('asset-hcm-03','33333333-3333-4333-a333-333333333302','area-hcm-02','BK-HCM-001','Xe đạp cardio Schwinn AC Sport',  'BIKE',      '2025-08-10',  35000000,'ACTIVE',NULL,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('asset-hcm-04','33333333-3333-4333-a333-333333333302','area-hcm-01','DB-HCM-001','Bộ tạ tay 2-50kg (cặp)',          'DUMBBELL',  '2025-07-20',  45000000,'ACTIVE',NULL,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('asset-hcm-05','33333333-3333-4333-a333-333333333302','area-hcm-01','SQ-HCM-001','Power rack Rogue Monster',        'RACK',      '2025-07-25',  62000000,'ACTIVE',NULL,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07'),
('asset-hcm-06','33333333-3333-4333-a333-333333333302','area-hcm-03','YG-HCM-001','Bộ thảm yoga Liforme 30 chiếc',   'YOGA_MAT',  '2025-08-01',  18000000,'ACTIVE',NULL,'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003','2025-12-01 08:00:00+07','2025-12-01 08:00:00+07');

-- =============================================================================
-- 27. MAINTENANCE TICKETS (sự cố thiết bị)
-- =============================================================================
INSERT INTO maintenance_tickets (id, asset_id, branch_id, title, description, status, reported_by, assigned_to, resolved_at, created_at, updated_at) VALUES
('ticket-001','asset-hn-02', '33333333-3333-4333-a333-333333333301','Máy chạy TM-HN-002 có tiếng động lạ','Máy chạy bộ phát ra tiếng kêu khi chạy tốc độ cao trên 12km/h. Cần kiểm tra dây curoa.','IN_PROGRESS','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002',NULL,                       '2026-05-09 08:30:00+07','2026-05-09 14:00:00+07'),
('ticket-002','asset-hn-04', '33333333-3333-4333-a333-333333333301','Bộ tạ tay thiếu cặp 5kg và 10kg',     'Hội viên báo cặp 5kg và 10kg bị mất, cần bổ sung gấp.',                                'OPEN',       'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa005','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002',NULL,                       '2026-05-10 09:15:00+07','2026-05-10 09:15:00+07'),
('ticket-003','asset-hcm-02','33333333-3333-4333-a333-333333333302','Máy chạy TM-HCM-002 màn hình hỏng',   'Màn hình LCD không hiển thị, đã thử khởi động lại không được. Cần thay màn hình.',     'OPEN',       'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003',NULL,                       '2026-05-09 16:20:00+07','2026-05-09 16:20:00+07'),
('ticket-004','asset-hcm-03','33333333-3333-4333-a333-333333333302','Xe đạp BK-HCM-001 yên bị lỏng',       'Yên xe đạp bị lỏng, đã siết lại nhưng vẫn lỏng. Có thể cần thay ốc.',                  'RESOLVED',   'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa007','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003','2026-05-10 11:00:00+07','2026-05-09 18:00:00+07','2026-05-10 11:00:00+07');

-- =============================================================================
-- 28. POS TRANSACTIONS BỔ SUNG (4 hoá đơn + 4 thanh toán POS)
-- Tổng cộng có 6 + 4 = 10 giao dịch POS trong 3 ngày 15-17/05/2026
-- =============================================================================
INSERT INTO invoices (id, invoice_number, user_id, branch_id, total_amount, status, due_date, created_at, updated_at) VALUES
('00000000-0006-4000-a000-000000000025','INV-2026-0025','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa015','33333333-3333-4333-a333-333333333301',  500000,'paid','2026-05-09 16:00:00+07','2026-05-09 16:00:00+07','2026-05-09 16:00:00+07'),
('00000000-0006-4000-a000-000000000026','INV-2026-0026','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa016','33333333-3333-4333-a333-333333333301',  300000,'paid','2026-05-10 10:00:00+07','2026-05-10 10:00:00+07','2026-05-10 10:00:00+07'),
('00000000-0006-4000-a000-000000000027','INV-2026-0027','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa025','33333333-3333-4333-a333-333333333302',  450000,'paid','2026-05-10 15:00:00+07','2026-05-10 15:00:00+07','2026-05-10 15:00:00+07'),
('00000000-0006-4000-a000-000000000028','INV-2026-0028','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa026','33333333-3333-4333-a333-333333333302',  600000,'paid','2026-05-11 11:00:00+07','2026-05-11 11:00:00+07','2026-05-11 11:00:00+07');

INSERT INTO payments (id, invoice_id, amount, payment_method, status, transaction_ref, processed_at, created_by) VALUES
('00000000-0007-4000-a000-000000000025','00000000-0006-4000-a000-000000000025',500000,'pos','success','TXN-2026051500025','2026-05-09 16:05:00+07','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
('00000000-0007-4000-a000-000000000026','00000000-0006-4000-a000-000000000026',300000,'pos','success','TXN-2026051600026','2026-05-10 10:05:00+07','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002'),
('00000000-0007-4000-a000-000000000027','00000000-0006-4000-a000-000000000027',450000,'pos','success','TXN-2026051600027','2026-05-10 15:05:00+07','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003'),
('00000000-0007-4000-a000-000000000028','00000000-0006-4000-a000-000000000028',600000,'pos','success','TXN-2026051700028','2026-05-11 11:05:00+07','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003');

-- =============================================================================
-- 29. REFUNDS (3 trường hợp hoàn tiền)
-- =============================================================================
INSERT INTO refunds (id, invoice_id, amount, reason, status, processed_by, processed_at, created_at) VALUES
('refund-001','00000000-0006-4000-a000-000000000019',1500000,'Hội viên chuyển công tác sang tỉnh khác, hoàn 50% gói PRO-36 còn lại','APPROVED','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003','2026-05-10 14:00:00+07','2026-05-10 13:30:00+07'),
('refund-002','00000000-0006-4000-a000-000000000022',1500000,'HLV nghỉ việc, hội viên không muốn đổi HLV khác - hoàn 100% gói PT',         'APPROVED','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa002','2026-05-10 16:00:00+07','2026-05-10 15:30:00+07'),
('refund-003','00000000-0006-4000-a000-000000000024', 450000,'Hoàn 30% do tạm dừng PT 1 tuần vì bảo trì thiết bị TM-HCM-002',                'APPROVED','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa003','2026-05-11 10:00:00+07','2026-05-11 09:30:00+07');

-- =============================================================================
-- 30. REVIEWS (25 đánh giá: 15 ca tập + 10 HLV)
-- =============================================================================
INSERT INTO reviews (id, reviewer_id, target_type, target_id, rating, comment, tags, status, branch_id, attendance_id, created_at, updated_at) VALUES
-- Shift reviews HN
('00000000-000b-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008','shift','shift-hn-d1-s1',5,'Ca tập sáng năng lượng, không khí thoáng mát.',                       '["clean","energetic"]'::jsonb,'visible','33333333-3333-4333-a333-333333333301',NULL,'2026-05-09 08:00:00+07','2026-05-09 08:00:00+07'),
('00000000-000b-4000-a000-000000000002','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa009','shift','shift-hn-d1-s1',4,'Phòng tập tốt nhưng hơi đông, thiết bị cardio cần thêm.',             '["crowded"]'::jsonb,           'visible','33333333-3333-4333-a333-333333333301',NULL,'2026-05-09 08:30:00+07','2026-05-09 08:30:00+07'),
('00000000-000b-4000-a000-000000000003','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa010','shift','shift-hn-d1-s2',5,'HLV hướng dẫn nhiệt tình, không khí ca tập rất tốt.',                  '["coach","positive"]'::jsonb, 'visible','33333333-3333-4333-a333-333333333301',NULL,'2026-05-09 09:30:00+07','2026-05-09 09:30:00+07'),
('00000000-000b-4000-a000-000000000004','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa011','shift','shift-hn-d1-s3',4,'Ca tập đông vui, có nhiều bạn bè giao lưu.',                           '["social"]'::jsonb,            'visible','33333333-3333-4333-a333-333333333301',NULL,'2026-05-09 11:00:00+07','2026-05-09 11:00:00+07'),
('00000000-000b-4000-a000-000000000005','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa012','shift','shift-hn-d1-s4',3,'Ca tập trưa hơi nóng, điều hòa không đủ mát.',                         '["hot"]'::jsonb,               'visible','33333333-3333-4333-a333-333333333301',NULL,'2026-05-09 12:00:00+07','2026-05-09 12:00:00+07'),
('00000000-000b-4000-a000-000000000006','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa013','shift','shift-hn-d1-s5',5,'Ca chiều mát mẻ, không quá đông, tập rất thoải mái.',                  '["clean"]'::jsonb,             'visible','33333333-3333-4333-a333-333333333301',NULL,'2026-05-09 15:00:00+07','2026-05-09 15:00:00+07'),
('00000000-000b-4000-a000-000000000007','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa014','shift','shift-hn-d1-s6',4,'Ca chiều ổn, HLV có hỗ trợ form tập.',                                 '["coach"]'::jsonb,             'visible','33333333-3333-4333-a333-333333333301',NULL,'2026-05-09 16:30:00+07','2026-05-09 16:30:00+07'),
('00000000-000b-4000-a000-000000000008','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa015','shift','shift-hn-d1-s7',5,'Ca tối rất đông vui, nhạc chill, tập đã.',                             '["music","social"]'::jsonb,    'visible','33333333-3333-4333-a333-333333333301',NULL,'2026-05-09 18:00:00+07','2026-05-09 18:00:00+07'),
-- Shift reviews HCM
('00000000-000b-4000-a000-000000000009','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa018','shift','shift-hcm-d1-s1',5,'Phòng tập sáng sạch sẽ, dụng cụ đầy đủ.',                              '["clean"]'::jsonb,             'visible','33333333-3333-4333-a333-333333333302',NULL,'2026-05-09 08:00:00+07','2026-05-09 08:00:00+07'),
('00000000-000b-4000-a000-000000000010','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa019','shift','shift-hcm-d1-s2',4,'Ca tập tốt nhưng máy chạy bộ TM-HCM-002 hỏng.',                        '["equipment"]'::jsonb,         'visible','33333333-3333-4333-a333-333333333302',NULL,'2026-05-09 09:30:00+07','2026-05-09 09:30:00+07'),
('00000000-000b-4000-a000-000000000011','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa020','shift','shift-hcm-d1-s3',5,'HLV hướng dẫn rất chi tiết, từng động tác đều có chỉnh form.',         '["coach"]'::jsonb,             'visible','33333333-3333-4333-a333-333333333302',NULL,'2026-05-09 11:00:00+07','2026-05-09 11:00:00+07'),
('00000000-000b-4000-a000-000000000012','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa021','shift','shift-hcm-d1-s4',5,'Ca tập rất ưng, nhân viên lễ tân thân thiện.',                         '["staff"]'::jsonb,             'visible','33333333-3333-4333-a333-333333333302',NULL,'2026-05-09 12:00:00+07','2026-05-09 12:00:00+07'),
('00000000-000b-4000-a000-000000000013','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa022','shift','shift-hcm-d1-s5',4,'Ca chiều ổn, mong có thêm máy elip.',                                  '["equipment"]'::jsonb,         'visible','33333333-3333-4333-a333-333333333302',NULL,'2026-05-09 15:00:00+07','2026-05-09 15:00:00+07'),
('00000000-000b-4000-a000-000000000014','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa023','shift','shift-hcm-d1-s6',3,'Ca chiều hơi đông, phải chờ máy.',                                     '["crowded"]'::jsonb,           'visible','33333333-3333-4333-a333-333333333302',NULL,'2026-05-09 16:30:00+07','2026-05-09 16:30:00+07'),
('00000000-000b-4000-a000-000000000015','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa024','shift','shift-hcm-d1-s7',5,'Ca tối tập rất tập trung, chất lượng cao.',                            '["focus"]'::jsonb,             'visible','33333333-3333-4333-a333-333333333302',NULL,'2026-05-09 18:00:00+07','2026-05-09 18:00:00+07'),
-- Coach reviews HN (target = coach user_id)
('00000000-000b-4000-a000-000000000016','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa008','coach','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004',5,'Anh Hùng (HLV) hướng dẫn rất tận tâm, sửa form chi tiết.',                                  '["coach","detailed"]'::jsonb,'visible','33333333-3333-4333-a333-333333333301',NULL,'2026-05-09 08:00:00+07','2026-05-09 08:00:00+07'),
('00000000-000b-4000-a000-000000000017','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa009','coach','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa005',4,'Chị Lan (HLV) nhiệt tình nhưng đôi khi bận, ít quan tâm hết được.',                          '["coach"]'::jsonb,           'visible','33333333-3333-4333-a333-333333333301',NULL,'2026-05-10 09:00:00+07','2026-05-10 09:00:00+07'),
('00000000-000b-4000-a000-000000000018','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa010','coach','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004',5,'Anh Hùng giúp tôi đạt mục tiêu giảm 5kg trong 2 tháng.',                                     '["coach","goal"]'::jsonb,    'visible','33333333-3333-4333-a333-333333333301',NULL,'2026-05-10 10:00:00+07','2026-05-10 10:00:00+07'),
('00000000-000b-4000-a000-000000000019','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa011','coach','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa005',5,'Chị Lan có chương trình tập riêng cho từng người, rất chuyên nghiệp.',                       '["coach","custom"]'::jsonb,  'visible','33333333-3333-4333-a333-333333333301',NULL,'2026-05-10 11:00:00+07','2026-05-10 11:00:00+07'),
('00000000-000b-4000-a000-000000000020','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa012','coach','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa004',4,'HLV ổn, nhưng mong sắp xếp được nhiều giờ tập hơn.',                                          '["coach"]'::jsonb,           'visible','33333333-3333-4333-a333-333333333301',NULL,'2026-05-11 09:00:00+07','2026-05-11 09:00:00+07'),
-- Coach reviews HCM
('00000000-000b-4000-a000-000000000021','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa018','coach','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006',5,'Anh Mạnh (HLV) chuyên về tập tạ, kiến thức rất chắc.',                                       '["coach","strength"]'::jsonb,'visible','33333333-3333-4333-a333-333333333302',NULL,'2026-05-09 09:00:00+07','2026-05-09 09:00:00+07'),
('00000000-000b-4000-a000-000000000022','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa019','coach','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa007',4,'Chị Nga (HLV) tốt cho người mới, nhẹ nhàng dễ hiểu.',                                        '["coach","beginner"]'::jsonb,'visible','33333333-3333-4333-a333-333333333302',NULL,'2026-05-10 10:00:00+07','2026-05-10 10:00:00+07'),
('00000000-000b-4000-a000-000000000023','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa020','coach','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006',5,'Anh Mạnh giúp tôi đạt PR deadlift 120kg, rất biết ơn.',                                      '["coach","goal"]'::jsonb,    'visible','33333333-3333-4333-a333-333333333302',NULL,'2026-05-10 11:00:00+07','2026-05-10 11:00:00+07'),
('00000000-000b-4000-a000-000000000024','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa021','coach','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa007',5,'Chị Nga rất kiên nhẫn, giải thích rõ ràng từng động tác.',                                   '["coach","patient"]'::jsonb, 'visible','33333333-3333-4333-a333-333333333302',NULL,'2026-05-11 10:00:00+07','2026-05-11 10:00:00+07'),
('00000000-000b-4000-a000-000000000025','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa022','coach','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaa006',4,'HLV ổn, tuy nhiên giáo án hơi nặng cho người mới như mình.',                                  '["coach","heavy"]'::jsonb,   'visible','33333333-3333-4333-a333-333333333302',NULL,'2026-05-11 14:00:00+07','2026-05-11 14:00:00+07');

COMMIT;

-- =============================================================================
-- END OF SEED DATA
-- Summary: 4 roles · 1 org · 2 branches · 3 plans · 2 PT pkgs · 30 users
--          30 profiles · 27 role-assignments · 2 mgr-assignments · 6 staff
--          20 subs · 20 sub-history · 6 trials · 10 trial-history
--          31 check-ins · 18 PT sessions · 28 invoices · 28 payments (10 POS)
--          14 health profiles · 3 guests · 48 shifts · 48 trainer-assignments
--          288 class-attendance (1 proxy) · 6 areas · 12 assets · 4 maintenance-tickets
--          3 refunds · 25 reviews
-- Timeline (main activity): 2026-05-09 → 2026-05-11 (UTC+7)
-- =============================================================================
