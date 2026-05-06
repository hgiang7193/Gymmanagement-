-- ==========================================
-- SHIFTS & TRAINER ASSIGNMENTS
-- ==========================================

-- Create shifts table for daily training slots
create table if not exists shifts (
  id text primary key,
  branch_id text not null references branches(id),
  shift_code text not null, -- MORNING_1, MORNING_2, AFTERNOON_1, AFTERNOON_2, EVENING_1, EVENING_2
  date date not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  coach_capacity integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint: one shift per branch per date per shift_code
create unique index if not exists uq_shift_branch_date_code
  on shifts (branch_id, date, shift_code);

-- Index for querying shifts by branch and date
create index if not exists idx_shifts_branch_date
  on shifts (branch_id, date);

-- Index for querying shifts by time range
create index if not exists idx_shifts_time_range
  on shifts (start_at, end_at);

-- Create trainer_assignments table for coach scheduling
create table if not exists trainer_assignments (
  id text primary key,
  trainer_user_id text not null references users(id),
  shift_id text not null references shifts(id),
  branch_id text not null references branches(id),
  note text null,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz null,
  assigned_by text null references users(id),
  active_from timestamptz not null default now(),
  active_to timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint: one active assignment per trainer per shift
create unique index if not exists uq_trainer_assignment_active
  on trainer_assignments (trainer_user_id, shift_id)
  where unassigned_at is null;

-- Index for querying assignments by trainer
create index if not exists idx_trainer_assignments_trainer
  on trainer_assignments (trainer_user_id);

-- Index for querying assignments by shift
create index if not exists idx_trainer_assignments_shift
  on trainer_assignments (shift_id);

-- Index for querying assignments by branch
create index if not exists idx_trainer_assignments_branch
  on trainer_assignments (branch_id);

-- Index for active assignments
create index if not exists idx_trainer_assignments_active
  on trainer_assignments (shift_id, trainer_user_id)
  where unassigned_at is null;

-- Add comment to document the business rules
comment on table shifts is 'Daily training shifts with fixed time slots. Max 3 coaches per shift, minimum 1 coach required.';
comment on table trainer_assignments is 'Coach assignments to shifts. Coaches can self-assign/unassign before shift starts.';
