const { Argon2PasswordHasher } = require('../security/argon2-password-hasher');
const { JwtTokenService } = require('../security/jwt-token-service');
const { IdGenerator } = require('./id-generator');
const { NoopVerificationService } = require('./noop-verification-service');

const ROLE_PRIORITY = ['ADMIN', 'MANAGER', 'MEMBER', 'GUEST'];

function createTestState() {
  const now = new Date('2026-03-27T09:00:00.000Z');
  return {
    users: [],
    profiles: [],
    roles: [
      { id: 'role-guest', code: 'GUEST', name: 'Guest' },
      { id: 'role-member', code: 'MEMBER', name: 'Member' },
      { id: 'role-coach', code: 'COACH', name: 'Coach' },
      { id: 'role-manager', code: 'MANAGER', name: 'Manager' },
      { id: 'role-admin', code: 'ADMIN', name: 'Admin' },
    ],
    roleAssignments: [],
    refreshSessions: [],
    passwordResetTokens: [],
    securityEvents: [],
    auditLogs: [],
    verificationEmails: [],
    branches: [],
    branchManagerAssignments: [],
    membershipPlans: [
      {
        id: 'plan-basic-1',
        code: 'BASIC-12',
        name: 'Basic 12 Sessions',
        price: 1200000,
        durationDays: 30,
        totalSessions: 12,
        isActive: true,
        createdAt: now,
      },
    ],
    subscriptions: [],
    subscriptionStatusHistory: [],
    trialBookings: [],
    trialStatusHistory: [],
  };
}

function createClock() {
  let current = new Date('2026-03-27T10:00:00.000Z');
  return {
    now() {
      return new Date(current);
    },
    set(value) {
      current = new Date(value);
    },
  };
}

async function seedUser(state, deps, input) {
  const now = deps.clock.now();
  const role = state.roles.find((item) => item.code === input.roleCode);
  const passwordHash = await deps.passwordHasher.hash(input.password);
  const user = {
    id: input.id,
    email: input.email,
    passwordHash,
    status: input.status ?? 'ACTIVE',
    emailVerifiedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  state.users.push(user);
  state.profiles.push({
    id: `profile-${input.id}`,
    userId: input.id,
    fullName: input.fullName,
    createdAt: now,
    updatedAt: now,
  });
  state.roleAssignments.push({
    id: `ra-${input.id}-${role.code.toLowerCase()}`,
    userId: input.id,
    roleId: role.id,
    branchId: input.branchId ?? null,
    assignedAt: now,
  });
  return user;
}

async function seedDefaultUsers(state, deps) {
  await seedUser(state, deps, {
    id: 'user-admin-1',
    email: 'admin@myfit.local',
    password: 'AdminPass123',
    fullName: 'System Admin',
    roleCode: 'ADMIN',
  });
  await seedUser(state, deps, {
    id: 'user-manager-1',
    email: 'manager@myfit.local',
    password: 'ManagerPass123',
    fullName: 'Branch Manager',
    roleCode: 'MANAGER',
  });
}

async function createTestDeps() {
  const state = createTestState();
  const verificationService = new NoopVerificationService(state.verificationEmails);
  const deps = {
    state,
    idGenerator: new IdGenerator(),
    clock: createClock(),
    passwordHasher: new Argon2PasswordHasher(),
    tokenService: new JwtTokenService({
      accessTokenSecret: 'test-access-secret',
      refreshTokenSecret: 'test-refresh-secret',
      accessTokenTtl: '15m',
      refreshTokenTtl: '30d',
    }),
    verificationService,
    userRepository: {
      async findByEmail(email) { return state.users.find((item) => item.email === email) ?? null; },
      async findById(id) { return state.users.find((item) => item.id === id) ?? null; },
      async save(user) { state.users.push(user); return user; },
      async update(user) {
        const index = state.users.findIndex((item) => item.id === user.id);
        state.users[index] = user;
        return user;
      },
      async list() {
        return state.users.map((user) => ({ id: user.id, email: user.email, status: user.status }));
      },
    },
    profileRepository: {
      async save(profile) { state.profiles.push(profile); return profile; },
      async findByUserId(userId) { return state.profiles.find((item) => item.userId === userId) ?? null; },
    },
    roleRepository: {
      async findByCode(code) { return state.roles.find((item) => item.code === code) ?? null; },
    },
    roleAssignmentRepository: {
      async assign(roleAssignment) { state.roleAssignments.push(roleAssignment); return roleAssignment; },
      async findPrimaryRoleForUser(userId) {
        const roleCodes = state.roleAssignments
          .filter((item) => item.userId === userId)
          .map((item) => state.roles.find((role) => role.id === item.roleId)?.code)
          .filter(Boolean);
        return ROLE_PRIORITY.find((code) => roleCodes.includes(code)) ?? null;
      },
      async listBranchIdsForUser(userId) {
        return state.roleAssignments
          .filter((item) => item.userId === userId && item.branchId)
          .map((item) => item.branchId);
      },
      async listForUser(userId) {
        return state.roleAssignments
          .filter((item) => item.userId === userId)
          .map((item) => {
            const role = state.roles.find((r) => r.id === item.roleId);
            return { ...item, roleCode: role?.code ?? null, roleName: role?.name ?? null };
          });
      },
      async findByUserRoleBranch(userId, roleId, branchId) {
        return state.roleAssignments.find(
          (item) => item.userId === userId && item.roleId === roleId && (item.branchId ?? null) === (branchId ?? null)
        ) ?? null;
      },
      async deleteById(id) {
        const index = state.roleAssignments.findIndex((item) => item.id === id);
        if (index >= 0) state.roleAssignments.splice(index, 1);
      },
      async countActiveUsersByRoleCode(roleCode) {
        const role = state.roles.find((item) => item.code === roleCode);
        if (!role) return 0;
        const userIds = new Set(
          state.roleAssignments
            .filter((item) => item.roleId === role.id)
            .map((item) => item.userId)
        );
        return state.users.filter((u) => userIds.has(u.id) && u.status === 'ACTIVE').length;
      },
    },
    refreshSessionRepository: {
      async create(session) { state.refreshSessions.push(session); return session; },
      async findByToken(token) { return state.refreshSessions.find((item) => item.token === token) ?? null; },
      async revokeById(id, revokedAt) {
        const session = state.refreshSessions.find((item) => item.id === id);
        if (session) session.revokedAt = revokedAt;
      },
      async revokeAllForUser(userId, revokedAt) {
        state.refreshSessions
          .filter((item) => item.userId === userId && !item.revokedAt)
          .forEach((item) => { item.revokedAt = revokedAt; });
      },
    },
    passwordResetTokenRepository: {
      async create(token) { state.passwordResetTokens.push(token); return token; },
      async findByToken(token) { return state.passwordResetTokens.find((item) => item.token === token) ?? null; },
      async markUsed(id, usedAt) {
        const resetToken = state.passwordResetTokens.find((item) => item.id === id);
        if (resetToken) resetToken.usedAt = usedAt;
      },
    },
    securityEventRepository: {
      async append(event) {
        state.securityEvents.push({
          id: event.id ?? deps.idGenerator.next('security-event'),
          severity: event.severity ?? 'info',
          metadata: event.metadata ?? {},
          ...event,
        });
      },
    },
    auditLogRepository: {
      async append(event) {
        state.auditLogs.push({
          id: event.id ?? deps.idGenerator.next('audit'),
          metadata: event.metadata ?? {},
          ...event,
        });
      },
    },
    branchRepository: {
      async create(branch) { state.branches.push(branch); return branch; },
      async list() { return [...state.branches]; },
      async findByCode(code) { return state.branches.find((item) => item.code === code) ?? null; },
      async findById(id) { return state.branches.find((item) => item.id === id) ?? null; },
      async listByIds(branchIds) { return state.branches.filter((item) => branchIds.includes(item.id)); },
      async update(branch) {
        const index = state.branches.findIndex((item) => item.id === branch.id);
        if (index < 0) return null;
        state.branches[index] = branch;
        return branch;
      },
      async countActiveSubscriptions(branchId) {
        return state.subscriptions.filter(
          (item) => item.homeBranchId === branchId && item.status === 'ACTIVE'
        ).length;
      },
    },
    branchManagerAssignmentRepository: {
      async assign(assignment) { state.branchManagerAssignments.push(assignment); return assignment; },
      async listBranchIdsForManager(managerUserId) {
        return state.branchManagerAssignments
          .filter((item) => item.managerUserId === managerUserId && !item.activeTo)
          .map((item) => item.branchId);
      },
      async isManagerOfBranch(managerUserId, branchId) {
        return state.branchManagerAssignments.some(
          (item) => item.managerUserId === managerUserId && item.branchId === branchId && !item.activeTo
        );
      },
    },
    membershipPlanRepository: {
      async listActive() { return state.membershipPlans.filter((item) => item.isActive); },
      async findById(id) { return state.membershipPlans.find((item) => item.id === id) ?? null; },
    },
    subscriptionRepository: {
      async findActiveByUserId(userId) {
        return state.subscriptions.find((item) => item.userId === userId && item.status === 'ACTIVE') ?? null;
      },
      async findCurrentByUserId(userId) {
        return state.subscriptions
          .filter((item) => item.userId === userId)
          .sort((left, right) => right.activatedAt - left.activatedAt)[0] ?? null;
      },
      async create(subscription) { state.subscriptions.push(subscription); return subscription; },
      async update(subscription) {
        const index = state.subscriptions.findIndex((item) => item.id === subscription.id);
        state.subscriptions[index] = subscription;
        return subscription;
      },
    },
    subscriptionStatusHistoryRepository: {
      async append(entry) { state.subscriptionStatusHistory.push(entry); },
    },
    trialBookingRepository: {
      async create(trialBooking) { state.trialBookings.push(trialBooking); return trialBooking; },
      async findById(id) { return state.trialBookings.find((item) => item.id === id) ?? null; },
      async listByBranchIds(branchIds) { return state.trialBookings.filter((item) => branchIds.includes(item.branchId)); },
      async update(trialBooking) {
        const index = state.trialBookings.findIndex((item) => item.id === trialBooking.id);
        state.trialBookings[index] = trialBooking;
        return trialBooking;
      },
    },
    trialStatusHistoryRepository: {
      async append(entry) { state.trialStatusHistory.push(entry); },
    },
  };

  await seedDefaultUsers(state, deps);
  return deps;
}

module.exports = { createTestDeps, seedUser };
