const fs = require('node:fs/promises') as typeof import('node:fs/promises');
const path = require('node:path') as typeof import('node:path');
const { Pool: PgPool } = require('pg') as typeof import('pg');
const { loadEnv } = require('../src/shared/load-env') as typeof import('../src/shared/load-env');
const { Argon2PasswordHasher } = require('../src/shared/security/argon2-password-hasher') as typeof import('../src/shared/security/argon2-password-hasher');

type Row = Record<string, string>;
type PoolClient = import('pg').PoolClient;

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

loadEnv();

function color(name: keyof typeof COLORS, value: string): string {
  return `${COLORS[name]}${value}${COLORS.reset}`;
}

function parseArgs(): { baseDir: string } {
  const args = process.argv.slice(2);
  const dirIndex = args.findIndex((item) => item === '--dir');
  if (dirIndex >= 0 && args[dirIndex + 1]) {
    return { baseDir: path.resolve(process.cwd(), args[dirIndex + 1]) };
  }
  return { baseDir: path.resolve(process.cwd(), 'docs', 'import-templates') };
}

function ensureEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseCsv(content: string): Row[] {
  const rows: string[][] = [];
  let currentField = '';
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (!rows.length) return [];

  const headers = rows[0].map((item) => item.trim());
  return rows.slice(1).map((cells) => {
    const row: Row = {};
    headers.forEach((header, index) => {
      row[header] = String(cells[index] ?? '').trim();
    });
    return row;
  });
}

async function loadCsv(baseDir: string, fileName: string): Promise<Row[]> {
  const filePath = path.join(baseDir, fileName);
  const content = await fs.readFile(filePath, 'utf8');
  return parseCsv(content);
}

function normalizeIdPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function ensureRoles(client: PoolClient): Promise<void> {
  await client.query(
    `insert into roles (id, code, name)
     values
       ('role-guest', 'GUEST', 'Guest'),
       ('role-member', 'MEMBER', 'Member'),
       ('role-manager', 'MANAGER', 'Manager'),
       ('role-admin', 'ADMIN', 'Admin')
     on conflict (code) do update set name = excluded.name`
  );
}

async function importBranches(client: PoolClient, branches: Row[]): Promise<Map<string, string>> {
  const branchIds = new Map<string, string>();
  for (const row of branches) {
    const branchId = `import-branch-${normalizeIdPart(row.branch_code)}`;
    branchIds.set(row.branch_code, branchId);
    await client.query(
      `insert into branches (id, code, name, address, phone_number, status, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, now(), now())
       on conflict (code) do update
       set name = excluded.name,
           address = excluded.address,
           phone_number = excluded.phone_number,
           status = excluded.status,
           updated_at = excluded.updated_at`,
      [branchId, row.branch_code, row.branch_name, row.address, row.phone_number || null, row.status]
    );
  }
  return branchIds;
}

async function importMembershipPlans(client: PoolClient, plans: Row[]): Promise<Map<string, string>> {
  const planIds = new Map<string, string>();
  for (const row of plans) {
    const planId = `import-plan-${normalizeIdPart(row.plan_code)}`;
    planIds.set(row.plan_code, planId);
    await client.query(
      `insert into membership_plans (id, code, name, price, duration_days, total_sessions, is_active, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, now())
       on conflict (code) do update
       set name = excluded.name,
           price = excluded.price,
           duration_days = excluded.duration_days,
           total_sessions = excluded.total_sessions,
           is_active = excluded.is_active`,
      [
        planId,
        row.plan_code,
        row.plan_name,
        Number(row.price),
        Number(row.duration_days),
        Number(row.total_sessions),
        row.is_active.toLowerCase() === 'true',
      ]
    );
  }
  return planIds;
}

async function ensureRoleAssignment(client: PoolClient, assignmentId: string, userId: string, roleId: string, branchId: string | null): Promise<void> {
  const existing = await client.query(
    `select id from user_role_assignments
     where user_id = $1 and role_id = $2 and coalesce(branch_id, '') = coalesce($3, '')`,
    [userId, roleId, branchId]
  );
  if (existing.rowCount) return;
  await client.query(
    `insert into user_role_assignments (id, user_id, role_id, branch_id, assigned_at)
     values ($1, $2, $3, $4, now())`,
    [assignmentId, userId, roleId, branchId]
  );
}

async function importUsers(client: PoolClient, users: Row[], branchIds: Map<string, string>): Promise<Map<string, string>> {
  const hasher = new Argon2PasswordHasher();
  const importedPassword = process.env.IMPORTED_USER_PASSWORD || 'ChangeMe123!';
  const passwordHash = await hasher.hash(importedPassword);
  const userIds = new Map<string, string>();

  for (const row of users) {
    const userId = `import-user-${normalizeIdPart(row.email)}`;
    const profileId = `import-profile-${normalizeIdPart(row.email)}`;
    const branchId = row.home_branch_code ? branchIds.get(row.home_branch_code) ?? null : null;
    userIds.set(row.email, userId);

    await client.query(
      `insert into users (id, email, password_hash, status, email_verified_at, created_at, updated_at)
       values ($1, $2, $3, $4, now(), now(), now())
       on conflict (email) do update
       set status = excluded.status,
           updated_at = excluded.updated_at`,
      [userId, row.email, passwordHash, row.status]
    );

    await client.query(
      `insert into profiles (id, user_id, full_name, created_at, updated_at)
       values ($1, $2, $3, now(), now())
       on conflict (id) do update
       set full_name = excluded.full_name,
           updated_at = excluded.updated_at`,
      [profileId, userId, row.full_name]
    );

    const roleIdMap: Record<string, string> = {
      ADMIN: 'role-admin',
      MANAGER: 'role-manager',
      MEMBER: 'role-member',
      GUEST: 'role-guest',
    };
    const roleId = roleIdMap[row.primary_role];
    await ensureRoleAssignment(client, `import-ura-${normalizeIdPart(row.email)}-${normalizeIdPart(row.primary_role)}-global`, userId, roleId, null);

    if (branchId && ['MANAGER', 'MEMBER', 'GUEST'].includes(row.primary_role)) {
      await ensureRoleAssignment(client, `import-ura-${normalizeIdPart(row.email)}-${normalizeIdPart(row.primary_role)}-${normalizeIdPart(row.home_branch_code)}`, userId, roleId, branchId);
    }

    if (row.primary_role === 'MANAGER' && branchId) {
      await client.query(
        `insert into branch_manager_assignments (id, branch_id, manager_user_id, active_from, active_to, created_at)
         values ($1, $2, $3, now(), null, now())
         on conflict do nothing`,
        [`import-bma-${normalizeIdPart(row.email)}-${normalizeIdPart(row.home_branch_code)}`, branchId, userId]
      );
    }
  }

  return userIds;
}

async function importTrialBookings(
  client: PoolClient,
  trials: Row[],
  branchIds: Map<string, string>,
  userIds: Map<string, string>,
  planIds: Map<string, string>,
  usersByEmail: Map<string, Row>
): Promise<void> {
  for (const row of trials) {
    const branchId = branchIds.get(row.branch_code);
    const userId = userIds.get(row.user_email);
    const planId = planIds.get(row.membership_plan_code);
    const trialId = row.external_id;
    const userRow = usersByEmail.get(row.user_email);
    const fullName = userRow?.full_name || row.user_email;

    await client.query(
      `insert into trial_bookings (
          id, guest_user_id, full_name, phone_number, email, branch_id,
          trial_plan_name, scheduled_at, status, notes,
          converted_subscription_id, converted_at, created_at, updated_at
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, null, null, now(), now())
       on conflict (id) do update
       set guest_user_id = excluded.guest_user_id,
           full_name = excluded.full_name,
           phone_number = excluded.phone_number,
           email = excluded.email,
           branch_id = excluded.branch_id,
           trial_plan_name = excluded.trial_plan_name,
           scheduled_at = excluded.scheduled_at,
           status = excluded.status,
           notes = excluded.notes,
           updated_at = excluded.updated_at`,
      [
        trialId,
        userId ?? null,
        fullName,
        row.phone_number,
        row.user_email,
        branchId,
        row.trial_plan_name,
        new Date(row.scheduled_at),
        row.status,
        row.notes || null,
      ]
    );

    const historyId = `import-trial-history-${normalizeIdPart(trialId)}-${normalizeIdPart(row.status)}`;
    const changedBy = userId ?? 'user-admin-1';
    const existing = await client.query(
      `select id from trial_status_history where id = $1`,
      [historyId]
    );
    if (!existing.rowCount) {
      await client.query(
        `insert into trial_status_history (id, trial_booking_id, from_status, to_status, changed_by, created_at)
         values ($1, $2, null, $3, $4, now())`,
        [historyId, trialId, row.status, changedBy]
      );
    }

    if (!planId) {
      // plan is validated upstream; keep no-op to show intent
    }
  }
}

async function main(): Promise<void> {
  const { baseDir } = parseArgs();
  const databaseUrl = ensureEnv('DATABASE_URL');
  const pool = new PgPool({ connectionString: databaseUrl, max: 4, idleTimeoutMillis: 10000 });

  process.stdout.write(`${color('cyan', 'CSV Import To PostgreSQL')}\n`);
  process.stdout.write(`Directory: ${baseDir}\n`);

  try {
    const [branches, users, plans, trials] = await Promise.all([
      loadCsv(baseDir, 'branches.csv'),
      loadCsv(baseDir, 'users.csv'),
      loadCsv(baseDir, 'membership-plans.csv'),
      loadCsv(baseDir, 'trial-bookings.csv'),
    ]);

    const usersByEmail = new Map(users.map((row) => [row.email, row]));
    const client = await pool.connect();
    try {
      await client.query('begin');
      await ensureRoles(client);
      const branchIds = await importBranches(client, branches);
      process.stdout.write(`${color('green', '✅')} Imported/upserted ${branches.length} branches\n`);

      const planIds = await importMembershipPlans(client, plans);
      process.stdout.write(`${color('green', '✅')} Imported/upserted ${plans.length} membership plans\n`);

      const userIds = await importUsers(client, users, branchIds);
      process.stdout.write(`${color('green', '✅')} Imported/upserted ${users.length} users\n`);

      await importTrialBookings(client, trials, branchIds, userIds, planIds, usersByEmail);
      process.stdout.write(`${color('green', '✅')} Imported/upserted ${trials.length} trial bookings\n`);

      await client.query('commit');
      process.stdout.write(`${color('green', '✅')} Import committed successfully\n`);
      process.stdout.write(`${color('yellow', '⚠️')} Imported users use shared temp password from IMPORTED_USER_PASSWORD or default ChangeMe123!\n`);
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    process.stderr.write(`${color('red', '❌ Import failed')}\n`);
    process.stderr.write(`${String(error instanceof Error ? error.stack ?? error.message : error)}\n`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();


