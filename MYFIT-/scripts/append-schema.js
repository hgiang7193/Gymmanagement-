const fs = require('fs');

const extraSql = `
-- ==========================================
-- COURSE & SHIFT MANAGEMENT (WS3.3)
-- ==========================================

create table if not exists course_packages (
  id text primary key,
  code text unique not null,
  name text not null,
  price bigint not null,
  total_sessions integer not null,
  is_active boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists course_enrollments (
  id text primary key,
  user_id text not null references users(id),
  course_package_id text not null references course_packages(id),
  branch_id text not null references branches(id),
  status text not null,
  enrolled_at timestamptz not null,
  total_sessions integer not null,
  sessions_used integer not null,
  sessions_remaining integer not null,
  enrolled_by text not null references users(id)
);

create table if not exists shifts (
  id text primary key,
  branch_id text not null references branches(id),
  shift_code text not null,
  date date not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  coach_capacity integer not null default 1,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint uq_shift_branch_date_code unique (branch_id, date, shift_code)
);

create table if not exists trainer_assignments (
  id text primary key,
  shift_id text not null references shifts(id),
  coach_id text not null references users(id),
  note text null,
  created_at timestamptz not null,
  constraint uq_coach_shift unique (shift_id, coach_id)
);

create table if not exists class_attendance (
  id text primary key,
  course_enrollment_id text not null references course_enrollments(id),
  user_id text not null references users(id),
  shift_id text not null references shifts(id),
  branch_id text not null references branches(id),
  attended_at timestamptz not null,
  recorded_by text not null references users(id),
  constraint uq_class_attendance unique (course_enrollment_id, shift_id)
);

-- ==========================================
-- BILLING SNAPSHOTS (WS3.1)
-- ==========================================

create table if not exists invoice_line_items (
  id text primary key,
  invoice_id text not null references invoices(id) on delete cascade,
  item_type text not null,
  item_id text null,
  item_name text not null,
  unit_price bigint not null,
  quantity integer not null default 1,
  subtotal bigint not null,
  created_at timestamptz not null
);
`;

fs.appendFileSync('src/db/schema.sql', extraSql);
console.log('Appended schema.sql');
