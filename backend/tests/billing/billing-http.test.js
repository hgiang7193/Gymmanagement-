const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../../src/app');
const { createTestDeps } = require('../../src/shared/infrastructure/test-deps');

function addBillingRepos(deps) {
  deps.state.invoices = [];
  deps.state.payments = [];

  deps.invoiceRepository = {
    async create(invoice) {
      deps.state.invoices.push(invoice);
      return invoice;
    },
    async findById(id) {
      return deps.state.invoices.find((item) => item.id === id) ?? null;
    },
    async updateStatus(invoiceId, status, updatedAt) {
      const invoice = deps.state.invoices.find((item) => item.id === invoiceId);
      if (invoice) {
        invoice.status = status;
        invoice.updatedAt = updatedAt;
      }
    },
    async listByUserId(userId) {
      return deps.state.invoices.filter((item) => item.userId === userId);
    },
  };

  deps.paymentRepository = {
    async create(payment) {
      deps.state.payments.push(payment);
      return payment;
    },
    async listByInvoiceId(invoiceId) {
      return deps.state.payments.filter((item) => item.invoiceId === invoiceId);
    },
  };
}

async function startApp() {
  const deps = await createTestDeps();
  if (!deps.idGenerator.generate) {
    deps.idGenerator.generate = () => deps.idGenerator.next('id');
  }
  addBillingRepos(deps);
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

async function registerGuest(app, email) {
  const response = await fetch(`${app.baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'StrongPass123', profile: { fullName: email } }),
  });
  return (await response.json()).data.user;
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

async function createInvoice(app, accessToken, payload) {
  const response = await fetch(`${app.baseUrl}/api/v1/billing/invoices`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  return { response, body: await response.json() };
}

test('manager can create an invoice for an existing user and branch', async () => {
  const app = await startApp();
  try {
    const adminAccessToken = await login(app, 'admin@myfit.local', 'AdminPass123');
    const branch = await createBranch(app, adminAccessToken, 'HCM-Q1');
    const member = await registerGuest(app, 'billing-member@example.com');
    const managerAccessToken = await login(app, 'manager@myfit.local', 'ManagerPass123');

    const { response, body } = await createInvoice(app, managerAccessToken, {
      userId: member.id,
      branchId: branch.id,
      totalAmount: 1200000,
      dueDate: '2026-04-15T00:00:00.000Z',
    });

    assert.equal(response.status, 201);
    assert.equal(body.data.userId, member.id);
    assert.equal(body.data.branchId, branch.id);
    assert.equal(body.data.totalAmount, 1200000);
    assert.equal(body.data.status, 'pending');
    assert.match(body.data.invoiceNumber, /^INV-/);
    assert.equal(app.deps.state.invoices.length, 1);
  } finally {
    await app.stop();
  }
});

test('manager can record payment and the invoice is marked paid', async () => {
  const app = await startApp();
  try {
    const adminAccessToken = await login(app, 'admin@myfit.local', 'AdminPass123');
    const branch = await createBranch(app, adminAccessToken, 'HCM-Q1');
    const member = await registerGuest(app, 'paid-member@example.com');
    const managerAccessToken = await login(app, 'manager@myfit.local', 'ManagerPass123');
    const invoice = (await createInvoice(app, managerAccessToken, {
      userId: member.id,
      branchId: branch.id,
      totalAmount: 1200000,
    })).body.data;

    const paymentResponse = await fetch(`${app.baseUrl}/api/v1/billing/payments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({
        invoiceId: invoice.id,
        amount: 1200000,
        paymentMethod: 'cash',
        transactionRef: 'CASH-001',
      }),
    });
    const paymentBody = await paymentResponse.json();

    assert.equal(paymentResponse.status, 201);
    assert.equal(paymentBody.data.invoiceId, invoice.id);
    assert.equal(paymentBody.data.status, 'success');
    assert.equal(paymentBody.data.createdBy, 'user-manager-1');
    assert.equal(paymentBody.data.transactionRef, 'CASH-001');
    assert.equal(app.deps.state.payments.length, 1);
    assert.equal(app.deps.state.invoices[0].status, 'paid');
  } finally {
    await app.stop();
  }
});

test('billing endpoints require manager or admin access', async () => {
  const app = await startApp();
  try {
    const unauthenticatedResponse = await fetch(`${app.baseUrl}/api/v1/billing/invoices`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: 'user-member-1', branchId: 'branch-1', totalAmount: 100000 }),
    });
    const unauthenticatedBody = await unauthenticatedResponse.json();
    assert.equal(unauthenticatedResponse.status, 401);
    assert.equal(unauthenticatedBody.error.code, 'UNAUTHORIZED');

    await registerGuest(app, 'billing-guest@example.com');
    const guestAccessToken = await login(app, 'billing-guest@example.com', 'StrongPass123');
    const forbiddenResponse = await fetch(`${app.baseUrl}/api/v1/billing/payments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${guestAccessToken}`,
      },
      body: JSON.stringify({ invoiceId: 'invoice-1', amount: 100000, paymentMethod: 'cash' }),
    });
    const forbiddenBody = await forbiddenResponse.json();

    assert.equal(forbiddenResponse.status, 403);
    assert.equal(forbiddenBody.error.code, 'FORBIDDEN');
  } finally {
    await app.stop();
  }
});
