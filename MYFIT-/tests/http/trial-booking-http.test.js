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

async function createBranch(app, adminAccessToken, code) {
  const response = await fetch(`${app.baseUrl}/api/v1/admin/branches`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${adminAccessToken}`,
    },
    body: JSON.stringify({ code, name: code, address: `${code} Address` }),
  });
  return (await response.json()).data;
}

test('guest can create a trial booking for a branch', async () => {
  const app = await startApp();
  try {
    const adminAccessToken = await login(app, 'admin@myfit.local', 'AdminPass123');
    const branch = await createBranch(app, adminAccessToken, 'HCM-Q1');

    await fetch(`${app.baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'trial-guest@example.com', password: 'StrongPass123', profile: { fullName: 'Trial Guest' } }),
    });
    const guestAccessToken = await login(app, 'trial-guest@example.com', 'StrongPass123');

    const response = await fetch(`${app.baseUrl}/api/v1/trials`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${guestAccessToken}`,
      },
      body: JSON.stringify({
        branchId: branch.id,
        trialPlanName: '3-Day Trial',
        scheduledAt: '2026-03-29T09:00:00.000Z',
        phoneNumber: '0909000001',
        notes: 'Prefers morning slot',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.data.branchId, branch.id);
    assert.equal(body.data.status, 'BOOKED');
  } finally {
    await app.stop();
  }
});

test('manager only sees trial bookings from assigned branches', async () => {
  const app = await startApp();
  try {
    const adminAccessToken = await login(app, 'admin@myfit.local', 'AdminPass123');
    const branchQ1 = await createBranch(app, adminAccessToken, 'HCM-Q1');
    const branchQ3 = await createBranch(app, adminAccessToken, 'HCM-Q3');

    await fetch(`${app.baseUrl}/api/v1/admin/branches/${branchQ1.id}/managers`, {
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
      body: JSON.stringify({ email: 'trial-guest@example.com', password: 'StrongPass123', profile: { fullName: 'Trial Guest' } }),
    });
    const guestAccessToken = await login(app, 'trial-guest@example.com', 'StrongPass123');

    await fetch(`${app.baseUrl}/api/v1/trials`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${guestAccessToken}`,
      },
      body: JSON.stringify({
        branchId: branchQ1.id,
        trialPlanName: '3-Day Trial',
        scheduledAt: '2026-03-29T09:00:00.000Z',
        phoneNumber: '0909000001',
      }),
    });
    await fetch(`${app.baseUrl}/api/v1/trials`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${guestAccessToken}`,
      },
      body: JSON.stringify({
        branchId: branchQ3.id,
        trialPlanName: '3-Day Trial',
        scheduledAt: '2026-03-30T09:00:00.000Z',
        phoneNumber: '0909000002',
      }),
    });

    const managerAccessToken = await login(app, 'manager@myfit.local', 'ManagerPass123');
    const response = await fetch(`${app.baseUrl}/api/v1/manager/trials`, {
      headers: { authorization: `Bearer ${managerAccessToken}` },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].branchId, branchQ1.id);
  } finally {
    await app.stop();
  }
});

test('manager can update trial status only within assigned branch', async () => {
  const app = await startApp();
  try {
    const adminAccessToken = await login(app, 'admin@myfit.local', 'AdminPass123');
    const branchQ1 = await createBranch(app, adminAccessToken, 'HCM-Q1');
    const branchQ3 = await createBranch(app, adminAccessToken, 'HCM-Q3');

    await fetch(`${app.baseUrl}/api/v1/admin/branches/${branchQ1.id}/managers`, {
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
      body: JSON.stringify({ email: 'trial-guest@example.com', password: 'StrongPass123', profile: { fullName: 'Trial Guest' } }),
    });
    const guestAccessToken = await login(app, 'trial-guest@example.com', 'StrongPass123');

    const bookedResponse = await fetch(`${app.baseUrl}/api/v1/trials`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${guestAccessToken}`,
      },
      body: JSON.stringify({
        branchId: branchQ1.id,
        trialPlanName: '3-Day Trial',
        scheduledAt: '2026-03-29T09:00:00.000Z',
        phoneNumber: '0909000001',
      }),
    });
    const bookedTrial = (await bookedResponse.json()).data;

    const foreignResponse = await fetch(`${app.baseUrl}/api/v1/trials`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${guestAccessToken}`,
      },
      body: JSON.stringify({
        branchId: branchQ3.id,
        trialPlanName: '3-Day Trial',
        scheduledAt: '2026-03-30T09:00:00.000Z',
        phoneNumber: '0909000002',
      }),
    });
    const foreignTrial = (await foreignResponse.json()).data;

    const managerAccessToken = await login(app, 'manager@myfit.local', 'ManagerPass123');

    const successResponse = await fetch(`${app.baseUrl}/api/v1/manager/trials/${bookedTrial.id}/status`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({ status: 'ATTENDED' }),
    });
    const successBody = await successResponse.json();
    assert.equal(successResponse.status, 200);
    assert.equal(successBody.data.status, 'ATTENDED');

    const forbiddenResponse = await fetch(`${app.baseUrl}/api/v1/manager/trials/${foreignTrial.id}/status`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({ status: 'ATTENDED' }),
    });
    const forbiddenBody = await forbiddenResponse.json();
    assert.equal(forbiddenResponse.status, 403);
    assert.equal(forbiddenBody.error.code, 'CROSS_BRANCH_ACCESS');
  } finally {
    await app.stop();
  }
});

test('manager can convert a trial to active membership and duplicate convert is blocked', async () => {
  const app = await startApp();
  try {
    const adminAccessToken = await login(app, 'admin@myfit.local', 'AdminPass123');
    const branch = await createBranch(app, adminAccessToken, 'HCM-Q1');

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
      body: JSON.stringify({ email: 'trial-guest@example.com', password: 'StrongPass123', profile: { fullName: 'Trial Guest' } }),
    });
    const guestAccessToken = await login(app, 'trial-guest@example.com', 'StrongPass123');

    const trialResponse = await fetch(`${app.baseUrl}/api/v1/trials`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${guestAccessToken}`,
      },
      body: JSON.stringify({
        branchId: branch.id,
        trialPlanName: '3-Day Trial',
        scheduledAt: '2026-03-29T09:00:00.000Z',
        phoneNumber: '0909000001',
      }),
    });
    const trial = (await trialResponse.json()).data;

    const managerAccessToken = await login(app, 'manager@myfit.local', 'ManagerPass123');
    const convertResponse = await fetch(`${app.baseUrl}/api/v1/manager/trials/${trial.id}/convert`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({
        membershipPlanId: 'plan-basic-1',
        homeBranchId: branch.id,
        activationNotes: 'Paid in cash',
      }),
    });
    const convertBody = await convertResponse.json();

    assert.equal(convertResponse.status, 201);
    assert.equal(convertBody.data.trialBookingId, trial.id);
    assert.equal(convertBody.data.status, 'ACTIVE');
    assert.equal(convertBody.data.role, 'MEMBER');

    const duplicateResponse = await fetch(`${app.baseUrl}/api/v1/manager/trials/${trial.id}/convert`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({
        membershipPlanId: 'plan-basic-1',
        homeBranchId: branch.id,
      }),
    });
    const duplicateBody = await duplicateResponse.json();

    assert.equal(duplicateResponse.status, 409);
    assert.equal(duplicateBody.error.code, 'TRIAL_ALREADY_CONVERTED');
  } finally {
    await app.stop();
  }
});
