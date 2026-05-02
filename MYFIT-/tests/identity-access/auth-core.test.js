const test = require('node:test');
const assert = require('node:assert/strict');

const { RegisterGuestUseCase } = require('../../src/identity-access/application/register-guest');
const { LoginWithPasswordUseCase } = require('../../src/identity-access/application/login-with-password');
const { RefreshAccessTokenUseCase } = require('../../src/identity-access/application/refresh-access-token');
const { LogoutCurrentSessionUseCase } = require('../../src/identity-access/application/logout-current-session');
const { RequestPasswordResetUseCase } = require('../../src/identity-access/application/request-password-reset');
const { ResetPasswordUseCase } = require('../../src/identity-access/application/reset-password');
const { createTestDeps } = require('../../src/shared/infrastructure/test-deps');

test('register creates guest user, profile, role assignment, and verification email', async () => {
  const deps = await createTestDeps();
  const useCase = new RegisterGuestUseCase(deps);

  const result = await useCase.execute({ email: 'guest@example.com', password: 'StrongPass123', profile: { fullName: 'Guest User' } });

  assert.equal(result.user.email, 'guest@example.com');
  assert.equal(deps.state.users.some((item) => item.email === 'guest@example.com'), true);
  assert.equal(deps.state.profiles.some((item) => item.userId === result.user.id), true);
  assert.equal(deps.state.roleAssignments.some((item) => item.userId === result.user.id), true);
  assert.equal(deps.state.verificationEmails.length, 1);
  assert.equal(deps.state.auditLogs.at(-1).actionCode, 'guest_registered');
});

test('register rejects duplicate email', async () => {
  const deps = await createTestDeps();
  const useCase = new RegisterGuestUseCase(deps);
  await useCase.execute({ email: 'guest@example.com', password: 'StrongPass123', profile: { fullName: 'Guest User' } });

  await assert.rejects(
    () => useCase.execute({ email: 'guest@example.com', password: 'StrongPass123', profile: { fullName: 'Guest User' } }),
    { message: 'EMAIL_ALREADY_EXISTS' }
  );
});

test('login issues JWT tokens and records successful security event', async () => {
  const deps = await createTestDeps();
  const registerGuest = new RegisterGuestUseCase(deps);
  const useCase = new LoginWithPasswordUseCase(deps);
  await registerGuest.execute({ email: 'guest@example.com', password: 'StrongPass123', profile: { fullName: 'Guest User' } });

  const result = await useCase.execute({ email: 'guest@example.com', password: 'StrongPass123' });

  assert.equal(result.accessToken.split('.').length, 3);
  assert.equal(result.refreshToken.split('.').length, 3);
  assert.equal(deps.state.refreshSessions.length, 1);
  assert.equal(deps.state.securityEvents.at(-1).eventType, 'login_success');
});

test('login includes manager branch claims in access token', async () => {
  const deps = await createTestDeps();
  const now = deps.clock.now();
  deps.state.branches.push({
    id: 'branch-q1',
    code: 'HCM-Q1',
    name: 'Q1 Branch',
    address: 'District 1',
    phoneNumber: null,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  });
  deps.state.branchManagerAssignments.push({
    id: 'bma-1',
    branchId: 'branch-q1',
    managerUserId: 'user-manager-1',
    activeFrom: now,
    activeTo: null,
    createdAt: now,
  });
  deps.state.roleAssignments.push({
    id: 'ra-manager-branch-1',
    userId: 'user-manager-1',
    roleId: 'role-manager',
    branchId: 'branch-q1',
    assignedAt: now,
  });

  const useCase = new LoginWithPasswordUseCase(deps);
  const result = await useCase.execute({ email: 'manager@myfit.local', password: 'ManagerPass123' });
  const claims = deps.tokenService.parseAccessToken(result.accessToken);

  assert.equal(claims.primaryRole, 'MANAGER');
  assert.deepEqual(claims.branchIds, ['branch-q1']);
});

test('login rejects invalid password and records failure event', async () => {
  const deps = await createTestDeps();
  const useCase = new LoginWithPasswordUseCase(deps);

  await assert.rejects(() => useCase.execute({ email: 'admin@myfit.local', password: 'WrongPass123' }), { message: 'INVALID_CREDENTIALS' });
  assert.equal(deps.state.securityEvents.at(-1).eventType, 'login_failed');
});

test('refresh rotates token and revokes old session', async () => {
  const deps = await createTestDeps();
  const login = new LoginWithPasswordUseCase(deps);
  const refresh = new RefreshAccessTokenUseCase(deps);
  const loginResult = await login.execute({ email: 'admin@myfit.local', password: 'AdminPass123' });

  const result = await refresh.execute({ refreshToken: loginResult.refreshToken });

  assert.equal(result.accessToken.split('.').length, 3);
  assert.equal(result.refreshToken.split('.').length, 3);
  assert.equal(deps.state.refreshSessions[0].revokedAt instanceof Date, true);
  assert.equal(deps.state.refreshSessions.length, 2);
});

test('logout revokes the current refresh session', async () => {
  const deps = await createTestDeps();
  const login = new LoginWithPasswordUseCase(deps);
  const logout = new LogoutCurrentSessionUseCase(deps);
  const loginResult = await login.execute({ email: 'admin@myfit.local', password: 'AdminPass123' });

  await logout.execute({ refreshToken: loginResult.refreshToken });

  assert.equal(deps.state.refreshSessions[0].revokedAt instanceof Date, true);
  assert.equal(deps.state.securityEvents.at(-1).eventType, 'logout_success');
});

test('forgot password is silent for unknown email and creates token for known account', async () => {
  const deps = await createTestDeps();
  const useCase = new RequestPasswordResetUseCase(deps);

  const known = await useCase.execute({ email: 'admin@myfit.local' });
  const unknown = await useCase.execute({ email: 'missing@example.com' });

  assert.equal(known.accepted, true);
  assert.equal(unknown.accepted, true);
  assert.equal(deps.state.passwordResetTokens.length, 1);
  assert.equal(deps.state.securityEvents.filter((item) => item.eventType === 'password_reset_requested').length, 2);
});

test('reset password consumes token and revokes active sessions', async () => {
  const deps = await createTestDeps();
  const login = new LoginWithPasswordUseCase(deps);
  const resetRequest = new RequestPasswordResetUseCase(deps);
  const reset = new ResetPasswordUseCase(deps);

  await login.execute({ email: 'admin@myfit.local', password: 'AdminPass123' });
  await resetRequest.execute({ email: 'admin@myfit.local' });
  const token = deps.state.passwordResetTokens[0].token;

  await reset.execute({ token, newPassword: 'AdminPass456' });

  assert.equal(deps.state.passwordResetTokens[0].usedAt instanceof Date, true);
  assert.equal(deps.state.refreshSessions[0].revokedAt instanceof Date, true);
  assert.equal(deps.state.securityEvents.at(-1).eventType, 'password_reset_completed');
  const relogin = await login.execute({ email: 'admin@myfit.local', password: 'AdminPass456' });
  assert.equal(typeof relogin.accessToken, 'string');
});
