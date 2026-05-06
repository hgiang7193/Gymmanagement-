const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../../src/app');
const { createTestDeps, seedUser } = require('../../src/shared/infrastructure/test-deps');

async function startGymOperationsApp() {
  const deps = await createTestDeps();
  installGymOperationsTestDeps(deps);

  await seedUser(deps.state, deps, {
    id: 'user-coach-1',
    email: 'coach@example.com',
    password: 'CoachPass123',
    fullName: 'Coach User',
    roleCode: 'COACH',
  });
  await seedUser(deps.state, deps, {
    id: 'user-coach-2',
    email: 'coach-two@example.com',
    password: 'CoachPass123',
    fullName: 'Second Coach',
    roleCode: 'COACH',
  });
  await seedUser(deps.state, deps, {
    id: 'user-member-1',
    email: 'member@example.com',
    password: 'MemberPass123',
    fullName: 'Member User',
    roleCode: 'MEMBER',
  });

  const app = createApp({ deps });
  await app.start();
  return app;
}

function installGymOperationsTestDeps(deps) {
  const { state } = deps;
  state.roles.push({ id: 'role-coach', code: 'COACH', name: 'Coach' });
  state.shifts = [];
  state.trainerAssignments = [];
  state.coursePackages = [
    {
      id: 'pkg-course-30',
      code: 'COURSE-30',
      name: 'Course 30',
      totalSessions: 30,
      pricePerSession: 150000,
      totalPrice: 4500000,
      isActive: true,
    },
  ];
  state.courseEnrollments = [];
  state.classAttendance = [];

  if (!deps.idGenerator.generate) {
    deps.idGenerator.generate = () => deps.idGenerator.next('id');
  }

  function roleCodeForUser(userId) {
    const assignedRoleCodes = state.roleAssignments
      .filter((item) => item.userId === userId)
      .map((item) => state.roles.find((role) => role.id === item.roleId)?.code)
      .filter(Boolean);
    return ['ADMIN', 'MANAGER', 'COACH', 'MEMBER', 'GUEST'].find((code) => assignedRoleCodes.includes(code)) ?? null;
  }

  deps.roleAssignmentRepository.findPrimaryRoleForUser = async (userId) => roleCodeForUser(userId);
  deps.userRepository.getUserRole = async (userId) => {
    const code = roleCodeForUser(userId);
    return state.roles.find((role) => role.code === code) ?? null;
  };

  deps.shiftRepository = {
    async upsert(shift) {
      const existingIndex = state.shifts.findIndex(
        (item) => item.branchId === shift.branchId && item.date === shift.date && item.shiftCode === shift.shiftCode
      );
      if (existingIndex >= 0) {
        state.shifts[existingIndex] = { ...state.shifts[existingIndex], ...shift };
        return state.shifts[existingIndex];
      }
      state.shifts.push(shift);
      return shift;
    },
    async findById(id) {
      return state.shifts.find((item) => item.id === id) ?? null;
    },
    async findByBranchAndDate(branchId, date) {
      return state.shifts
        .filter((item) => item.branchId === branchId && item.date === date)
        .sort((left, right) => left.startAt - right.startAt);
    },
  };

  deps.trainerAssignmentRepository = {
    async createAssignment(assignment) {
      const saved = {
        ...assignment,
        assignedAt: deps.clock.now(),
        unassignedAt: null,
      };
      state.trainerAssignments.push(saved);
      return saved;
    },
    async getActiveAssignment(trainerUserId, shiftId) {
      return state.trainerAssignments.find(
        (item) => item.trainerUserId === trainerUserId && item.shiftId === shiftId && !item.unassignedAt
      ) ?? null;
    },
    async getActiveAssignmentCount(shiftId) {
      return state.trainerAssignments.filter((item) => item.shiftId === shiftId && !item.unassignedAt).length;
    },
    async getActiveAssignmentsByShiftIds(shiftIds) {
      return state.trainerAssignments.filter((item) => shiftIds.includes(item.shiftId) && !item.unassignedAt);
    },
    async unassignCoach(assignmentId) {
      const assignment = state.trainerAssignments.find((item) => item.id === assignmentId);
      if (assignment) assignment.unassignedAt = deps.clock.now();
    },
    async isCoachAllowedForBranch(coachId, branchId) {
      const coachAssignments = state.trainerAssignments.filter((item) => item.trainerUserId === coachId);
      if (coachAssignments.length === 0) return true;
      return coachAssignments.some((item) => item.branchId === branchId && !item.unassignedAt);
    },
  };

  deps.coursePackageRepository = {
    async findById(id) {
      return state.coursePackages.find((item) => item.id === id) ?? null;
    },
    async listActive() {
      return state.coursePackages.filter((item) => item.isActive);
    },
  };

  deps.courseEnrollmentRepository = {
    async create(enrollment) {
      state.courseEnrollments.push(enrollment);
      return enrollment;
    },
    async findById(id) {
      return state.courseEnrollments.find((item) => item.id === id) ?? null;
    },
    async findActiveByUser(userId) {
      return state.courseEnrollments.find((item) => item.userId === userId && item.status === 'ACTIVE') ?? null;
    },
    async findByUser(userId) {
      return state.courseEnrollments
        .filter((item) => item.userId === userId)
        .map((item) => {
          const coursePackage = state.coursePackages.find((pkg) => pkg.id === item.coursePackageId);
          return {
            ...item,
            packageName: coursePackage?.name,
            packageTotalSessions: coursePackage?.totalSessions,
          };
        });
    },
    async decrementSessionsRemaining(enrollmentId) {
      const enrollment = state.courseEnrollments.find((item) => item.id === enrollmentId);
      if (!enrollment || enrollment.sessionsRemaining <= 0) return;
      enrollment.sessionsRemaining -= 1;
      enrollment.sessionsAttended += 1;
      enrollment.updatedAt = deps.clock.now();
    },
    async completeEnrollment(enrollmentId) {
      const enrollment = state.courseEnrollments.find((item) => item.id === enrollmentId);
      if (!enrollment) return;
      enrollment.status = 'COMPLETED';
      enrollment.completedAt = deps.clock.now();
      enrollment.updatedAt = deps.clock.now();
    },
  };

  deps.classAttendanceRepository = {
    async create(attendance) {
      state.classAttendance.push(attendance);
      return attendance;
    },
    async findByUserAndShift(userId, shiftId) {
      return state.classAttendance.find((item) => item.userId === userId && item.shiftId === shiftId) ?? null;
    },
    async findByUser(userId) {
      return state.classAttendance
        .filter((item) => item.userId === userId)
        .map((item) => {
          const shift = state.shifts.find((entry) => entry.id === item.shiftId);
          return {
            ...item,
            shiftCode: shift?.shiftCode,
            date: shift?.date,
            startAt: shift?.startAt,
            endAt: shift?.endAt,
          };
        });
    },
  };
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

function addShift(app, branchId, overrides = {}) {
  const date = overrides.date ?? '2026-03-28';
  const shift = {
    id: overrides.id ?? app.deps.idGenerator.next('shift'),
    branchId,
    shiftCode: overrides.shiftCode ?? 'MORNING_1',
    date,
    startAt: overrides.startAt ?? new Date(`${date}T05:30:00+07:00`),
    endAt: overrides.endAt ?? new Date(`${date}T06:30:00+07:00`),
    coachCapacity: overrides.coachCapacity ?? 3,
    createdAt: app.deps.clock.now(),
    updatedAt: app.deps.clock.now(),
  };
  app.deps.state.shifts.push(shift);
  return shift;
}

test('coach can assign to an open shift and duplicate assignment is blocked', async () => {
  const app = await startGymOperationsApp();
  try {
    const adminAccessToken = await login(app, 'admin@myfit.local', 'AdminPass123');
    const branch = await createBranch(app, adminAccessToken, 'HCM-Q1');
    const shift = addShift(app, branch.id);
    const coachAccessToken = await login(app, 'coach@example.com', 'CoachPass123');

    const assignResponse = await fetch(`${app.baseUrl}/api/v1/coach/shifts/${shift.id}/assign`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${coachAccessToken}`,
      },
      body: JSON.stringify({ note: 'Available for class' }),
    });
    const assignBody = await assignResponse.json();

    assert.equal(assignResponse.status, 201);
    assert.equal(assignBody.data.shiftId, shift.id);
    assert.equal(assignBody.data.coachId, 'user-coach-1');
    assert.equal(assignBody.data.coachCount, 1);

    const duplicateResponse = await fetch(`${app.baseUrl}/api/v1/coach/shifts/${shift.id}/assign`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${coachAccessToken}`,
      },
      body: JSON.stringify({ note: 'Duplicate' }),
    });
    const duplicateBody = await duplicateResponse.json();

    assert.equal(duplicateResponse.status, 409);
    assert.equal(duplicateBody.error.code, 'SHIFT_ASSIGNMENT_EXISTS');
  } finally {
    await app.stop();
  }
});

test('coach shift routes enforce branch access and query validation', async () => {
  const app = await startGymOperationsApp();
  try {
    const adminAccessToken = await login(app, 'admin@myfit.local', 'AdminPass123');
    const firstBranch = await createBranch(app, adminAccessToken, 'HCM-Q1');
    const secondBranch = await createBranch(app, adminAccessToken, 'HCM-Q3');
    const firstShift = addShift(app, firstBranch.id, { id: 'shift-first-branch' });
    const secondShift = addShift(app, secondBranch.id, { id: 'shift-second-branch' });
    const coachAccessToken = await login(app, 'coach@example.com', 'CoachPass123');

    const missingQueryResponse = await fetch(`${app.baseUrl}/api/v1/coach/shifts`, {
      headers: { authorization: `Bearer ${coachAccessToken}` },
    });
    const missingQueryBody = await missingQueryResponse.json();

    assert.equal(missingQueryResponse.status, 400);
    assert.equal(missingQueryBody.error.code, 'VALIDATION_ERROR');

    const assignResponse = await fetch(`${app.baseUrl}/api/v1/coach/shifts/${firstShift.id}/assign`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${coachAccessToken}`,
      },
      body: JSON.stringify({}),
    });
    assert.equal(assignResponse.status, 201);

    const crossBranchResponse = await fetch(`${app.baseUrl}/api/v1/coach/shifts/${secondShift.id}/assign`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${coachAccessToken}`,
      },
      body: JSON.stringify({}),
    });
    const crossBranchBody = await crossBranchResponse.json();

    assert.equal(crossBranchResponse.status, 403);
    assert.equal(crossBranchBody.error.code, 'COACH_NOT_ALLOWED_FOR_BRANCH');
  } finally {
    await app.stop();
  }
});

test('manager can enroll a member in a course and duplicate active enrollment is blocked', async () => {
  const app = await startGymOperationsApp();
  try {
    const adminAccessToken = await login(app, 'admin@myfit.local', 'AdminPass123');
    const branch = await createBranch(app, adminAccessToken, 'HCM-Q1');
    const managerAccessToken = await login(app, 'manager@myfit.local', 'ManagerPass123');

    const enrollResponse = await fetch(`${app.baseUrl}/api/v1/manager/course-enrollments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({
        userId: 'user-member-1',
        coursePackageId: 'pkg-course-30',
        branchId: branch.id,
      }),
    });
    const enrollBody = await enrollResponse.json();

    assert.equal(enrollResponse.status, 201);
    assert.equal(enrollBody.data.userId, 'user-member-1');
    assert.equal(enrollBody.data.status, 'ACTIVE');
    assert.equal(enrollBody.data.totalSessions, 30);
    assert.equal(enrollBody.data.sessionsRemaining, 30);

    const memberAccessToken = await login(app, 'member@example.com', 'MemberPass123');
    const listResponse = await fetch(`${app.baseUrl}/api/v1/member/enrollments`, {
      headers: { authorization: `Bearer ${memberAccessToken}` },
    });
    const listBody = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listBody.data.length, 1);
    assert.equal(listBody.data[0].coursePackageId, 'pkg-course-30');

    const duplicateResponse = await fetch(`${app.baseUrl}/api/v1/manager/course-enrollments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({
        userId: 'user-member-1',
        coursePackageId: 'pkg-course-30',
        branchId: branch.id,
      }),
    });
    const duplicateBody = await duplicateResponse.json();

    assert.equal(duplicateResponse.status, 409);
    assert.equal(duplicateBody.error.code, 'ACTIVE_ENROLLMENT_EXISTS');
  } finally {
    await app.stop();
  }
});

test('manager can check a course member into class and duplicate check-in is blocked', async () => {
  const app = await startGymOperationsApp();
  try {
    const adminAccessToken = await login(app, 'admin@myfit.local', 'AdminPass123');
    const branch = await createBranch(app, adminAccessToken, 'HCM-Q1');
    const shift = addShift(app, branch.id);
    const managerAccessToken = await login(app, 'manager@myfit.local', 'ManagerPass123');

    const noEnrollmentResponse = await fetch(`${app.baseUrl}/api/v1/manager/check-ins/class`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({
        userId: 'user-member-1',
        shiftId: shift.id,
        branchId: branch.id,
      }),
    });
    const noEnrollmentBody = await noEnrollmentResponse.json();
    assert.equal(noEnrollmentResponse.status, 409);
    assert.equal(noEnrollmentBody.error.code, 'NO_ACTIVE_ENROLLMENT');

    await fetch(`${app.baseUrl}/api/v1/manager/course-enrollments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({
        userId: 'user-member-1',
        coursePackageId: 'pkg-course-30',
        branchId: branch.id,
      }),
    });

    const checkInResponse = await fetch(`${app.baseUrl}/api/v1/manager/check-ins/class`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({
        userId: 'user-member-1',
        shiftId: shift.id,
        branchId: branch.id,
      }),
    });
    const checkInBody = await checkInResponse.json();

    assert.equal(checkInResponse.status, 201);
    assert.equal(checkInBody.data.userId, 'user-member-1');
    assert.equal(checkInBody.data.shiftId, shift.id);
    assert.equal(checkInBody.data.status, 'PRESENT');
    assert.equal(checkInBody.data.sessionsAttended, 1);
    assert.equal(checkInBody.data.sessionsRemaining, 29);

    const memberAccessToken = await login(app, 'member@example.com', 'MemberPass123');
    const attendanceResponse = await fetch(`${app.baseUrl}/api/v1/member/attendance`, {
      headers: { authorization: `Bearer ${memberAccessToken}` },
    });
    const attendanceBody = await attendanceResponse.json();

    assert.equal(attendanceResponse.status, 200);
    assert.equal(attendanceBody.data.length, 1);
    assert.equal(attendanceBody.data[0].shiftId, shift.id);

    const duplicateResponse = await fetch(`${app.baseUrl}/api/v1/manager/check-ins/class`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${managerAccessToken}`,
      },
      body: JSON.stringify({
        userId: 'user-member-1',
        shiftId: shift.id,
        branchId: branch.id,
      }),
    });
    const duplicateBody = await duplicateResponse.json();

    assert.equal(duplicateResponse.status, 409);
    assert.equal(duplicateBody.error.code, 'DUPLICATE_CHECKIN');
  } finally {
    await app.stop();
  }
});
