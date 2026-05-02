const fs = require('fs');

const requires = `const express = require('express');
const cors = require('cors');
const { RegisterGuestUseCase } = require('./identity-access/application/register-guest');
const { LoginWithPasswordUseCase } = require('./identity-access/application/login-with-password');
const { RefreshAccessTokenUseCase } = require('./identity-access/application/refresh-access-token');
const { LogoutCurrentSessionUseCase } = require('./identity-access/application/logout-current-session');
const { RequestPasswordResetUseCase } = require('./identity-access/application/request-password-reset');
const { ResetPasswordUseCase } = require('./identity-access/application/reset-password');
const { CreateBranchUseCase } = require('./branch-admin/application/create-branch');
const { ListBranchesUseCase } = require('./branch-admin/application/list-branches');
const { ListUsersUseCase } = require('./branch-admin/application/list-users');
const { UpdateUserStatusUseCase } = require('./branch-admin/application/update-user-status');
const { AssignBranchManagerUseCase } = require('./branch-admin/application/assign-branch-manager');
const { ListManagerBranchesUseCase } = require('./branch-admin/application/list-manager-branches');
const { ActivateMembershipUseCase } = require('./membership/application/activate-membership');
const { GetMySubscriptionUseCase } = require('./membership/application/get-my-subscription');
const { ListMembershipPlansUseCase } = require('./membership/application/list-membership-plans');
const { CreateTrialBookingUseCase } = require('./trial-booking/application/create-trial-booking');
const { ListManagerTrialsUseCase } = require('./trial-booking/application/list-manager-trials');
const { UpdateTrialStatusUseCase } = require('./trial-booking/application/update-trial-status');
const { ConvertTrialToMemberUseCase } = require('./trial-booking/application/convert-trial-to-member');
const { CreateOrganizationUseCase } = require('./gym-operations/application/create-organization');
const { RegisterStaffUseCase } = require('./gym-operations/application/register-staff');
const { CheckInMemberUseCase } = require('./gym-operations/application/check-in-member');
const { BookPtSessionUseCase } = require('./gym-operations/application/book-pt-session');
const { UpdateHealthProfileUseCase } = require('./health-tracking/application/update-health-profile');
const { LogWeightUseCase } = require('./health-tracking/application/log-weight');
const { LogBodyMeasurementUseCase } = require('./health-tracking/application/log-body-measurement');
const { GetMemberProgressUseCase } = require('./health-tracking/application/get-member-progress');
const { CreateInvoiceUseCase } = require('./billing/application/create-invoice');
const { RecordPaymentUseCase } = require('./billing/application/record-payment');
const { ViewCoachShiftsUseCase } = require('./gym-operations/application/view-coach-shifts');
const { AssignCoachToShiftUseCase } = require('./gym-operations/application/assign-coach-to-shift');
const { UnassignCoachFromShiftUseCase } = require('./gym-operations/application/unassign-coach-from-shift');
const { EnrollMemberInCourseUseCase } = require('./gym-operations/application/enroll-member-in-course');
const { CheckInMemberToClassUseCase } = require('./gym-operations/application/check-in-member-to-class');
const { createRuntimeDeps } = require('./shared/infrastructure/create-runtime-deps');`;

const content = `${requires}

function createApp(options = {}) {
  const deps = options.deps ?? createRuntimeDeps();
  const app = express();
  app.use(cors());
  app.use(express.json());

  const registerGuest = new RegisterGuestUseCase(deps);
  const loginWithPassword = new LoginWithPasswordUseCase(deps);
  const refreshAccessToken = new RefreshAccessTokenUseCase(deps);
  const logoutCurrentSession = new LogoutCurrentSessionUseCase(deps);
  const requestPasswordReset = new RequestPasswordResetUseCase(deps);
  const resetPassword = new ResetPasswordUseCase(deps);
  const createBranch = new CreateBranchUseCase(deps);
  const listBranches = new ListBranchesUseCase(deps);
  const listUsers = new ListUsersUseCase(deps);
  const updateUserStatus = new UpdateUserStatusUseCase(deps);
  const assignBranchManager = new AssignBranchManagerUseCase(deps);
  const listManagerBranches = new ListManagerBranchesUseCase(deps);
  const activateMembership = new ActivateMembershipUseCase(deps);
  const getMySubscription = new GetMySubscriptionUseCase(deps);
  const listMembershipPlans = new ListMembershipPlansUseCase(deps);
  const createTrialBooking = new CreateTrialBookingUseCase(deps);
  const listManagerTrials = new ListManagerTrialsUseCase(deps);
  const updateTrialStatus = new UpdateTrialStatusUseCase(deps);
  const convertTrialToMember = new ConvertTrialToMemberUseCase(deps);
  const createOrganization = new CreateOrganizationUseCase(deps);
  const registerStaff = new RegisterStaffUseCase(deps);
  const checkInMember = new CheckInMemberUseCase(deps);
  const bookPtSession = new BookPtSessionUseCase(deps);
  const updateHealthProfile = new UpdateHealthProfileUseCase(deps);
  const logWeight = new LogWeightUseCase(deps);
  const logBodyMeasurement = new LogBodyMeasurementUseCase(deps);
  const getMemberProgress = new GetMemberProgressUseCase(deps);
  const createInvoice = new CreateInvoiceUseCase(deps);
  const recordPayment = new RecordPaymentUseCase(deps);
  const viewCoachShifts = new ViewCoachShiftsUseCase(deps);
  const assignCoachToShift = new AssignCoachToShiftUseCase(deps);
  const unassignCoachFromShift = new UnassignCoachFromShiftUseCase(deps);
  const enrollMemberInCourse = new EnrollMemberInCourseUseCase(deps);
  const checkInMemberToClass = new CheckInMemberToClassUseCase(deps);

  function getBearerToken(req) {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;
    return header.slice(7);
  }

  function requireRole(roles) {
    return (req, res, next) => {
      const token = getBearerToken(req);
      if (!token) return res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' }, meta: {} });
      const auth = deps.tokenService.parseAccessToken(token);
      if (!auth) return res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' }, meta: {} });
      if (roles && roles.length > 0) {
        if (!roles.includes(auth.primaryRole)) {
          return res.status(403).json({ data: null, error: { code: 'FORBIDDEN', message: 'Forbidden' }, meta: {} });
        }
      }
      req.auth = auth;
      next();
    };
  }

  const requireAuthenticated = requireRole();
  const requireAdmin = requireRole(['ADMIN']);
  const requireManager = requireRole(['MANAGER', 'ADMIN']);
  const requireCoach = requireRole(['COACH', 'ADMIN']);

  const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  const v1 = express.Router();

  v1.post('/auth/register', asyncHandler(async (req, res) => {
    const result = await registerGuest.execute(req.body);
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/auth/login', asyncHandler(async (req, res) => {
    const result = await loginWithPassword.execute(req.body);
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/auth/refresh', asyncHandler(async (req, res) => {
    const result = await refreshAccessToken.execute(req.body);
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/auth/logout', asyncHandler(async (req, res) => {
    await logoutCurrentSession.execute(req.body);
    res.status(200).json({ data: { success: true }, error: null, meta: {} });
  }));

  v1.post('/auth/forgot-password', asyncHandler(async (req, res) => {
    const result = await requestPasswordReset.execute(req.body);
    res.status(202).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/auth/reset-password', asyncHandler(async (req, res) => {
    await resetPassword.execute(req.body);
    res.status(200).json({ data: { success: true }, error: null, meta: {} });
  }));

  v1.get('/admin/branches', requireAdmin, asyncHandler(async (req, res) => {
    const result = await listBranches.execute();
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/admin/branches', requireAdmin, asyncHandler(async (req, res) => {
    const result = await createBranch.execute({ ...req.body, actorUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/admin/branches/:branchId/managers', requireAdmin, asyncHandler(async (req, res) => {
    const result = await assignBranchManager.execute({
      branchId: req.params.branchId,
      managerUserId: req.body.managerUserId,
      actorUserId: req.auth.userId,
    });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.get('/admin/users', requireAdmin, asyncHandler(async (req, res) => {
    const result = await listUsers.execute();
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.patch('/admin/users/:userId/status', requireAdmin, asyncHandler(async (req, res) => {
    const result = await updateUserStatus.execute({ userId: req.params.userId, status: req.body.status, actorUserId: req.auth.userId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.get('/manager/branches', requireManager, asyncHandler(async (req, res) => {
    const result = await listManagerBranches.execute({ managerUserId: req.auth.userId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/trials', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await createTrialBooking.execute({
      actorUserId: req.auth.userId,
      ...req.body
    });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.get('/membership-plans', asyncHandler(async (req, res) => {
    const result = await listMembershipPlans.execute();
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.get('/me/subscription', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await getMySubscription.execute({ userId: req.auth.userId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.get('/memberships/me', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await getMySubscription.execute({ userId: req.auth.userId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/manager/memberships/activate', requireManager, asyncHandler(async (req, res) => {
    const result = await activateMembership.execute({
      ...req.body,
      actorUserId: req.auth.userId,
    });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.get('/manager/trials', requireManager, asyncHandler(async (req, res) => {
    const result = await listManagerTrials.execute({ managerUserId: req.auth.userId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.patch('/manager/trials/:trialBookingId/status', requireManager, asyncHandler(async (req, res) => {
    const result = await updateTrialStatus.execute({
      trialBookingId: req.params.trialBookingId,
      status: req.body.status,
      actorUserId: req.auth.userId,
    });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/manager/trials/:trialBookingId/convert', requireManager, asyncHandler(async (req, res) => {
    const result = await convertTrialToMember.execute({
      trialBookingId: req.params.trialBookingId,
      ...req.body,
      actorUserId: req.auth.userId,
    });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/trials/:trialBookingId/convert', requireManager, asyncHandler(async (req, res) => {
    const result = await convertTrialToMember.execute({
      trialBookingId: req.params.trialBookingId,
      ...req.body,
      actorUserId: req.auth.userId,
    });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/admin/organizations', requireAdmin, asyncHandler(async (req, res) => {
    const result = await createOrganization.execute(req.body);
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/admin/staff', requireAdmin, asyncHandler(async (req, res) => {
    const result = await registerStaff.execute(req.body);
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/manager/check-ins', requireManager, asyncHandler(async (req, res) => {
    const result = await checkInMember.execute({ ...req.body, actorUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/manager/pt-sessions', requireManager, asyncHandler(async (req, res) => {
    const result = await bookPtSession.execute(req.body);
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.put('/health/profile', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await updateHealthProfile.execute({ ...req.body, userId: req.auth.userId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/health/weight', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await logWeight.execute({ ...req.body, userId: req.auth.userId, actorUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/health/measurements', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await logBodyMeasurement.execute({ ...req.body, userId: req.auth.userId, actorUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.get('/health/progress', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await getMemberProgress.execute({ userId: req.auth.userId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/billing/invoices', requireManager, asyncHandler(async (req, res) => {
    const result = await createInvoice.execute(req.body);
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/billing/payments', requireManager, asyncHandler(async (req, res) => {
    const result = await recordPayment.execute({ ...req.body, actorUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.get('/coach/shifts', requireCoach, asyncHandler(async (req, res) => {
    const { branch_id, date } = req.query;
    if (!branch_id || !date) {
      return res.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'branch_id and date are required query parameters' }, meta: {} });
    }
    const result = await viewCoachShifts.execute({ coachId: req.auth.userId, branchId: branch_id, date });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/coach/shifts/:shiftId/assign', requireCoach, asyncHandler(async (req, res) => {
    const result = await assignCoachToShift.execute({ coachId: req.auth.userId, shiftId: req.params.shiftId, note: req.body.note });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.delete('/coach/shifts/:shiftId/assign', requireCoach, asyncHandler(async (req, res) => {
    const result = await unassignCoachFromShift.execute({ coachId: req.auth.userId, shiftId: req.params.shiftId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/manager/course-enrollments', requireManager, asyncHandler(async (req, res) => {
    const result = await enrollMemberInCourse.execute({ ...req.body, actorUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.get('/member/enrollments', requireAuthenticated, asyncHandler(async (req, res) => {
    const userId = req.query.user_id || req.auth.userId;
    if (userId !== req.auth.userId && req.auth.primaryRole === 'MEMBER') {
      return res.status(403).json({ data: null, error: { code: 'FORBIDDEN', message: 'Cannot view other users enrollments' }, meta: {} });
    }
    const enrollments = await deps.courseEnrollmentRepository.findByUser(userId);
    res.status(200).json({ data: enrollments, error: null, meta: {} });
  }));

  v1.post('/manager/check-ins/class', requireManager, asyncHandler(async (req, res) => {
    const result = await checkInMemberToClass.execute({ ...req.body, actorUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.get('/member/attendance', requireAuthenticated, asyncHandler(async (req, res) => {
    const userId = req.query.user_id || req.auth.userId;
    if (userId !== req.auth.userId && req.auth.primaryRole === 'MEMBER') {
      return res.status(403).json({ data: null, error: { code: 'FORBIDDEN', message: 'Cannot view other users attendance' }, meta: {} });
    }
    const attendance = await deps.classAttendanceRepository.findByUser(userId);
    res.status(200).json({ data: attendance, error: null, meta: {} });
  }));

  v1.use((req, res) => {
    res.status(404).json({ data: null, error: { code: 'RESOURCE_NOT_FOUND', message: 'Not found' }, meta: {} });
  });

  v1.use((err, req, res, next) => {
    const code = err?.message || 'INTERNAL_ERROR';
    const status = ['EMAIL_ALREADY_EXISTS', 'BRANCH_CODE_ALREADY_EXISTS', 'SUBSCRIPTION_CONFLICT', 'TRIAL_ALREADY_CONVERTED'].includes(code)
      ? 409
      : ['SHIFT_ASSIGNMENT_EXISTS', 'SHIFT_COACH_CAPACITY_REACHED', 'SHIFT_REQUIRES_AT_LEAST_ONE_COACH'].includes(code)
        ? 409
      : ['ACTIVE_ENROLLMENT_EXISTS', 'NO_ACTIVE_ENROLLMENT', 'NO_SESSIONS_REMAINING', 'DUPLICATE_CHECKIN'].includes(code)
        ? 409
        : ['INVALID_CREDENTIALS', 'INVALID_REFRESH_TOKEN', 'INVALID_RESET_TOKEN'].includes(code)
          ? 401
          : ['USER_NOT_FOUND', 'BRANCH_NOT_FOUND', 'TRIAL_NOT_FOUND', 'SHIFT_NOT_FOUND', 'COURSE_PACKAGE_NOT_FOUND'].includes(code)
            ? 404
            : ['CROSS_BRANCH_ACCESS', 'FORBIDDEN', 'COACH_NOT_ALLOWED_FOR_BRANCH'].includes(code)
              ? 403
              : ['SHIFT_ALREADY_STARTED', 'SHIFT_ALREADY_ENDED'].includes(code)
                ? 422
                : ['MEMBERSHIP_PLAN_NOT_AVAILABLE', 'TRIAL_GUEST_ACCOUNT_REQUIRED'].includes(code)
                  ? 422
                  : 400;
    res.status(status).json({ data: null, error: { code, message: code }, meta: {} });
  });

  app.use('/api/v1', v1);

  let server;

  return {
    deps,
    app,
    async start(options = {}) {
      const port = options.port ?? 0;
      const host = options.host ?? '127.0.0.1';
      await new Promise((resolve) => {
        server = app.listen(port, host, resolve);
      });
      const address = server.address();
      this.baseUrl = 'http://127.0.0.1:' + address.port;
    },
    async stop() {
      if (server) {
        await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
      }
      if (deps.pool?.end) {
        await deps.pool.end();
      }
    },
  };
}

module.exports = { createApp };
`;

fs.writeFileSync('src/app.js', content);
