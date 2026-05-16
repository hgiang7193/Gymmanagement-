const express = require('express');
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
const { UpdateBranchUseCase } = require('./branch-admin/application/update-branch');
const { CloseBranchUseCase } = require('./branch-admin/application/close-branch');
const { AssignRoleUseCase } = require('./branch-admin/application/assign-role');
const { RevokeRoleUseCase } = require('./branch-admin/application/revoke-role');
const { ListUserRolesUseCase } = require('./branch-admin/application/list-user-roles');
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
const { MemberSelfCheckInUseCase } = require('./gym-operations/application/member-self-check-in');
const { GetAvailableShiftsUseCase } = require('./gym-operations/application/get-available-shifts');
const { ManagerDashboardUseCase } = require('./gym-operations/application/manager-dashboard');
const { ListShiftRosterUseCase } = require('./gym-operations/application/list-shift-roster');
const { OverrideCheckInUseCase } = require('./gym-operations/application/override-check-in');
const { CoachProxyCheckInUseCase } = require('./gym-operations/application/coach-proxy-check-in');
const { CreateSupportRequestUseCase } = require('./gym-operations/application/create-support-request');
const { ListMemberInvoicesUseCase } = require('./billing/application/list-member-invoices');
const { CancelInvoiceUseCase } = require('./billing/application/cancel-invoice');
const { CreateRefundUseCase } = require('./billing/application/create-refund');
const { CreatePromotionUseCase, TogglePromotionUseCase, ListPromotionsUseCase } = require('./billing/application/manage-promotions');
const { CreateMembershipPlanUseCase, UpdateMembershipPlanUseCase, ToggleMembershipPlanUseCase } = require('./membership/application/manage-membership-plans');
const { SubmitReviewUseCase, ListReviewsUseCase, ModerateReviewUseCase } = require('./gym-operations/application/submit-review');
const {
  CreateAreaUseCase, UpdateAreaUseCase, ListAreasUseCase,
  CreateAssetUseCase, UpdateAssetUseCase, ListAssetsUseCase,
  CreateMaintenanceTicketUseCase, UpdateTicketStatusUseCase, FacilityDashboardUseCase,
  CreateMaintenanceScheduleUseCase, ListMaintenanceSchedulesUseCase,
  UpdateMaintenanceScheduleUseCase, RunDueMaintenanceSchedulesUseCase,
} = require('./gym-operations/application/manage-facility');
const { createRuntimeDeps } = require('./shared/infrastructure/create-runtime-deps');
const { NutritionChatUseCase } = require('./nutrition-ai/application/nutrition-chat');

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
  const updateBranch = new UpdateBranchUseCase(deps);
  const closeBranch = new CloseBranchUseCase(deps);
  const assignRole = new AssignRoleUseCase(deps);
  const revokeRole = new RevokeRoleUseCase(deps);
  const listUserRoles = new ListUserRolesUseCase(deps);
  const activateMembership = new ActivateMembershipUseCase(deps);
  const getMySubscription = new GetMySubscriptionUseCase(deps);
  const listMembershipPlans = new ListMembershipPlansUseCase(deps);
  const createTrialBooking = new CreateTrialBookingUseCase(deps);
  const listManagerTrials = new ListManagerTrialsUseCase(deps);
  const updateTrialStatus = new UpdateTrialStatusUseCase(deps);
  const convertTrialToMember = new ConvertTrialToMemberUseCase(deps);
  const createOrganization = new CreateOrganizationUseCase(deps);
  const registerStaff = new RegisterStaffUseCase({ ...deps, pool: deps.pool });
  const checkInMember = new CheckInMemberUseCase(deps);
  const bookPtSession = new BookPtSessionUseCase(deps);
  const updateHealthProfile = new UpdateHealthProfileUseCase(deps);
  const logWeight = new LogWeightUseCase(deps);
  const logBodyMeasurement = new LogBodyMeasurementUseCase(deps);
  const getMemberProgress = new GetMemberProgressUseCase(deps);
  const createInvoice = new CreateInvoiceUseCase(deps);
  const recordPayment = new RecordPaymentUseCase({ ...deps, pool: deps.pool });
  const viewCoachShifts = new ViewCoachShiftsUseCase(deps);
  const assignCoachToShift = new AssignCoachToShiftUseCase(deps);
  const unassignCoachFromShift = new UnassignCoachFromShiftUseCase(deps);
  const enrollMemberInCourse = new EnrollMemberInCourseUseCase(deps);
  const checkInMemberToClass = new CheckInMemberToClassUseCase(deps);
  const memberSelfCheckIn    = new MemberSelfCheckInUseCase({ ...deps, pool: deps.pool });
  const getAvailableShifts   = new GetAvailableShiftsUseCase(deps);
  const managerDashboard     = new ManagerDashboardUseCase(deps);
  const listShiftRoster      = new ListShiftRosterUseCase(deps);
  const overrideCheckIn      = new OverrideCheckInUseCase({ ...deps, pool: deps.pool });
  const coachProxyCheckIn    = new CoachProxyCheckInUseCase({ ...deps, pool: deps.pool });
  const createSupportRequest = new CreateSupportRequestUseCase({ ...deps, pool: deps.pool });
  const listMemberInvoices   = new ListMemberInvoicesUseCase(deps);
  const cancelInvoice        = new CancelInvoiceUseCase(deps);
  const createRefund         = new CreateRefundUseCase({ ...deps, pool: deps.pool });
  const createPromotion      = new CreatePromotionUseCase(deps);
  const togglePromotion      = new TogglePromotionUseCase(deps);
  const listPromotions       = new ListPromotionsUseCase(deps);
  const createMembershipPlan = new CreateMembershipPlanUseCase(deps);
  const updateMembershipPlan = new UpdateMembershipPlanUseCase(deps);
  const toggleMembershipPlan = new ToggleMembershipPlanUseCase(deps);
  const submitReview         = new SubmitReviewUseCase({ ...deps, pool: deps.pool });
  const listReviews          = new ListReviewsUseCase(deps);
  const moderateReview       = new ModerateReviewUseCase(deps);
  const createArea           = new CreateAreaUseCase(deps);
  const updateArea           = new UpdateAreaUseCase(deps);
  const listAreas            = new ListAreasUseCase(deps);
  const createAsset          = new CreateAssetUseCase(deps);
  const updateAsset          = new UpdateAssetUseCase(deps);
  const listAssets           = new ListAssetsUseCase(deps);
  const createTicket         = new CreateMaintenanceTicketUseCase(deps);
  const updateTicket         = new UpdateTicketStatusUseCase(deps);
  const facilityDashboard    = new FacilityDashboardUseCase(deps);
  const createSchedule       = new CreateMaintenanceScheduleUseCase(deps);
  const listSchedules        = new ListMaintenanceSchedulesUseCase(deps);
  const updateSchedule       = new UpdateMaintenanceScheduleUseCase(deps);
  const runDueSchedules      = new RunDueMaintenanceSchedulesUseCase(deps);
  const nutritionChat        = new NutritionChatUseCase(deps);

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

  // ── UC-GUEST-01/02: Public list of active branches for catalog & trial booking ──
  v1.get('/branches', asyncHandler(async (req, res) => {
    const all = await deps.branchRepository.list();
    const active = all.filter((b) => b.status === 'ACTIVE').map((b) => ({
      id: b.id, code: b.code, name: b.name, address: b.address,
      phoneNumber: b.phoneNumber ?? null,
      zaloLink: b.zaloLink ?? null,
      contactEmail: b.contactEmail ?? null,
    }));
    res.status(200).json({ data: active, error: null, meta: {} });
  }));

  // ── UC-GUEST-05: Liên hệ Zalo (public) ──
  v1.get('/branches/:branchId/contact', asyncHandler(async (req, res) => {
    const branch = await deps.branchRepository.findById(req.params.branchId);
    if (!branch) return res.status(404).json({ data: null, error: { code: 'BRANCH_NOT_FOUND', message: 'Branch not found' }, meta: {} });
    const phone = branch.zaloPhone || branch.phoneNumber || null;
    const zaloLink = branch.zaloLink || (phone ? `https://zalo.me/${phone.replace(/\D/g, '')}` : null);
    if (!zaloLink) {
      return res.status(404).json({ data: null, error: { code: 'CONTACT_NOT_AVAILABLE', message: 'Branch has no contact info' }, meta: {} });
    }
    // Audit funnel event nếu có thể (best-effort, không block).
    try {
      await deps.auditLogRepository.append({
        actionCode: 'guest_contact_clicked',
        actorUserId: null,
        entityType: 'branch',
        entityId: branch.id,
        branchId: branch.id,
        createdAt: deps.clock.now(),
      });
    } catch { /* ignore */ }

    if (req.query.redirect === '1') {
      return res.redirect(302, zaloLink);
    }
    res.status(200).json({
      data: {
        branchId: branch.id, branchName: branch.name,
        zaloLink, zaloPhone: phone, contactEmail: branch.contactEmail || null,
      },
      error: null, meta: {},
    });
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

  // ── UC-ADMIN-02: List roles assigned to a user ──
  v1.get('/admin/users/:userId/roles', requireAdmin, asyncHandler(async (req, res) => {
    const result = await listUserRoles.execute({ userId: req.params.userId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-ADMIN-02: Assign a role to a user ──
  v1.post('/admin/users/:userId/roles', requireAdmin, asyncHandler(async (req, res) => {
    const result = await assignRole.execute({
      userId: req.params.userId,
      roleCode: req.body.roleCode,
      branchId: req.body.branchId,
      actorUserId: req.auth.userId,
    });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-ADMIN-02: Revoke a role from a user ──
  v1.delete('/admin/users/:userId/roles/:roleCode', requireAdmin, asyncHandler(async (req, res) => {
    const result = await revokeRole.execute({
      userId: req.params.userId,
      roleCode: req.params.roleCode,
      branchId: req.query.branch_id ?? null,
      actorUserId: req.auth.userId,
    });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-ADMIN-01: Update branch (info + zalo + contact) ──
  v1.patch('/admin/branches/:branchId', requireAdmin, asyncHandler(async (req, res) => {
    const result = await updateBranch.execute({
      branchId: req.params.branchId,
      ...req.body,
      actorUserId: req.auth.userId,
    });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-ADMIN-01: Soft-close branch (with active-member guard) ──
  v1.post('/admin/branches/:branchId/close', requireAdmin, asyncHandler(async (req, res) => {
    const result = await closeBranch.execute({
      branchId: req.params.branchId,
      force: req.body?.force === true,
      reason: req.body?.reason ?? null,
      actorUserId: req.auth.userId,
    });
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
    let result;
    if (req.auth.primaryRole === 'ADMIN') {
      const allBranches = await deps.branchRepository.list();
      result = await deps.trialBookingRepository.listByBranchIds(allBranches.map((b) => b.id));
    } else {
      result = await listManagerTrials.execute({ managerUserId: req.auth.userId });
    }
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
    const result = await registerStaff.execute({ ...req.body, actorUserId: req.auth.userId });
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
    const result = await createInvoice.execute({ ...req.body, actorUserId: req.auth.userId, actorRole: req.auth.primaryRole });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/billing/payments', requireManager, asyncHandler(async (req, res) => {
    const result = await recordPayment.execute({ ...req.body, actorUserId: req.auth.userId, actorRole: req.auth.primaryRole });
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

  // ── UC-MGR-STAFF-03: Manager phân công Coach vào Shift ──
  v1.post('/manager/shifts/:shiftId/coaches', requireManager, asyncHandler(async (req, res) => {
    if (!req.body?.coachId) {
      return res.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'coachId required' }, meta: {} });
    }
    const result = await assignCoachToShift.execute({
      coachId: req.body.coachId,
      shiftId: req.params.shiftId,
      note: req.body.note,
      assignedBy: req.auth.userId,
      actorRole: req.auth.primaryRole,
    });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.delete('/manager/shifts/:shiftId/coaches/:coachId', requireManager, asyncHandler(async (req, res) => {
    const result = await unassignCoachFromShift.execute({ coachId: req.params.coachId, shiftId: req.params.shiftId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-MGR-STAFF-04: Manager xem lịch làm việc của Coach ──
  v1.get('/manager/coaches/:coachId/schedule', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    if (branchIds.length === 0) {
      return res.status(403).json({ data: null, error: { code: 'NO_BRANCH', message: 'Manager has no branches' }, meta: {} });
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const placeholders = branchIds.map((_, i) => `$${i + 2}`).join(',');
    const result = await deps.pool.query(
      `select ta.id as assignment_id, ta.note, ta.assigned_at,
              s.id as shift_id, s.shift_code, s.date, s.start_at, s.end_at, s.coach_capacity,
              b.id as branch_id, b.name as branch_name,
              (select count(*) from class_attendance ca where ca.shift_id = s.id) as total_checkins
       from trainer_assignments ta
       join shifts s on ta.shift_id = s.id
       join branches b on ta.branch_id = b.id
       where ta.trainer_user_id = $1
         and ta.unassigned_at is null
         and ta.branch_id in (${placeholders})
       order by s.date desc, s.start_at desc
       limit ${limit}`,
      [req.params.coachId, ...branchIds]
    );
    res.status(200).json({ data: result.rows, error: null, meta: {} });
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

  // ── UC-MEMBER-02: Member views shifts available for check-in ──
  v1.get('/member/shifts/available', requireAuthenticated, asyncHandler(async (req, res) => {
    const branchId = req.query.branch_id;
    if (!branchId) return res.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'branch_id required' }, meta: {} });
    const result = await getAvailableShifts.execute({ branchId, userId: req.auth.userId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-MEMBER-03: Member self-check-in (atomic with weight log) ──
  v1.post('/member/check-in', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await memberSelfCheckIn.execute({ ...req.body, userId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-MEMBER-06: Member views own invoices ──
  v1.get('/member/invoices', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await listMemberInvoices.execute({ userId: req.auth.userId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-MEMBER-07: Member submits support request ──
  v1.post('/member/support-requests', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await createSupportRequest.execute({ ...req.body, userId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-GUEST-07: Guest views own trial bookings ──
  v1.get('/me/trials', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await deps.trialBookingRepository.findByGuestUser(req.auth.userId);
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-MGR-01: Manager dashboard ──
  v1.get('/manager/dashboard', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.query.branch_id || branchIds[0];
    if (!branchId) return res.status(400).json({ data: null, error: { code: 'NO_BRANCH', message: 'No branch assigned' }, meta: {} });
    const result = await managerDashboard.execute({ managerUserId: req.auth.userId, branchId, date: req.query.date });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-MGR-02 / UC-COACH-02: Roster for a shift ──
  v1.get('/shifts/:shiftId/roster', requireRole(['MANAGER', 'COACH', 'ADMIN']), asyncHandler(async (req, res) => {
    const result = await listShiftRoster.execute({ shiftId: req.params.shiftId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-MGR-04: Manager override check-in ──
  v1.post('/manager/check-ins/override', requireManager, asyncHandler(async (req, res) => {
    const result = await overrideCheckIn.execute({ ...req.body, managerUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-COACH-04: Coach proxy check-in cho học viên trong ca mình phụ trách ──
  v1.post('/coach/check-ins/proxy', requireCoach, asyncHandler(async (req, res) => {
    const result = await coachProxyCheckIn.execute({ ...req.body, coachUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-MGR-07: Manager confirms end-of-day reconciliation (audit trail) ──
  v1.post('/manager/reconciliation/confirm', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.body?.branchId || branchIds[0];
    if (!branchId) return res.status(400).json({ data: null, error: { code: 'NO_BRANCH', message: 'No branch assigned' }, meta: {} });
    const date = req.body?.date || new Date().toISOString().slice(0, 10);
    const now = deps.clock.now();
    await deps.auditLogRepository.append({
      actionCode: 'shift_reconciled',
      actorUserId: req.auth.userId,
      entityType: 'branch',
      entityId: branchId,
      branchId,
      metadata: { date, notes: req.body?.notes ?? null },
      createdAt: now,
    });
    res.status(200).json({ data: { branchId, date, reconciledAt: now }, error: null, meta: {} });
  }));

  // ── UC-POS-04: Manager reconciliation ──
  v1.get('/manager/reconciliation', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.query.branch_id || branchIds[0];
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const invoices = await deps.invoiceRepository.findByBranchAndDate(branchId, date);
    const paid    = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => i.status === 'pending');
    const totalRevenue = paid.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
    res.status(200).json({ data: { date, branchId, totalInvoices: invoices.length, paidCount: paid.length, pendingCount: pending.length, totalRevenue }, error: null, meta: {} });
  }));

  // ── UC-POS-05: Cancel invoice ──
  v1.post('/billing/invoices/:invoiceId/cancel', requireManager, asyncHandler(async (req, res) => {
    const result = await cancelInvoice.execute({
      invoiceId: req.params.invoiceId, ...req.body,
      actorUserId: req.auth.userId, actorRole: req.auth.primaryRole,
    });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-POS-05: Refund invoice ──
  v1.post('/billing/invoices/:invoiceId/refund', requireManager, asyncHandler(async (req, res) => {
    const result = await createRefund.execute({
      invoiceId: req.params.invoiceId, ...req.body,
      actorUserId: req.auth.userId, actorRole: req.auth.primaryRole,
    });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-PROD-01/02/03: Membership plan catalog management ──
  v1.get('/admin/membership-plans', requireAdmin, asyncHandler(async (req, res) => {
    const result = await deps.membershipPlanRepository.listAll();
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/admin/membership-plans', requireAdmin, asyncHandler(async (req, res) => {
    const result = await createMembershipPlan.execute(req.body);
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.patch('/admin/membership-plans/:planId', requireAdmin, asyncHandler(async (req, res) => {
    const result = await updateMembershipPlan.execute({ planId: req.params.planId, ...req.body });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.patch('/admin/membership-plans/:planId/status', requireAdmin, asyncHandler(async (req, res) => {
    const result = await toggleMembershipPlan.execute({ planId: req.params.planId, isActive: req.body.isActive });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-PROMO-01/02: Promotions ──
  v1.get('/manager/promotions', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.query.branch_id || branchIds[0];
    const result = await listPromotions.execute({ branchId, activeOnly: req.query.active_only === 'true' });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/manager/promotions', requireManager, asyncHandler(async (req, res) => {
    const result = await createPromotion.execute({ ...req.body, actorUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.patch('/manager/promotions/:promotionId/status', requireManager, asyncHandler(async (req, res) => {
    const result = await togglePromotion.execute({ promotionId: req.params.promotionId, isActive: req.body.isActive });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.get('/admin/promotions', requireAdmin, asyncHandler(async (req, res) => {
    const result = await listPromotions.execute({ branchId: null, activeOnly: false });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/admin/promotions', requireAdmin, asyncHandler(async (req, res) => {
    const result = await createPromotion.execute({ ...req.body, scope: 'global', actorUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-ADMIN-08: System config ──
  v1.get('/admin/config', requireAdmin, asyncHandler(async (req, res) => {
    const rows = await deps.pool.query('SELECT * FROM system_config ORDER BY key ASC');
    res.status(200).json({ data: rows.rows, error: null, meta: {} });
  }));

  v1.patch('/admin/config/:key', requireAdmin, asyncHandler(async (req, res) => {
    const { value } = req.body;
    if (!value) return res.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'value required' }, meta: {} });
    await deps.pool.query(
      `INSERT INTO system_config (key, value, updated_by, updated_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (key) DO UPDATE SET value=$2, updated_by=$3, updated_at=NOW()`,
      [req.params.key, value, req.auth.userId]
    );
    res.status(200).json({ data: { key: req.params.key, value }, error: null, meta: {} });
  }));

  // ── UC-ADMIN-01: Organization list ──
  v1.get('/admin/organizations', requireAdmin, asyncHandler(async (req, res) => {
    const rows = await deps.organizationRepository.listAll?.() ??
      (await deps.pool.query('SELECT * FROM organizations ORDER BY created_at DESC')).rows;
    res.status(200).json({ data: rows, error: null, meta: {} });
  }));

  // ── UC-MGR-STAFF-01: List staff for manager's branch ──
  v1.get('/manager/staff', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.query.branch_id || branchIds[0];
    if (!branchId) return res.status(400).json({ data: null, error: { code: 'NO_BRANCH', message: 'No branch assigned' }, meta: {} });
    const role = req.query.role ?? null;
    let query = `
      SELECT sp.id,
             sp.user_id           AS "userId",
             sp.job_title         AS "jobTitle",
             sp.primary_branch_id AS "baseBranchId",
             sp.status,
             (sp.status = 'ACTIVE') AS "isActive",
             sp.employee_code     AS "employeeCode",
             sp.hire_date         AS "hireDate",
             p.full_name          AS "fullName",
             u.email,
             COALESCE(r.code, sp.job_title) AS "staffRole",
             NULL::text           AS "phoneNumber"
      FROM staff_profiles sp
      JOIN users u ON u.id = sp.user_id
      LEFT JOIN profiles p ON p.user_id = sp.user_id
      LEFT JOIN user_role_assignments ura ON ura.user_id = sp.user_id
      LEFT JOIN roles r ON r.id = ura.role_id
      WHERE sp.primary_branch_id = $1`;
    const params = [branchId];
    if (role) { params.push(role); query += ` AND COALESCE(r.code, sp.job_title) = $${params.length}`; }
    query += ' ORDER BY p.full_name';
    const result = await deps.pool.query(query, params);
    res.status(200).json({ data: result.rows, error: null, meta: {} });
  }));

  // ── UC-MGR-STAFF-02: Deactivate staff ──
  v1.patch('/manager/staff/:staffId/status', requireManager, asyncHandler(async (req, res) => {
    const { isActive } = req.body;
    const newStatus = isActive ? 'ACTIVE' : 'INACTIVE';
    await deps.pool.query(
      'UPDATE staff_profiles SET status = $2, updated_at = NOW() WHERE id = $1',
      [req.params.staffId, newStatus]
    );
    res.status(200).json({ data: { staffId: req.params.staffId, status: newStatus }, error: null, meta: {} });
  }));

  // ── UC-MGR-03: Trial funnel stats ──
  v1.get('/manager/trials/funnel', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.query.branch_id || branchIds[0];
    if (!branchId) return res.status(400).json({ data: null, error: { code: 'NO_BRANCH', message: 'No branch assigned' }, meta: {} });
    const { from, to } = req.query;
    const params = [branchId];
    let dateFilter = '';
    if (from) { params.push(from); dateFilter += ` AND created_at >= $${params.length}`; }
    if (to)   { params.push(to);   dateFilter += ` AND created_at < $${params.length}::date + interval '1 day'`; }
    const result = await deps.pool.query(
      `SELECT status, COUNT(*)::int AS count FROM trial_bookings WHERE branch_id = $1${dateFilter} GROUP BY status`,
      params
    );
    const byStatus = Object.fromEntries(result.rows.map(r => [r.status, r.count]));
    const total = result.rows.reduce((s, r) => s + r.count, 0);
    res.status(200).json({ data: { branchId, total, byStatus }, error: null, meta: {} });
  }));

  // ── UC-COACH-03: Coach views member detail in shift ──
  v1.get('/coach/shifts/:shiftId/members/:memberId', requireCoach, asyncHandler(async (req, res) => {
    const { shiftId, memberId } = req.params;
    const attendance = await deps.classAttendanceRepository.one(
      `SELECT ca.*, ce.sessions_remaining, ce.total_sessions
       FROM class_attendance ca
       LEFT JOIN course_enrollments ce ON ce.id = ca.enrollment_id
       WHERE ca.shift_id = $1 AND ca.user_id = $2`,
      [shiftId, memberId]
    );
    if (!attendance) return res.status(404).json({ data: null, error: { code: 'ATTENDANCE_NOT_FOUND', message: 'Member not found in this shift' }, meta: {} });
    const profile = await deps.profileRepository.findByUserId(memberId);
    const health  = await deps.healthProfileRepository.findByUserId?.(memberId) ?? null;
    res.status(200).json({ data: { attendance, profile, health }, error: null, meta: {} });
  }));

  // ── UC-REV-01 to UC-REV-04: Reviews ──
  v1.post('/member/reviews', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await submitReview.execute({ ...req.body, userId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.get('/member/reviews', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await listReviews.execute({ targetType: req.query.target_type, targetId: req.query.target_id, forManager: false });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.get('/manager/reviews', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.query.branch_id || branchIds[0];
    const result = await listReviews.execute({ branchId, status: req.query.status, forManager: true });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-MGR-REV-01: Tổng hợp đánh giá theo chi nhánh ──
  v1.get('/manager/reviews/summary', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.query.branch_id || branchIds[0];
    if (!branchId) return res.status(400).json({ data: null, error: { code: 'NO_BRANCH', message: 'No branch assigned' }, meta: {} });
    const sinceDays = Math.min(Math.max(parseInt(req.query.since_days, 10) || 30, 1), 365);
    const result = await deps.reviewRepository.summaryByBranch(branchId, { sinceDays });
    res.status(200).json({ data: { branchId, ...result }, error: null, meta: {} });
  }));

  v1.patch('/manager/reviews/:reviewId/status', requireManager, asyncHandler(async (req, res) => {
    const result = await moderateReview.execute({
      reviewId: req.params.reviewId, status: req.body.status, reason: req.body.reason, actorUserId: req.auth.userId,
    });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-FAC-01: Areas ──
  v1.get('/manager/areas', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.query.branch_id || branchIds[0];
    const result = await listAreas.execute({ branchId, activeOnly: req.query.active_only !== 'false' });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/manager/areas', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.body.branchId || branchIds[0];
    const result = await createArea.execute({ ...req.body, branchId, actorUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.patch('/manager/areas/:areaId', requireManager, asyncHandler(async (req, res) => {
    const result = await updateArea.execute({ areaId: req.params.areaId, ...req.body });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-FAC-02/03/04: Assets ──
  v1.get('/manager/assets', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.query.branch_id || branchIds[0];
    const result = await listAssets.execute({ branchId, status: req.query.status });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/manager/assets', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.body.branchId || branchIds[0];
    const result = await createAsset.execute({ ...req.body, branchId, actorUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.patch('/manager/assets/:assetId', requireManager, asyncHandler(async (req, res) => {
    const result = await updateAsset.execute({ assetId: req.params.assetId, ...req.body });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-FAC-05/06: Maintenance tickets ──
  v1.get('/manager/tickets', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.query.branch_id || branchIds[0];
    const result = await deps.facilityRepository.listTicketsByBranch(branchId, { status: req.query.status });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/manager/tickets', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.body.branchId || branchIds[0];
    const result = await createTicket.execute({ ...req.body, branchId, actorUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.patch('/manager/tickets/:ticketId/status', requireManager, asyncHandler(async (req, res) => {
    const result = await updateTicket.execute({ ticketId: req.params.ticketId, ...req.body });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-FAC-07: Maintenance schedules ──
  v1.get('/manager/maintenance-schedules', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.query.branch_id || branchIds[0];
    const result = await listSchedules.execute({ branchId, activeOnly: req.query.active_only !== 'false' });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.post('/manager/maintenance-schedules', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.body.branchId || branchIds[0];
    const result = await createSchedule.execute({ ...req.body, branchId, actorUserId: req.auth.userId });
    res.status(201).json({ data: result, error: null, meta: {} });
  }));

  v1.patch('/manager/maintenance-schedules/:scheduleId', requireManager, asyncHandler(async (req, res) => {
    const result = await updateSchedule.execute({ scheduleId: req.params.scheduleId, ...req.body });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // Trigger thủ công (production: cron sẽ gọi endpoint này)
  v1.post('/manager/maintenance-schedules/run-due', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.body.branchId || branchIds[0];
    const result = await runDueSchedules.execute({ branchId, actorUserId: req.auth.userId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-FAC-08: Facility dashboard ──
  v1.get('/manager/facility/dashboard', requireManager, asyncHandler(async (req, res) => {
    const branchIds = await deps.branchManagerAssignmentRepository.listBranchIdsForManager(req.auth.userId);
    const branchId = req.query.branch_id || branchIds[0];
    if (!branchId) return res.status(400).json({ data: null, error: { code: 'NO_BRANCH', message: 'No branch assigned' }, meta: {} });
    const result = await facilityDashboard.execute({ branchId });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  // ── UC-ADMIN-05: List all staff (admin) ──
  v1.get('/admin/staff', requireAdmin, asyncHandler(async (req, res) => {
    const result = await deps.pool.query(
      `SELECT sp.id,
              sp.user_id           AS "userId",
              sp.employee_code     AS "employeeCode",
              sp.job_title         AS "jobTitle",
              sp.primary_branch_id AS "baseBranchId",
              (sp.status = 'ACTIVE') AS "isActive",
              COALESCE(r.code, sp.job_title) AS "staffRole",
              p.full_name          AS "fullName",
              u.email,
              NULL::text           AS "phoneNumber"
       FROM staff_profiles sp
       JOIN users u ON u.id = sp.user_id
       LEFT JOIN profiles p ON p.user_id = sp.user_id
       LEFT JOIN user_role_assignments ura ON ura.user_id = sp.user_id
       LEFT JOIN roles r ON r.id = ura.role_id
       ORDER BY p.full_name`
    );
    res.status(200).json({ data: result.rows, error: null, meta: {} });
  }));

  // ── AI-01: Chatbot tư vấn dinh dưỡng (Groq / Llama-3.1-8b-instant, miễn phí) ──
  v1.post('/me/nutrition-chat', requireAuthenticated, asyncHandler(async (req, res) => {
    const result = await nutritionChat.execute({
      userId: req.auth.userId,
      message: req.body.message,
      history: req.body.history || [],
    });
    res.status(200).json({ data: result, error: null, meta: {} });
  }));

  v1.use((req, res) => {
    res.status(404).json({ data: null, error: { code: 'RESOURCE_NOT_FOUND', message: 'Not found' }, meta: {} });
  });

  v1.use((err, req, res, next) => {
    const code = err?.message || 'INTERNAL_ERROR';
    const status =
      ['EMAIL_ALREADY_EXISTS', 'BRANCH_CODE_ALREADY_EXISTS', 'SUBSCRIPTION_CONFLICT', 'TRIAL_ALREADY_CONVERTED',
       'SHIFT_ASSIGNMENT_EXISTS', 'SHIFT_COACH_CAPACITY_REACHED', 'SHIFT_REQUIRES_AT_LEAST_ONE_COACH',
       'ACTIVE_ENROLLMENT_EXISTS', 'NO_ACTIVE_ENROLLMENT', 'NO_SESSIONS_REMAINING', 'DUPLICATE_CHECKIN',
       'PROMO_CODE_EXISTS', 'INVOICE_ALREADY_CANCELLED', 'INVOICE_ALREADY_PAID',
       'EMPLOYEE_CODE_ALREADY_EXISTS',
       'ROLE_ALREADY_ASSIGNED', 'BRANCH_ALREADY_CLOSED', 'BRANCH_HAS_ACTIVE_MEMBERS'].includes(code)
        ? 409
      : ['INVALID_CREDENTIALS', 'INVALID_REFRESH_TOKEN', 'INVALID_RESET_TOKEN'].includes(code)
        ? 401
      : ['USER_NOT_FOUND', 'BRANCH_NOT_FOUND', 'TRIAL_NOT_FOUND', 'SHIFT_NOT_FOUND', 'COURSE_PACKAGE_NOT_FOUND',
         'PLAN_NOT_FOUND', 'INVOICE_NOT_FOUND', 'PROMOTION_NOT_FOUND', 'REVIEW_NOT_FOUND',
         'ASSET_NOT_FOUND', 'TICKET_NOT_FOUND', 'ATTENDANCE_NOT_FOUND'].includes(code)
        ? 404
      : ['CROSS_BRANCH_ACCESS', 'FORBIDDEN', 'COACH_NOT_ALLOWED_FOR_BRANCH', 'COACH_NOT_ASSIGNED_TO_SHIFT',
         'LAST_ADMIN_PROTECTED'].includes(code)
        ? 403
      : ['SHIFT_ALREADY_STARTED', 'SHIFT_ALREADY_ENDED', 'SHIFT_NOT_STARTED', 'SHIFT_GRACE_PERIOD_EXPIRED',
         'MEMBERSHIP_PLAN_NOT_AVAILABLE', 'TRIAL_GUEST_ACCOUNT_REQUIRED',
         'WEIGHT_REQUIRED', 'OVERRIDE_REASON_REQUIRED', 'USE_REFUND_FOR_PAID_INVOICE',
         'INVOICE_NOT_PAID', 'REFUND_EXCEEDS_INVOICE', 'PAYMENT_EXCEEDS_INVOICE',
         'INVALID_PROMO_TYPE', 'INVALID_PROMO_VALUE',
         'INVALID_REVIEW_TARGET_TYPE', 'INVALID_REVIEW_RATING', 'INVALID_REVIEW_STATUS',
         'REVIEW_REQUIRES_ATTENDANCE', 'REVIEW_RATE_LIMIT_EXCEEDED', 'REVIEW_ALREADY_SUBMITTED',
         'INVALID_ASSET_STATUS', 'INVALID_TICKET_STATUS',
         'AREA_NAME_REQUIRED', 'ASSET_NAME_REQUIRED', 'ASSET_TYPE_REQUIRED', 'TICKET_TITLE_REQUIRED',
         'EMAIL_REQUIRED', 'FULL_NAME_REQUIRED', 'STAFF_ROLE_REQUIRED', 'BRANCH_ID_REQUIRED',
         'INVALID_STAFF_ROLE',
         'SCHEDULE_TITLE_REQUIRED', 'INVALID_SCHEDULE_FREQUENCY',
         'INVALID_SCHEDULE_INTERVAL', 'INVALID_SCHEDULE_DUE_DATE',
         'INVALID_ROLE_CODE', 'ROLE_NOT_ASSIGNED', 'ROLE_CODE_REQUIRED', 'ROLE_NOT_FOUND',
         'INVALID_USER_STATUS', 'NO_FIELDS_TO_UPDATE'].includes(code)
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
