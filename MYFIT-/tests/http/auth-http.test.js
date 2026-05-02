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

test('POST /api/v1/auth/register returns 201 and creates guest account', async () => {
  const app = await startApp();
  try {
    const response = await fetch(`${app.baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'guest@example.com',
        password: 'StrongPass123',
        profile: { fullName: 'Guest User' },
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.data.user.email, 'guest@example.com');
    assert.equal(body.error, null);
  } finally {
    await app.stop();
  }
});

test('POST /api/v1/auth/login returns JWT tokens', async () => {
  const app = await startApp();
  try {
    await fetch(`${app.baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'guest@example.com',
        password: 'StrongPass123',
        profile: { fullName: 'Guest User' },
      }),
    });

    const response = await fetch(`${app.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'guest@example.com', password: 'StrongPass123' }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.accessToken.split('.').length, 3);
    assert.equal(body.data.refreshToken.split('.').length, 3);
  } finally {
    await app.stop();
  }
});

test('POST /api/v1/auth/refresh rotates token', async () => {
  const app = await startApp();
  try {
    await fetch(`${app.baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'guest@example.com', password: 'StrongPass123', profile: { fullName: 'Guest User' } }),
    });
    const loginResponse = await fetch(`${app.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'guest@example.com', password: 'StrongPass123' }),
    });
    const loginBody = await loginResponse.json();

    const response = await fetch(`${app.baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: loginBody.data.refreshToken }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.notEqual(body.data.refreshToken, loginBody.data.refreshToken);
  } finally {
    await app.stop();
  }
});
