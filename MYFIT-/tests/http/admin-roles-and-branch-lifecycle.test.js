const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../../src/app');
const { createTestDeps } = require('../../src/shared/infrastructure/test-deps');

async function startApp() {
  const deps = await createTestDeps();
  const app = createApp({ deps });
  await app.start();
  return app;
}

async function login(app, email, password) {
  const response = await fetch(`${app.baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json();
  return { accessToken: body.data.accessToken, refreshToken: body.data.refreshToken };
}

async function registerGuest(app, email) {
  const response = await fetch(`${app.baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'StrongPass123', profile: { fullName: email } }),
  });
  return (await response.json()).data.user.id;
}

test('admin can update branch info and zalo contact fields', async () => {
  const app = await startApp();
  try {
    const { accessToken } = await login(app, 'admin@myfit.local', 'AdminPass123');
    const created = await fetch(`${app.baseUrl}/api/v1/admin/branches`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ code: 'HCM-Q1', name: 'MYFIT Q1', address: 'D1' }),
    });
    const branch = (await created.json()).data;

    const updated = await fetch(`${app.baseUrl}/api/v1/admin/branches/${branch.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        name: 'MYFIT Quận 1',
        zaloLink: 'https://zalo.me/0900000000',
        zaloPhone: '0900000000',
        contactEmail: 'q1@myfit.local',
      }),
    });
    const body = await updated.json();
    assert.equal(updated.status, 200);
    assert.equal(body.data.name, 'MYFIT Quận 1');
    assert.equal(body.data.zaloLink, 'https://zalo.me/0900000000');
    assert.equal(body.data.contactEmail, 'q1@myfit.local');
  } finally { await app.stop(); }
});

test('close branch is blocked when active subscriptions exist, succeeds with force', async () => {
  const app = await startApp();
  try {
    const { accessToken } = await login(app, 'admin@myfit.local', 'AdminPass123');
    const created = await fetch(`${app.baseUrl}/api/v1/admin/branches`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ code: 'HCM-Q2', name: 'MYFIT Q2', address: 'D2' }),
    });
    const branch = (await created.json()).data;

    // Seed an active subscription on this branch
    app.deps.state.subscriptions.push({
      id: 'sub-1', userId: 'user-x', homeBranchId: branch.id, status: 'ACTIVE',
      activatedAt: new Date(),
    });

    const blocked = await fetch(`${app.baseUrl}/api/v1/admin/branches/${branch.id}/close`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({}),
    });
    assert.equal(blocked.status, 409);
    assert.equal((await blocked.json()).error.code, 'BRANCH_HAS_ACTIVE_MEMBERS');

    const forced = await fetch(`${app.baseUrl}/api/v1/admin/branches/${branch.id}/close`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ force: true, reason: 'mergers' }),
    });
    assert.equal(forced.status, 200);
    assert.equal((await forced.json()).data.status, 'CLOSED');

    const dup = await fetch(`${app.baseUrl}/api/v1/admin/branches/${branch.id}/close`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ force: true }),
    });
    assert.equal(dup.status, 409);
    assert.equal((await dup.json()).error.code, 'BRANCH_ALREADY_CLOSED');
  } finally { await app.stop(); }
});

test('admin can assign and revoke roles; manager assignment requires branchId', async () => {
  const app = await startApp();
  try {
    const { accessToken } = await login(app, 'admin@myfit.local', 'AdminPass123');
    const userId = await registerGuest(app, 'staff-candidate@example.com');

    const branchRes = await fetch(`${app.baseUrl}/api/v1/admin/branches`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ code: 'HCM-Q4', name: 'MYFIT Q4', address: 'D4' }),
    });
    const branch = (await branchRes.json()).data;

    const missingBranch = await fetch(`${app.baseUrl}/api/v1/admin/users/${userId}/roles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ roleCode: 'MANAGER' }),
    });
    assert.equal(missingBranch.status, 422);
    assert.equal((await missingBranch.json()).error.code, 'BRANCH_ID_REQUIRED');

    const assigned = await fetch(`${app.baseUrl}/api/v1/admin/users/${userId}/roles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ roleCode: 'COACH' }),
    });
    assert.equal(assigned.status, 201);
    assert.equal((await assigned.json()).data.roleCode, 'COACH');

    const dup = await fetch(`${app.baseUrl}/api/v1/admin/users/${userId}/roles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ roleCode: 'COACH' }),
    });
    assert.equal(dup.status, 409);
    assert.equal((await dup.json()).error.code, 'ROLE_ALREADY_ASSIGNED');

    const list = await fetch(`${app.baseUrl}/api/v1/admin/users/${userId}/roles`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const listBody = await list.json();
    assert.ok(listBody.data.some((r) => r.roleCode === 'COACH'));

    const mgr = await fetch(`${app.baseUrl}/api/v1/admin/users/${userId}/roles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ roleCode: 'MANAGER', branchId: branch.id }),
    });
    assert.equal(mgr.status, 201);

    const revoked = await fetch(
      `${app.baseUrl}/api/v1/admin/users/${userId}/roles/COACH`,
      { method: 'DELETE', headers: { authorization: `Bearer ${accessToken}` } }
    );
    assert.equal(revoked.status, 200);

    const notAssigned = await fetch(
      `${app.baseUrl}/api/v1/admin/users/${userId}/roles/MEMBER`,
      { method: 'DELETE', headers: { authorization: `Bearer ${accessToken}` } }
    );
    assert.equal(notAssigned.status, 422);
    assert.equal((await notAssigned.json()).error.code, 'ROLE_NOT_ASSIGNED');
  } finally { await app.stop(); }
});

test('deactivating user revokes all refresh sessions; refresh fails afterwards', async () => {
  const app = await startApp();
  try {
    const { accessToken: adminToken } = await login(app, 'admin@myfit.local', 'AdminPass123');
    const userId = await registerGuest(app, 'will-be-disabled@example.com');
    const guest = await login(app, 'will-be-disabled@example.com', 'StrongPass123');
    assert.ok(guest.refreshToken);

    const refreshOk = await fetch(`${app.baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: guest.refreshToken }),
    });
    assert.equal(refreshOk.status, 200);
    const newRefresh = (await refreshOk.json()).data.refreshToken;

    const patch = await fetch(`${app.baseUrl}/api/v1/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'INACTIVE' }),
    });
    assert.equal(patch.status, 200);

    const refreshFail = await fetch(`${app.baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: newRefresh }),
    });
    assert.equal(refreshFail.status, 401);
  } finally { await app.stop(); }
});

test('cannot deactivate the last active admin', async () => {
  const app = await startApp();
  try {
    const { accessToken } = await login(app, 'admin@myfit.local', 'AdminPass123');
    const adminId = app.deps.state.users.find((u) => u.email === 'admin@myfit.local').id;

    const blocked = await fetch(`${app.baseUrl}/api/v1/admin/users/${adminId}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ status: 'INACTIVE' }),
    });
    assert.equal(blocked.status, 403);
    assert.equal((await blocked.json()).error.code, 'LAST_ADMIN_PROTECTED');
  } finally { await app.stop(); }
});
