const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../../src/app');
const { createTestDeps } = require('../../src/shared/infrastructure/test-deps');

function addHealthTrackingRepos(deps) {
  deps.state.healthProfiles = [];
  deps.state.weightLogs = [];
  deps.state.bodyMeasurements = [];

  deps.healthProfileRepository = {
    async create(profile) {
      deps.state.healthProfiles.push(profile);
      return profile;
    },
    async findByUserId(userId) {
      return deps.state.healthProfiles.find((item) => item.userId === userId) ?? null;
    },
    async update(profile) {
      const index = deps.state.healthProfiles.findIndex((item) => item.id === profile.id);
      deps.state.healthProfiles[index] = profile;
      return profile;
    },
  };

  deps.weightLogRepository = {
    async create(log) {
      deps.state.weightLogs.push(log);
      return log;
    },
    async listByUserId(userId, limit) {
      return deps.state.weightLogs
        .filter((item) => item.userId === userId)
        .sort((left, right) => new Date(right.measuredAt) - new Date(left.measuredAt))
        .slice(0, limit);
    },
  };

  deps.bodyMeasurementRepository = {
    async create(measurement) {
      deps.state.bodyMeasurements.push(measurement);
      return measurement;
    },
    async listByUserId(userId, limit) {
      return deps.state.bodyMeasurements
        .filter((item) => item.userId === userId)
        .sort((left, right) => new Date(right.measuredAt) - new Date(left.measuredAt))
        .slice(0, limit);
    },
  };
}

async function startApp() {
  const deps = await createTestDeps();
  if (!deps.idGenerator.generate) {
    deps.idGenerator.generate = () => deps.idGenerator.next('id');
  }
  addHealthTrackingRepos(deps);
  const app = createApp({ deps });
  await app.start();
  return app;
}

async function registerGuest(app, email) {
  const response = await fetch(`${app.baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'StrongPass123', profile: { fullName: email } }),
  });
  return (await response.json()).data.user;
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

test('member can update profile, log health entries, and fetch progress', async () => {
  const app = await startApp();
  try {
    const member = await registerGuest(app, 'health-member@example.com');
    const accessToken = await login(app, 'health-member@example.com', 'StrongPass123');

    const profileResponse = await fetch(`${app.baseUrl}/api/v1/health/profile`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        dateOfBirth: '1995-04-10',
        gender: 'female',
        heightCm: 168,
        primaryGoal: 'weight_loss',
        medicalConditions: 'none',
      }),
    });
    const profileBody = await profileResponse.json();
    assert.equal(profileResponse.status, 200);
    assert.equal(profileBody.data.userId, member.id);
    assert.equal(profileBody.data.heightCm, 168);

    const weightResponse = await fetch(`${app.baseUrl}/api/v1/health/weight`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        weightKg: 64.5,
        measuredAt: '2026-04-01T08:00:00.000Z',
        measurementSource: 'manual',
        note: 'morning check',
      }),
    });
    const weightBody = await weightResponse.json();
    assert.equal(weightResponse.status, 201);
    assert.equal(weightBody.data.userId, member.id);
    assert.equal(weightBody.data.weightKg, 64.5);
    assert.equal(weightBody.data.createdBy, member.id);

    const measurementResponse = await fetch(`${app.baseUrl}/api/v1/health/measurements`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        measurementType: 'waist',
        value: 72,
        unit: 'cm',
        measuredAt: '2026-04-01T08:05:00.000Z',
      }),
    });
    const measurementBody = await measurementResponse.json();
    assert.equal(measurementResponse.status, 201);
    assert.equal(measurementBody.data.userId, member.id);
    assert.equal(measurementBody.data.measurementType, 'waist');

    const progressResponse = await fetch(`${app.baseUrl}/api/v1/health/progress`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const progressBody = await progressResponse.json();

    assert.equal(progressResponse.status, 200);
    assert.equal(progressBody.data.profile.userId, member.id);
    assert.equal(progressBody.data.recentWeightLogs.length, 1);
    assert.equal(progressBody.data.recentWeightLogs[0].weightKg, 64.5);
    assert.equal(progressBody.data.recentBodyMeasurements.length, 1);
    assert.equal(progressBody.data.recentBodyMeasurements[0].measurementType, 'waist');
  } finally {
    await app.stop();
  }
});

test('health profile PUT updates an existing profile instead of creating a duplicate', async () => {
  const app = await startApp();
  try {
    await registerGuest(app, 'health-update@example.com');
    const accessToken = await login(app, 'health-update@example.com', 'StrongPass123');

    await fetch(`${app.baseUrl}/api/v1/health/profile`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ heightCm: 170, primaryGoal: 'maintenance' }),
    });

    const updateResponse = await fetch(`${app.baseUrl}/api/v1/health/profile`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ heightCm: 171 }),
    });
    const updateBody = await updateResponse.json();

    assert.equal(updateResponse.status, 200);
    assert.equal(updateBody.data.heightCm, 171);
    assert.equal(updateBody.data.primaryGoal, 'maintenance');
    assert.equal(app.deps.state.healthProfiles.length, 1);
  } finally {
    await app.stop();
  }
});

test('health endpoints require auth and ignore userId supplied in the request body', async () => {
  const app = await startApp();
  try {
    const unauthenticatedResponse = await fetch(`${app.baseUrl}/api/v1/health/progress`);
    const unauthenticatedBody = await unauthenticatedResponse.json();
    assert.equal(unauthenticatedResponse.status, 401);
    assert.equal(unauthenticatedBody.error.code, 'UNAUTHORIZED');

    const owner = await registerGuest(app, 'health-owner@example.com');
    const otherUser = await registerGuest(app, 'health-other@example.com');
    const ownerAccessToken = await login(app, 'health-owner@example.com', 'StrongPass123');

    const weightResponse = await fetch(`${app.baseUrl}/api/v1/health/weight`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${ownerAccessToken}`,
      },
      body: JSON.stringify({
        userId: otherUser.id,
        weightKg: 80,
      }),
    });
    const weightBody = await weightResponse.json();

    assert.equal(weightResponse.status, 201);
    assert.equal(weightBody.data.userId, owner.id);
    assert.equal(weightBody.data.createdBy, owner.id);
    assert.equal(app.deps.state.weightLogs.some((item) => item.userId === otherUser.id), false);
  } finally {
    await app.stop();
  }
});
