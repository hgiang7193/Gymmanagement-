-- ==========================================
-- COURSE ENROLLMENTS & CLASS MANAGEMENT
-- ==========================================

-- Course packages (30, 60, 120 sessions)
create table if not exists course_packages (
  id text primary key,
  code text unique not null, -- 'COURSE-30', 'COURSE-60', 'COURSE-120'
  name text not null, -- 'Gói 30 buổi', 'Gói 60 buổi', 'Gói 120 buổi'
  total_sessions integer not null, -- 30, 60, or 120
  price_per_session bigint not null, -- Price per session (decreases with larger packages)
  total_price bigint not null, -- total_sessions * price_per_session
  description text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Member course enrollments
create table if not exists course_enrollments (
  id text primary key,
  user_id text not null references users(id),
  course_package_id text not null references course_packages(id),
  branch_id text not null references branches(id),
  status text not null default 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED, EXPIRED
  enrolled_at timestamptz not null default now(),
  started_at timestamptz null,
  completed_at timestamptz null,
  expires_at timestamptz null, -- Optional: course must be completed within X days
  total_sessions integer not null,
  sessions_attended integer not null default 0,
  sessions_remaining integer not null,
  created_by text not null references users(id), -- Manager who enrolled the member
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for querying active enrollments
create index if not exists idx_course_enrollments_user_status
  on course_enrollments (user_id, status);

-- Index for querying enrollments by branch
create index if not exists idx_course_enrollments_branch
  on course_enrollments (branch_id);

-- Class attendance records (điểm danh từng buổi)
create table if not exists class_attendance (
  id text primary key,
  enrollment_id text not null references course_enrollments(id),
  user_id text not null references users(id),
  shift_id text not null references shifts(id),
  branch_id text not null references branches(id),
  attended_at timestamptz not null default now(),
  check_in_time timestamptz not null, -- When member checked in
  status text not null default 'PRESENT', -- PRESENT, ABSENT, LATE, CANCELLED
  notes text null,
  created_by text null references users(id), -- Staff who checked in member
  created_at timestamptz not null default now()
);

-- Unique constraint: one attendance record per user per shift
create unique index if not exists uq_class_attendance_user_shift
  on class_attendance (user_id, shift_id);

-- Index for querying attendance by enrollment
create index if not exists idx_class_attendance_enrollment
  on class_attendance (enrollment_id);

-- Index for querying attendance by shift
create index if not exists idx_class_attendance_shift
  on class_attendance (shift_id);

-- ==========================================
-- BODY MEASUREMENTS LOCKING
-- ==========================================

-- Add lock mechanism to body_measurements
alter table member_body_measurements 
  add column if not exists shift_id text null references shifts(id),
  add column if not exists is_locked boolean not null default false,
  add column if not exists locked_at timestamptz null;

-- Create index for locked measurements
create index if not exists idx_body_measurements_shift
  on member_body_measurements (shift_id)
  where shift_id is not null;

-- ==========================================
-- COACH SHIFT LOCKING (AFTER SHIFT ENDS)
-- ==========================================

-- Add trigger function to lock coach assignments after shift ends
-- This will be enforced at application level, but we add columns for tracking
alter table trainer_assignments
  add column if not exists is_locked boolean not null default false,
  add column if not exists locked_at timestamptz null;

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================

comment on table course_packages is 'Course packages with different session counts (30 or 60 sessions). Price per session decreases with larger packages.';
comment on table course_enrollments is 'Member enrollments in course packages. Tracks sessions attended and remaining.';
comment on table class_attendance is 'Daily attendance records for each class session. Created when member checks in.';
comment on column member_body_measurements.shift_id is 'Links measurements to specific training session for audit trail.';
comment on column member_body_measurements.is_locked is 'True when shift has ended. Measurements cannot be modified after lock.';
comment on column trainer_assignments.is_locked is 'True when shift has ended. Assignment cannot be modified after lock.';
