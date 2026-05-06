const test = require('node:test');
const assert = require('node:assert/strict');

const { bootstrapDatabase } = require('../../src/db/bootstrap');
const { seedDatabase } = require('../../src/db/seed');

test('bootstrapDatabase executes the schema SQL against the provided pool', async () => {
  const calls = [];
  const pool = {
    async query(sql) {
      calls.push(sql);
      return { rows: [] };
    },
  };

  await bootstrapDatabase({ pool });

  assert.equal(calls.length, 1);
  assert.match(calls[0], /create table if not exists users/i);
});

test('seedDatabase writes idempotent seed statements for roles, users, branch, manager assignment, and membership plan', async () => {
  const calls = [];
  const pool = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (/insert into users/i.test(sql) && /returning id/i.test(sql)) {
        return { rows: [{ id: params[0] }] };
      }
      if (/insert into branches/i.test(sql) && /returning id/i.test(sql)) {
        return { rows: [{ id: params[0] }] };
      }
      if (/insert into membership_plans/i.test(sql) && /returning id/i.test(sql)) {
        return { rows: [{ id: params[0] }] };
      }
      return { rows: [] };
    },
  };

  await seedDatabase({
    pool,
    now: new Date('2026-03-28T09:00:00.000Z'),
    adminEmail: 'admin@myfit.local',
    adminPasswordHash: 'hash-admin',
    managerEmail: 'manager@myfit.local',
    managerPasswordHash: 'hash-manager',
  });

  assert.equal(calls.length >= 6, true);
  assert.equal(calls.some((call) => /insert into roles/i.test(call.sql) && /on conflict/i.test(call.sql)), true);
  assert.equal(calls.some((call) => /insert into users/i.test(call.sql) && /on conflict/i.test(call.sql)), true);
  assert.equal(calls.some((call) => /insert into branches/i.test(call.sql) && /on conflict/i.test(call.sql)), true);
  assert.equal(calls.some((call) => /insert into branch_manager_assignments/i.test(call.sql) && /where not exists/i.test(call.sql)), true);
  assert.equal(calls.some((call) => /insert into membership_plans/i.test(call.sql) && /on conflict/i.test(call.sql)), true);
});
