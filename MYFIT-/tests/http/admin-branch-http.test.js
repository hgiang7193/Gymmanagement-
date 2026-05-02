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
  return body.data.accessToken;
}

test('admin can create and list branches', async () => {
  const app = await startApp();
  try {
    const accessToken = await login(app, 'admin@myfit.local', 'AdminPass123');

    const createResponse = await fetch(`${app.baseUrl}/api/v1/admin/branches`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ code: 'HCM-Q1', name: 'MYFIT Q1', address: 'District 1' }),
    });
    const createBody = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createBody.data.code, 'HCM-Q1');

    const listResponse = await fetch(`${app.baseUrl}/api/v1/admin/branches`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const listBody = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listBody.data.length, 1);
  } finally {
    await app.stop();
  }
});

test('admin can assign manager to branch and manager only sees assigned branches', async () => {
  const app = await startApp();
  try {
    const adminAccessToken = await login(app, 'admin@myfit.local', 'AdminPass123');

    const createResponse = await fetch(`${app.baseUrl}/api/v1/admin/branches`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({ code: 'HCM-Q1', name: 'MYFIT Q1', address: 'District 1' }),
    });
    const branch = (await createResponse.json()).data;

    const assignResponse = await fetch(`${app.baseUrl}/api/v1/admin/branches/${branch.id}/managers`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({ managerUserId: 'user-manager-1' }),
    });
    assert.equal(assignResponse.status, 201);

    const managerAccessToken = await login(app, 'manager@myfit.local', 'ManagerPass123');
    const listResponse = await fetch(`${app.baseUrl}/api/v1/manager/branches`, {
      headers: { authorization: `Bearer ${managerAccessToken}` },
    });
    const listBody = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listBody.data.length, 1);
    assert.equal(listBody.data[0].id, branch.id);
  } finally {
    await app.stop();
  }
});

test('admin can update user status and list users', async () => {
  const app = await startApp();
  try {
    const accessToken = await login(app, 'admin@myfit.local', 'AdminPass123');
    const registerResponse = await fetch(`${app.baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'guest@example.com', password: 'StrongPass123', profile: { fullName: 'Guest User' } }),
    });
    const registerBody = await registerResponse.json();
    const userId = registerBody.data.user.id;

    const patchResponse = await fetch(`${app.baseUrl}/api/v1/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status: 'SUSPENDED' }),
    });
    const patchBody = await patchResponse.json();
    assert.equal(patchResponse.status, 200);
    assert.equal(patchBody.data.status, 'SUSPENDED');

    const listResponse = await fetch(`${app.baseUrl}/api/v1/admin/users`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const listBody = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listBody.data.some((user) => user.id === userId && user.status === 'SUSPENDED'), true);
  } finally {
    await app.stop();
  }
});

test('manager can activate membership in assigned branch but not cross-branch', async () => {
  const app = await startApp();
  try {
    const adminAccessToken = await login(app, 'admin@myfit.local', 'AdminPass123');

    const firstBranchResponse = await fetch(`${app.baseUrl}/api/v1/admin/branches`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({ code: 'HCM-Q1', name: 'MYFIT Q1', address: 'District 1' }),
    });
    const firstBranch = (await firstBranchResponse.json()).data;

    const secondBranchResponse = await fetch(`${app.baseUrl}/api/v1/admin/branches`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({ code: 'HCM-Q3', name: 'MYFIT Q3', address: 'District 3' }),
    });
    const secondBranch = (await secondBranchResponse.json()).data;

    await fetch(`${app.baseUrl}/api/v1/admin/branches/${firstBranch.id}/managers`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({ managerUserId: 'user-manager-1' }),
    });

    const registerResponse = await fetch(`${app.baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'member-candidate@example.com', password: 'StrongPass123', profile: { fullName: 'Candidate' } }),
    });
    const memberCandidateId = (await registerResponse.json()).data.user.id;
    const managerAccessToken = await login(app, 'manager@myfit.local', 'ManagerPass123');

    const successResponse = await fetch(`${app.baseUrl}/api/v1/manager/memberships/activate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({
        userId: memberCandidateId,
        membershipPlanId: 'plan-basic-1',
        homeBranchId: firstBranch.id,
      }),
    });
    const successBody = await successResponse.json();

    assert.equal(successResponse.status, 201);
    assert.equal(successBody.data.homeBranchId, firstBranch.id);

    const crossRegisterResponse = await fetch(`${app.baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'cross-branch@example.com', password: 'StrongPass123', profile: { fullName: 'Cross Branch' } }),
    });
    const crossBranchUserId = (await crossRegisterResponse.json()).data.user.id;

    const conflictResponse = await fetch(`${app.baseUrl}/api/v1/manager/memberships/activate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({
        userId: crossBranchUserId,
        membershipPlanId: 'plan-basic-1',
        homeBranchId: secondBranch.id,
      }),
    });
    const conflictBody = await conflictResponse.json();

    assert.equal(conflictResponse.status, 403);
    assert.equal(conflictBody.error.code, 'CROSS_BRANCH_ACCESS');
  } finally {
    await app.stop();
  }
});

test('member can fetch current subscription after manager activation', async () => {
  const app = await startApp();
  try {
    const adminAccessToken = await login(app, 'admin@myfit.local', 'AdminPass123');
    const createBranchResponse = await fetch(`${app.baseUrl}/api/v1/admin/branches`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({ code: 'HCM-Q1', name: 'MYFIT Q1', address: 'District 1' }),
    });
    const branch = (await createBranchResponse.json()).data;

    await fetch(`${app.baseUrl}/api/v1/admin/branches/${branch.id}/managers`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({ managerUserId: 'user-manager-1' }),
    });

    await fetch(`${app.baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'member@example.com', password: 'StrongPass123', profile: { fullName: 'Member User' } }),
    });

    const memberCandidateId = app.deps.state.users.find((item) => item.email === 'member@example.com').id;
    const managerAccessToken = await login(app, 'manager@myfit.local', 'ManagerPass123');
    const activateResponse = await fetch(`${app.baseUrl}/api/v1/manager/memberships/activate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({
        userId: memberCandidateId,
        membershipPlanId: 'plan-basic-1',
        homeBranchId: branch.id,
      }),
    });
    assert.equal(activateResponse.status, 201);

    const memberAccessToken = await login(app, 'member@example.com', 'StrongPass123');
    const subscriptionResponse = await fetch(`${app.baseUrl}/api/v1/me/subscription`, {
      headers: { authorization: `Bearer ${memberAccessToken}` },
    });
    const subscriptionBody = await subscriptionResponse.json();

    assert.equal(subscriptionResponse.status, 200);
    assert.equal(subscriptionBody.data.status, 'ACTIVE');
  } finally {
    await app.stop();
  }
});

test('non-admin cannot access admin branch endpoint', async () => {
  const app = await startApp();
  try {
    const managerAccessToken = await login(app, 'manager@myfit.local', 'ManagerPass123');

    const response = await fetch(`${app.baseUrl}/api/v1/admin/branches`, {
      headers: { authorization: `Bearer ${managerAccessToken}` },
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.error.code, 'FORBIDDEN');
  } finally {
    await app.stop();
  }
});
