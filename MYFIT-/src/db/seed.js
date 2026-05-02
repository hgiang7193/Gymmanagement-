const { loadEnv } = require('../shared/load-env');
const argon2 = require('argon2');
const { createPostgresPool } = require('../shared/infrastructure/postgres/pool');

loadEnv();

async function upsertUser(pool, { preferredId, email, passwordHash, now }) {
  const result = await pool.query(
    `insert into users (id, email, password_hash, status, email_verified_at, created_at, updated_at)
     values ($1, $2, $3, 'ACTIVE', $4, $4, $4)
     on conflict (email) do update
     set password_hash = excluded.password_hash,
         status = excluded.status,
         email_verified_at = excluded.email_verified_at,
         updated_at = excluded.updated_at
     returning id`,
    [preferredId, email, passwordHash, now]
  );
  return result.rows[0].id;
}

async function upsertBranch(pool, branch, now) {
  const result = await pool.query(
    `insert into branches (id, code, name, address, phone_number, status, created_at, updated_at)
     values ($1, $2, $3, $4, null, 'ACTIVE', $5, $5)
     on conflict (code) do update
     set name = excluded.name,
         address = excluded.address,
         status = excluded.status,
         updated_at = excluded.updated_at
     returning id`,
    [branch.id, branch.code, branch.name, branch.address, now]
  );
  return result.rows[0].id;
}

async function upsertMembershipPlan(pool, membershipPlan, now) {
  const result = await pool.query(
    `insert into membership_plans (id, code, name, price, duration_days, total_sessions, is_active, created_at)
     values ($1, $2, $3, $4, $5, $6, true, $7)
     on conflict (code) do update
     set name = excluded.name,
         price = excluded.price,
         duration_days = excluded.duration_days,
         total_sessions = excluded.total_sessions,
         is_active = excluded.is_active
     returning id`,
    [
      membershipPlan.id,
      membershipPlan.code,
      membershipPlan.name,
      membershipPlan.price,
      membershipPlan.durationDays,
      membershipPlan.totalSessions,
      now,
    ]
  );
  return result.rows[0].id;
}

async function seedDatabase(options = {}) {
  const shouldClosePool = !options.pool;
  const pool = options.pool ?? createPostgresPool(options.connectionString ?? process.env.DATABASE_URL);
  const now = options.now ?? new Date();

  const adminEmail = options.adminEmail ?? process.env.SEED_ADMIN_EMAIL ?? 'admin@myfit.local';
  const managerEmail = options.managerEmail ?? process.env.SEED_MANAGER_EMAIL ?? 'manager@myfit.local';
  const adminPasswordHash = options.adminPasswordHash ?? await argon2.hash(process.env.SEED_ADMIN_PASSWORD ?? 'AdminPass123');
  const managerPasswordHash = options.managerPasswordHash ?? await argon2.hash(process.env.SEED_MANAGER_PASSWORD ?? 'ManagerPass123');

  const branch = {
    id: 'branch-seed-hcm-q1',
    code: process.env.SEED_BRANCH_CODE ?? 'HCM-Q1',
    name: process.env.SEED_BRANCH_NAME ?? 'MYFIT Q1',
    address: process.env.SEED_BRANCH_ADDRESS ?? 'District 1',
  };

  const membershipPlan = {
    id: 'plan-basic-1',
    code: process.env.SEED_PLAN_CODE ?? 'BASIC-12',
    name: process.env.SEED_PLAN_NAME ?? 'Basic 12 Sessions',
    price: Number(process.env.SEED_PLAN_PRICE ?? 1200000),
    durationDays: Number(process.env.SEED_PLAN_DURATION_DAYS ?? 30),
    totalSessions: Number(process.env.SEED_PLAN_TOTAL_SESSIONS ?? 12),
  };

  try {
    await pool.query(
      `insert into roles (id, code, name)
       values
         ('role-guest', 'GUEST', 'Guest'),
         ('role-member', 'MEMBER', 'Member'),
         ('role-manager', 'MANAGER', 'Manager'),
         ('role-admin', 'ADMIN', 'Admin'),
         ('role-coach', 'COACH', 'Coach')
       on conflict (code) do update set name = excluded.name`
    );

    const adminUserId = await upsertUser(pool, {
      preferredId: 'user-admin-1',
      email: adminEmail,
      passwordHash: adminPasswordHash,
      now,
    });
    const managerUserId = await upsertUser(pool, {
      preferredId: 'user-manager-1',
      email: managerEmail,
      passwordHash: managerPasswordHash,
      now,
    });

    await pool.query(
      `insert into profiles (id, user_id, full_name, created_at, updated_at)
       values
         ('profile-user-admin-1', $2, 'System Admin', $1, $1),
         ('profile-user-manager-1', $3, 'Branch Manager', $1, $1)
       on conflict (id) do update
       set user_id = excluded.user_id,
           full_name = excluded.full_name,
           updated_at = excluded.updated_at`,
      [now, adminUserId, managerUserId]
    );

    await pool.query(
      `insert into user_role_assignments (id, user_id, role_id, branch_id, assigned_at)
       select $1, $2, 'role-admin', null, $3
       where not exists (
         select 1 from user_role_assignments
         where user_id = $2 and role_id = 'role-admin' and branch_id is null
       )`,
      ['ura-admin-seed', adminUserId, now]
    );

    await pool.query(
      `insert into user_role_assignments (id, user_id, role_id, branch_id, assigned_at)
       select $1, $2, 'role-manager', null, $3
       where not exists (
         select 1 from user_role_assignments
         where user_id = $2 and role_id = 'role-manager' and branch_id is null
       )`,
      ['ura-manager-seed', managerUserId, now]
    );

    const branchId = await upsertBranch(pool, branch, now);

    await pool.query(
      `insert into branch_manager_assignments (id, branch_id, manager_user_id, active_from, active_to, created_at)
       select $1, $2, $3, $4, null, $4
       where not exists (
         select 1 from branch_manager_assignments
         where branch_id = $2 and manager_user_id = $3 and active_to is null
       )`,
      ['bma-seed-hcm-q1', branchId, managerUserId, now]
    );

    await upsertMembershipPlan(pool, membershipPlan, now);
  } finally {
    if (shouldClosePool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.stdout.write('Database seed completed.\n');
    })
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}

module.exports = { seedDatabase };
