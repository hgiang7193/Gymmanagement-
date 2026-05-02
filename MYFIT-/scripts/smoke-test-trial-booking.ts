const { randomUUID } = require('node:crypto') as typeof import('node:crypto');
const { Pool: PgPool } = require('pg') as typeof import('pg');
const { loadEnv } = require('../src/shared/load-env') as typeof import('../src/shared/load-env');
const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
const { createApp } = require('../src/app') as typeof import('../src/app');

type Pool = import('pg').Pool;
type PoolClient = import('pg').PoolClient;
type AppInstance = ReturnType<typeof createApp>;
type HttpMethod = 'GET' | 'POST' | 'PATCH';

type Result = { passes: number; warnings: number; failures: number };

type Context = Result & {
  runId: string;
  pool: Pool;
  app: AppInstance | null;
  baseUrl: string;
  ids: Record<string, string[]>;
};

type ApiResponse<T> = {
  status: number;
  body: {
    data: T | null;
    error: { code?: string; message?: string } | null;
    meta?: Record<string, unknown>;
  };
};

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

loadEnv();

const BASELINE: Record<string, string[]> = {
  users: ['id', 'email', 'password_hash', 'status', 'email_verified_at', 'created_at', 'updated_at'],
  profiles: ['id', 'user_id', 'full_name', 'created_at', 'updated_at'],
  roles: ['id', 'code', 'name'],
  user_role_assignments: ['id', 'user_id', 'role_id', 'branch_id', 'assigned_at'],
  refresh_sessions: ['id', 'user_id', 'token', 'revoked_at', 'created_at'],
  password_reset_tokens: ['id', 'user_id', 'token', 'expires_at', 'used_at', 'created_at'],
  branches: ['id', 'code', 'name', 'address', 'phone_number', 'status', 'created_at', 'updated_at'],
  branch_manager_assignments: ['id', 'branch_id', 'manager_user_id', 'active_from', 'active_to', 'created_at'],
  membership_plans: ['id', 'code', 'name', 'price', 'duration_days', 'total_sessions', 'is_active', 'created_at'],
  subscriptions: ['id', 'user_id', 'membership_plan_id', 'home_branch_id', 'status', 'started_at', 'expires_at', 'total_sessions', 'sessions_used', 'sessions_remaining', 'activated_by', 'activated_at'],
  subscription_status_history: ['id', 'subscription_id', 'from_status', 'to_status', 'changed_by', 'reason', 'created_at'],
  audit_logs: ['id', 'actor_user_id', 'action_code', 'entity_type', 'entity_id', 'branch_id', 'metadata_json', 'created_at'],
  security_events: ['id', 'user_id', 'event_type', 'severity', 'metadata_json', 'created_at'],
};

const TRIAL_BOOKING_COLUMNS = ['id', 'guest_user_id', 'full_name', 'phone_number', 'email', 'branch_id', 'trial_plan_name', 'scheduled_at', 'status', 'notes', 'converted_subscription_id', 'converted_at', 'created_at', 'updated_at'];
const TRIAL_HISTORY_COLUMNS = ['id', 'trial_booking_id', 'from_status', 'to_status', 'changed_by', 'created_at'];

function color(name: keyof typeof C, value: string): string {
  return `${C[name]}${value}${C.reset}`;
}

function info(title: string): void {
  process.stdout.write(`\n${color('cyan', title)}\n`);
}

function pass(ctx: Context, message: string): void {
  ctx.passes += 1;
  process.stdout.write(`${color('green', 'âœ…')} ${message}\n`);
}

function warn(ctx: Context, message: string): void {
  ctx.warnings += 1;
  process.stdout.write(`${color('yellow', 'âš ï¸')} ${message}\n`);
}

function fail(ctx: Context, message: string, error?: unknown): void {
  ctx.failures += 1;
  process.stdout.write(`${color('red', 'âŒ')} ${message}\n`);
  if (error) process.stdout.write(`${color('gray', `   ${formatError(error)}`)}\n`);
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message;
  return String(error);
}

function ensureEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function envOrDefault(name: string, fallback: string): string {
  if (!process.env[name]) process.env[name] = fallback;
  return process.env[name] as string;
}

function makeId(ctx: Context, prefix: string): string {
  return `${prefix}-${ctx.runId}-${randomUUID().slice(0, 8)}`;
}

function pushId(ctx: Context, bucket: string, value: string): string {
  ctx.ids[bucket].push(value);
  return value;
}

async function rows<T extends Record<string, unknown>>(pool: Pool, sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

async function one<T extends Record<string, unknown>>(pool: Pool, sql: string, params: unknown[] = []): Promise<T | null> {
  const result = await pool.query<T>(sql, params);
  return result.rows[0] ?? null;
}

function token(userId: string, primaryRole: string, branchIds: string[] = []): string {
  return jwt.sign(
    { sub: userId, primaryRole, branchIds, type: 'access' },
    envOrDefault('ACCESS_TOKEN_SECRET', 'smoke-access-secret'),
    { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' }
  );
}

async function api<T>(ctx: Context, method: HttpMethod, path: string, options: { token?: string; body?: Record<string, unknown> } = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  const response = await fetch(`${ctx.baseUrl}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return { status: response.status, body: await response.json() };
}

function createContext(pool: Pool): Context {
  return {
    runId: Date.now().toString(36),
    pool,
    app: null,
    baseUrl: '',
    passes: 0,
    warnings: 0,
    failures: 0,
    ids: {
      users: [],
      profiles: [],
      user_role_assignments: [],
      branches: [],
      branch_manager_assignments: [],
      membership_plans: [],
      subscriptions: [],
      trial_bookings: [],
    },
  };
}

async function ensureRoles(pool: Pool): Promise<void> {
  await pool.query(
    `insert into roles (id, code, name)
     values
       ('role-guest', 'GUEST', 'Guest'),
       ('role-member', 'MEMBER', 'Member'),
       ('role-manager', 'MANAGER', 'Manager'),
       ('role-admin', 'ADMIN', 'Admin')
     on conflict (code) do update set name = excluded.name`
  );
}

async function createUser(ctx: Context, email: string, fullName: string, status = 'ACTIVE'): Promise<string> {
  const userId = pushId(ctx, 'users', makeId(ctx, 'user'));
  const profileId = pushId(ctx, 'profiles', makeId(ctx, 'profile'));
  const now = new Date();
  await ctx.pool.query(
    `insert into users (id, email, password_hash, status, email_verified_at, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $5, $5)`,
    [userId, email, 'smoke-password-hash', status, now]
  );
  await ctx.pool.query(
    `insert into profiles (id, user_id, full_name, created_at, updated_at)
     values ($1, $2, $3, $4, $4)`,
    [profileId, userId, fullName, now]
  );
  return userId;
}

async function assignRole(ctx: Context, userId: string, roleId: string, branchId: string | null = null): Promise<void> {
  const id = pushId(ctx, 'user_role_assignments', makeId(ctx, 'ura'));
  await ctx.pool.query(
    `insert into user_role_assignments (id, user_id, role_id, branch_id, assigned_at)
     values ($1, $2, $3, $4, $5)`,
    [id, userId, roleId, branchId, new Date()]
  );
}

async function createBranch(ctx: Context, code: string, name: string): Promise<string> {
  const id = pushId(ctx, 'branches', makeId(ctx, 'branch'));
  const now = new Date();
  await ctx.pool.query(
    `insert into branches (id, code, name, address, phone_number, status, created_at, updated_at)
     values ($1, $2, $3, $4, null, 'ACTIVE', $5, $5)`,
    [id, code, name, `${name} Address`, now]
  );
  return id;
}

async function assignManager(ctx: Context, managerUserId: string, branchId: string): Promise<void> {
  const id = pushId(ctx, 'branch_manager_assignments', makeId(ctx, 'bma'));
  await ctx.pool.query(
    `insert into branch_manager_assignments (id, branch_id, manager_user_id, active_from, active_to, created_at)
     values ($1, $2, $3, $4, null, $4)`,
    [id, branchId, managerUserId, new Date()]
  );
}

async function createPlan(ctx: Context, code: string, name: string): Promise<string> {
  const id = pushId(ctx, 'membership_plans', makeId(ctx, 'plan'));
  await ctx.pool.query(
    `insert into membership_plans (id, code, name, price, duration_days, total_sessions, is_active, created_at)
     values ($1, $2, $3, 1000000, 30, 12, true, $4)`,
    [id, code, name, new Date()]
  );
  return id;
}

async function createSubscription(
  ctx: Context,
  userId: string,
  planId: string,
  branchId: string,
  status: string,
  activatedBy: string,
  startedAt: Date,
  expiresAt: Date
): Promise<string> {
  const id = pushId(ctx, 'subscriptions', makeId(ctx, 'subscription'));
  await ctx.pool.query(
    `insert into subscriptions (
        id, user_id, membership_plan_id, home_branch_id, status,
        started_at, expires_at, total_sessions, sessions_used, sessions_remaining,
        activated_by, activated_at
     ) values ($1, $2, $3, $4, $5, $6, $7, 12, 0, 12, $8, $6)`,
    [id, userId, planId, branchId, status, startedAt, expiresAt, activatedBy]
  );
  return id;
}

async function createTrialRecord(ctx: Context, guestUserId: string, branchId: string, email: string, fullName: string, phoneNumber: string): Promise<string> {
  const id = pushId(ctx, 'trial_bookings', makeId(ctx, 'trial'));
  const now = new Date();
  await ctx.pool.query(
    `insert into trial_bookings (
        id, guest_user_id, full_name, phone_number, email, branch_id,
        trial_plan_name, scheduled_at, status, notes,
        converted_subscription_id, converted_at, created_at, updated_at
     ) values ($1, $2, $3, $4, $5, $6, '3-Day Trial', $7, 'BOOKED', null, null, null, $7, $7)`,
    [id, guestUserId, fullName, phoneNumber, email, branchId, now]
  );
  return id;
}

async function startAppInProcess(ctx: Context): Promise<void> {
  envOrDefault('ACCESS_TOKEN_SECRET', 'smoke-access-secret');
  envOrDefault('REFRESH_TOKEN_SECRET', 'smoke-refresh-secret');
  ctx.app = createApp();
  await ctx.app.start();
  ctx.baseUrl = ctx.app.baseUrl;
}

async function stopAppInProcess(ctx: Context): Promise<void> {
  if (ctx.app) await ctx.app.stop();
}

async function columns(pool: Pool, tableName: string): Promise<string[]> {
  const result = await rows<{ column_name: string }>(
    pool,
    `select column_name
     from information_schema.columns
     where table_schema = 'public' and table_name = $1
     order by ordinal_position`,
    [tableName]
  );
  return result.map((item) => item.column_name);
}

function missing(actual: string[], expected: string[]): string[] {
  return expected.filter((value) => !actual.includes(value));
}

async function testDatabaseMigrations(ctx: Context): Promise<void> {
  info('1. DATABASE MIGRATIONS VALIDATION');

  try {
    const values = await columns(ctx.pool, 'trial_bookings');
    const diff = missing(values, TRIAL_BOOKING_COLUMNS);
    if (diff.length) throw new Error(`trial_bookings missing: ${diff.join(', ')}`);
    pass(ctx, 'trial_bookings tá»“n táº¡i vÃ  Ä‘Ãºng schema cá»‘t lÃµi');
  } catch (error) {
    fail(ctx, 'trial_bookings schema validation failed', error);
  }

  try {
    const values = await columns(ctx.pool, 'trial_status_history');
    const diff = missing(values, TRIAL_HISTORY_COLUMNS);
    if (diff.length) throw new Error(`trial_status_history missing: ${diff.join(', ')}`);
    pass(ctx, 'trial_status_history tá»“n táº¡i');
  } catch (error) {
    fail(ctx, 'trial_status_history validation failed', error);
  }

  try {
    const indexRow = await one<{ indexdef: string }>(
      ctx.pool,
      `select indexdef from pg_indexes
       where schemaname = 'public'
         and tablename = 'branch_manager_assignments'
         and indexname = 'uq_branch_manager_assignment_active'`
    );
    if (!indexRow) throw new Error('unique partial index not found');
    if (!indexRow.indexdef.includes('branch_id, manager_user_id') || !indexRow.indexdef.toLowerCase().includes('where (active_to is null)')) {
      throw new Error(indexRow.indexdef);
    }
    pass(ctx, 'unique partial index cho manager assignment tá»“n táº¡i');
  } catch (error) {
    fail(ctx, 'manager assignment partial index validation failed', error);
  }

  try {
    for (const [tableName, expectedColumns] of Object.entries(BASELINE)) {
      const values = await columns(ctx.pool, tableName);
      const diff = missing(values, expectedColumns);
      if (diff.length) throw new Error(`${tableName} missing baseline columns: ${diff.join(', ')}`);
    }
    pass(ctx, 'khÃ´ng tháº¥y table/column baseline bá»‹ drop');
  } catch (error) {
    fail(ctx, 'baseline schema compatibility failed', error);
  }
}

async function testApiContracts(ctx: Context): Promise<void> {
  info('2. API CONTRACTS (NO BREAKING CHANGE)');
  const branchId = await createBranch(ctx, `SMOKE-BRANCH-${ctx.runId}-API`, 'Smoke API Branch');
  const planId = await createPlan(ctx, `SMOKE-PLAN-${ctx.runId}-API`, 'Smoke API Plan');
  const memberId = await createUser(ctx, `member-api-${ctx.runId}@example.com`, 'Smoke Member');
  const managerId = await createUser(ctx, `manager-api-${ctx.runId}@example.com`, 'Smoke Manager');
  const adminId = await createUser(ctx, `admin-api-${ctx.runId}@example.com`, 'Smoke Admin');

  await assignRole(ctx, memberId, 'role-member', branchId);
  await assignRole(ctx, managerId, 'role-manager', branchId);
  await assignRole(ctx, adminId, 'role-admin', null);
  await assignManager(ctx, managerId, branchId);
  await createSubscription(ctx, memberId, planId, branchId, 'ACTIVE', adminId, new Date(Date.now() - 86400000), new Date(Date.now() + 86400000 * 7));

  try {
    const response = await api<Record<string, unknown>>(ctx, 'GET', '/api/v1/memberships/me', { token: token(memberId, 'MEMBER', [branchId]) });
    if (response.status !== 200 || !response.body.data) throw new Error(`status=${response.status} body=${JSON.stringify(response.body)}`);
    const diff = ['status', 'membershipPlanId', 'homeBranchId'].filter((field) => !(field in response.body.data!));
    if (diff.length) throw new Error(`missing fields: ${diff.join(', ')}`);
    pass(ctx, 'GET /api/v1/memberships/me váº«n hoáº¡t Ä‘á»™ng');
  } catch (error) {
    fail(ctx, 'legacy memberships/me contract failed', error);
    try {
      const fallback = await api<Record<string, unknown>>(ctx, 'GET', '/api/v1/me/subscription', { token: token(memberId, 'MEMBER', [branchId]) });
      if (fallback.status === 200) warn(ctx, 'endpoint má»›i /api/v1/me/subscription cÃ²n hoáº¡t Ä‘á»™ng nhÆ°ng endpoint cÅ© Ä‘Ã£ vá»¡');
    } catch {}
  }

  try {
    const candidateId = await createUser(ctx, `candidate-api-${ctx.runId}@example.com`, 'Membership Candidate');
    const response = await api<Record<string, unknown>>(ctx, 'POST', '/api/v1/manager/memberships/activate', {
      token: token(managerId, 'MANAGER', [branchId]),
      body: { userId: candidateId, membershipPlanId: planId, homeBranchId: branchId },
    });
    if (response.status !== 201 || !response.body.data) throw new Error(`status=${response.status} body=${JSON.stringify(response.body)}`);
    const diff = ['id', 'userId', 'membershipPlanId', 'homeBranchId', 'status'].filter((field) => !(field in response.body.data!));
    if (diff.length) throw new Error(`missing fields: ${diff.join(', ')}`);
    pass(ctx, 'POST /api/v1/manager/memberships/activate váº«n hoáº¡t Ä‘á»™ng');
  } catch (error) {
    fail(ctx, 'membership activate contract failed', error);
  }

  try {
    const guestId = await createUser(ctx, `guest-api-${ctx.runId}@example.com`, 'Trial Guest');
    await assignRole(ctx, guestId, 'role-guest', null);
    const response = await api<Record<string, unknown>>(ctx, 'POST', '/api/v1/trials', {
      token: token(guestId, 'GUEST'),
      body: {
        branchId,
        trialPlanName: '3-Day Trial',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        phoneNumber: '0909000011',
        notes: 'Smoke test API',
      },
    });
    if (response.status !== 201 || !response.body.data) throw new Error(`status=${response.status} body=${JSON.stringify(response.body)}`);
    const diff = ['id', 'branchId', 'trialPlanName', 'scheduledAt', 'status'].filter((field) => !(field in response.body.data!));
    if (diff.length) throw new Error(`missing fields: ${diff.join(', ')}`);
    pass(ctx, 'trial endpoint má»›i tráº£ response Ä‘Ãºng spec cá»‘t lÃµi');
  } catch (error) {
    fail(ctx, 'trial endpoint contract failed', error);
  }
}

async function testMembershipLogic(ctx: Context): Promise<void> {
  info('3. MEMBERSHIP LOGIC (NO DUPLICATE ACTIVE SUBSCRIPTION)');
  const branchId = await createBranch(ctx, `SMOKE-BRANCH-${ctx.runId}-MEM`, 'Smoke Membership Branch');
  const planId = await createPlan(ctx, `SMOKE-PLAN-${ctx.runId}-MEM`, 'Smoke Membership Plan');
  const managerId = await createUser(ctx, `manager-mem-${ctx.runId}@example.com`, 'Membership Manager');
  await assignRole(ctx, managerId, 'role-manager', branchId);
  await assignManager(ctx, managerId, branchId);

  try {
    const userId = await createUser(ctx, `active-sub-${ctx.runId}@example.com`, 'Active Subscription User');
    await assignRole(ctx, userId, 'role-member', branchId);
    await createSubscription(ctx, userId, planId, branchId, 'ACTIVE', managerId, new Date(Date.now() - 86400000), new Date(Date.now() + 86400000 * 10));
    const response = await api<Record<string, unknown>>(ctx, 'POST', '/api/v1/trials', {
      token: token(userId, 'MEMBER', [branchId]),
      body: { branchId, trialPlanName: '3-Day Trial', scheduledAt: new Date(Date.now() + 3600000).toISOString(), phoneNumber: '0909000021' },
    });
    if (![400, 409].includes(response.status)) throw new Error(`expected 400/409, got ${response.status} body=${JSON.stringify(response.body)}`);
    pass(ctx, 'user cÃ³ active subscription bá»‹ cháº·n khi táº¡o trial');
  } catch (error) {
    fail(ctx, 'active subscription should reject trial creation', error);
  }

  try {
    const userId = await createUser(ctx, `expired-sub-${ctx.runId}@example.com`, 'Expired Subscription User');
    await assignRole(ctx, userId, 'role-member', branchId);
    await createSubscription(ctx, userId, planId, branchId, 'EXPIRED', managerId, new Date(Date.now() - 86400000 * 40), new Date(Date.now() - 86400000));
    const response = await api<Record<string, unknown>>(ctx, 'POST', '/api/v1/trials', {
      token: token(userId, 'MEMBER', [branchId]),
      body: { branchId, trialPlanName: '3-Day Trial', scheduledAt: new Date(Date.now() + 7200000).toISOString(), phoneNumber: '0909000022' },
    });
    if (response.status !== 201) throw new Error(`expected 201, got ${response.status} body=${JSON.stringify(response.body)}`);
    pass(ctx, 'user háº¿t háº¡n subscription táº¡o trial thÃ nh cÃ´ng');
  } catch (error) {
    fail(ctx, 'expired subscription should allow trial creation', error);
  }

  try {
    const userId = await createUser(ctx, `convert-sub-${ctx.runId}@example.com`, 'Convert Subscription User');
    await assignRole(ctx, userId, 'role-member', branchId);
    const oldId = await createSubscription(ctx, userId, planId, branchId, 'ACTIVE', managerId, new Date(Date.now() - 86400000 * 2), new Date(Date.now() + 86400000 * 5));
    const trialId = await createTrialRecord(ctx, userId, branchId, `convert-sub-${ctx.runId}@example.com`, 'Convert Subscription User', '0909000023');

    const legacy = await api<Record<string, unknown>>(ctx, 'POST', `/api/v1/trials/${trialId}/convert`, {
      token: token(managerId, 'MANAGER', [branchId]),
      body: { membershipPlanId: planId, homeBranchId: branchId },
    });
    let response = legacy;
    if (![200, 201].includes(legacy.status)) {
      fail(ctx, 'legacy POST /api/v1/trials/:id/convert failed', new Error(`status=${legacy.status} body=${JSON.stringify(legacy.body)}`));
      warn(ctx, 'tiáº¿p tá»¥c gá»i manager-scoped convert endpoint Ä‘á»ƒ láº¥y tÃ­n hiá»‡u cháº©n Ä‘oÃ¡n');
      response = await api<Record<string, unknown>>(ctx, 'POST', `/api/v1/manager/trials/${trialId}/convert`, {
        token: token(managerId, 'MANAGER', [branchId]),
        body: { membershipPlanId: planId, homeBranchId: branchId },
      });
    }
    if (![200, 201].includes(response.status)) throw new Error(`status=${response.status} body=${JSON.stringify(response.body)}`);

    const subscriptions = await rows<{ id: string; status: string }>(ctx.pool, `select id, status from subscriptions where user_id = $1 order by activated_at asc`, [userId]);
    const active = subscriptions.filter((item) => item.status === 'ACTIVE');
    const old = subscriptions.find((item) => item.id === oldId);
    if (active.length !== 1) throw new Error(`expected 1 active subscription, found ${active.length}`);
    if (old?.status === 'ACTIVE') throw new Error('old subscription still ACTIVE');
    pass(ctx, 'trial convert táº¡o subscription má»›i vÃ  deactivate subscription cÅ©');
  } catch (error) {
    fail(ctx, 'trial convert replacement logic failed', error);
  }
}

async function testBranchScopeIsolation(ctx: Context): Promise<void> {
  info('4. BRANCH SCOPE ISOLATION');
  const branchAId = await createBranch(ctx, `SMOKE-BRANCH-${ctx.runId}-A`, 'Smoke Branch A');
  const branchBId = await createBranch(ctx, `SMOKE-BRANCH-${ctx.runId}-B`, 'Smoke Branch B');
  const guestId = await createUser(ctx, `guest-scope-${ctx.runId}@example.com`, 'Scope Guest');
  const managerAId = await createUser(ctx, `manager-a-${ctx.runId}@example.com`, 'Manager A');
  await assignRole(ctx, guestId, 'role-guest', branchAId);
  await assignRole(ctx, managerAId, 'role-manager', branchAId);
  await assignManager(ctx, managerAId, branchAId);

  try {
    const response = await api<Record<string, unknown>>(ctx, 'POST', '/api/v1/trials', {
      token: token(guestId, 'GUEST', [branchAId]),
      body: { branchId: branchBId, trialPlanName: '3-Day Trial', scheduledAt: new Date(Date.now() + 3600000).toISOString(), phoneNumber: '0909000031' },
    });
    if (response.status !== 201 || response.body.data?.branchId !== branchBId) throw new Error(`status=${response.status} body=${JSON.stringify(response.body)}`);
    pass(ctx, 'user branch A táº¡o trial cho branch B vÃ  record giá»¯ branch_id=B');
  } catch (error) {
    fail(ctx, 'cross-branch trial create record check failed', error);
  }

  try {
    const trialAId = await createTrialRecord(ctx, guestId, branchAId, `guest-scope-${ctx.runId}@example.com`, 'Scope Guest', '0909000032');
    const trialBId = await createTrialRecord(ctx, guestId, branchBId, `guest-scope-${ctx.runId}@example.com`, 'Scope Guest', '0909000033');
    const response = await api<Array<Record<string, unknown>>>(ctx, 'GET', '/api/v1/manager/trials', { token: token(managerAId, 'MANAGER', [branchAId]) });
    if (response.status !== 200 || !Array.isArray(response.body.data)) throw new Error(`status=${response.status} body=${JSON.stringify(response.body)}`);
    const ids = response.body.data.map((item) => String(item.id));
    if (!ids.includes(trialAId) || ids.includes(trialBId)) throw new Error(`manager A saw ids: ${ids.join(', ')}`);
    pass(ctx, 'manager chá»‰ tháº¥y trials cá»§a branch mÃ¬nh');
  } catch (error) {
    fail(ctx, 'manager list branch isolation failed', error);
  }

  try {
    const foreignTrialId = await createTrialRecord(ctx, guestId, branchBId, `guest-scope-${ctx.runId}@example.com`, 'Scope Guest', '0909000034');
    const response = await api<Record<string, unknown>>(ctx, 'PATCH', `/api/v1/manager/trials/${foreignTrialId}/status`, {
      token: token(managerAId, 'MANAGER', [branchAId]),
      body: { status: 'ATTENDED' },
    });
    if (![403, 404].includes(response.status)) throw new Error(`expected 403/404, got ${response.status} body=${JSON.stringify(response.body)}`);
    pass(ctx, 'manager khÃ´ng thá»ƒ modify trial khÃ¡c branch');
  } catch (error) {
    fail(ctx, 'manager cross-branch modify guard failed', error);
  }
}

async function cleanup(ctx: Context): Promise<void> {
  const client = await ctx.pool.connect();
  try {
    await client.query('begin');
    await client.query(`delete from audit_logs where actor_user_id = any($1::text[]) or branch_id = any($2::text[])`, [ctx.ids.users, ctx.ids.branches]);
    await client.query(`delete from security_events where user_id = any($1::text[])`, [ctx.ids.users]);
    await client.query(`delete from trial_status_history where changed_by = any($1::text[]) or trial_booking_id in (select id from trial_bookings where guest_user_id = any($1::text[]))`, [ctx.ids.users]);
    await client.query(`delete from subscription_status_history where changed_by = any($1::text[]) or subscription_id in (select id from subscriptions where user_id = any($1::text[]))`, [ctx.ids.users]);
    await client.query(`delete from refresh_sessions where user_id = any($1::text[])`, [ctx.ids.users]);
    await client.query(`delete from password_reset_tokens where user_id = any($1::text[])`, [ctx.ids.users]);
    await del(client, 'trial_bookings', 'id', ctx.ids.trial_bookings);
    await client.query(`delete from trial_bookings where guest_user_id = any($1::text[])`, [ctx.ids.users]);
    await del(client, 'subscriptions', 'id', ctx.ids.subscriptions);
    await client.query(`delete from subscriptions where user_id = any($1::text[])`, [ctx.ids.users]);
    await del(client, 'branch_manager_assignments', 'id', ctx.ids.branch_manager_assignments);
    await client.query(`delete from branch_manager_assignments where manager_user_id = any($1::text[]) or branch_id = any($2::text[])`, [ctx.ids.users, ctx.ids.branches]);
    await del(client, 'user_role_assignments', 'id', ctx.ids.user_role_assignments);
    await client.query(`delete from user_role_assignments where user_id = any($1::text[]) or branch_id = any($2::text[])`, [ctx.ids.users, ctx.ids.branches]);
    await del(client, 'profiles', 'id', ctx.ids.profiles);
    await del(client, 'users', 'id', ctx.ids.users);
    await del(client, 'branches', 'id', ctx.ids.branches);
    await del(client, 'membership_plans', 'id', ctx.ids.membership_plans);
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function del(client: PoolClient, tableName: string, columnName: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  await client.query(`delete from ${tableName} where ${columnName} = any($1::text[])`, [ids]);
}

async function dryRun(pool: Pool): Promise<void> {
  const version = await one<{ version: string }>(pool, 'select version()');
  const now = await one<{ now: Date }>(pool, 'select now()');
  process.stdout.write(`${color('green', 'âœ…')} DATABASE_URL connect thÃ nh cÃ´ng\n`);
  process.stdout.write(`${color('gray', `   PostgreSQL: ${version?.version ?? 'unknown'}`)}\n`);
  process.stdout.write(`${color('gray', `   Server time: ${String(now?.now ?? 'unknown')}`)}\n`);
  process.stdout.write(`${color('yellow', 'âš ï¸')} Dry-run mode chá»‰ kiá»ƒm tra connectivity\n`);
}

async function main(): Promise<void> {
  const dry = process.argv.includes('--dry-run');
  ensureEnv('DATABASE_URL');
  envOrDefault('ACCESS_TOKEN_SECRET', 'smoke-access-secret');
  envOrDefault('REFRESH_TOKEN_SECRET', 'smoke-refresh-secret');
  const pool = new PgPool({ connectionString: process.env.DATABASE_URL, max: 4, idleTimeoutMillis: 10000 });

  if (dry) {
    try {
      await dryRun(pool);
    } finally {
      await pool.end();
    }
    return;
  }

  const ctx = createContext(pool);
  process.stdout.write(`${color('cyan', 'MYFIT Trial Booking Smoke Test')}\n`);
  process.stdout.write(`${color('gray', `Run ID: ${ctx.runId}`)}\n`);

  try {
    await ensureRoles(pool);
    await startAppInProcess(ctx);
    await testDatabaseMigrations(ctx);
    await testApiContracts(ctx);
    await testMembershipLogic(ctx);
    await testBranchScopeIsolation(ctx);
  } finally {
    try {
      await stopAppInProcess(ctx);
    } catch (error) {
      warn(ctx, `khÃ´ng thá»ƒ stop app sáº¡ch sáº½: ${formatError(error)}`);
    }
    try {
      await cleanup(ctx);
      process.stdout.write(`\n${color('green', 'âœ…')} Cleanup dá»¯ liá»‡u test hoÃ n táº¥t\n`);
    } catch (error) {
      fail(ctx, 'cleanup failed', error);
    }
    await pool.end();
  }

  process.stdout.write(`\n${color('cyan', 'Summary')}\n`);
  process.stdout.write(`${color('green', `âœ… Pass: ${ctx.passes}`)}\n`);
  process.stdout.write(`${color('yellow', `âš ï¸ Warning: ${ctx.warnings}`)}\n`);
  process.stdout.write(`${color('red', `âŒ Fail: ${ctx.failures}`)}\n`);
  process.exitCode = ctx.failures > 0 ? 1 : 0;
}

main().catch((error) => {
  process.stderr.write(`${color('red', 'âŒ Smoke test crashed')}\n`);
  process.stderr.write(`${color('gray', `${formatError(error)}`)}\n`);
  process.exitCode = 1;
});

