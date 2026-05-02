const { getRuntimeConfig } = require('../config');
const { Argon2PasswordHasher } = require('../security/argon2-password-hasher');
const { JwtTokenService } = require('../security/jwt-token-service');
const { IdGenerator } = require('./id-generator');
const { SystemClock } = require('./clock');
const { createPostgresPool } = require('./postgres/pool');
const { PostgresUserRepository } = require('./postgres/user-repository');
const { PostgresProfileRepository } = require('./postgres/profile-repository');
const { PostgresRoleRepository } = require('./postgres/role-repository');
const { PostgresRoleAssignmentRepository } = require('./postgres/role-assignment-repository');
const { PostgresRefreshSessionRepository } = require('./postgres/refresh-session-repository');
const { PostgresPasswordResetTokenRepository } = require('./postgres/password-reset-token-repository');
const { PostgresSecurityEventRepository } = require('./postgres/security-event-repository');
const { PostgresAuditLogRepository } = require('./postgres/audit-log-repository');
const { PostgresBranchRepository } = require('./postgres/branch-repository');
const { PostgresBranchManagerAssignmentRepository } = require('./postgres/branch-manager-assignment-repository');
const { PostgresMembershipPlanRepository } = require('./postgres/membership-plan-repository');
const { PostgresSubscriptionRepository } = require('./postgres/subscription-repository');
const { PostgresSubscriptionStatusHistoryRepository } = require('./postgres/subscription-status-history-repository');
const { PostgresTrialBookingRepository } = require('./postgres/trial-booking-repository');
const { PostgresTrialStatusHistoryRepository } = require('./postgres/trial-status-history-repository');
const { PostgresOrganizationRepository } = require('./postgres/organization-repository');
const { PostgresStaffProfileRepository } = require('./postgres/staff-profile-repository');
const { PostgresMemberCheckInRepository } = require('./postgres/member-check-in-repository');
const { PostgresPtPackageRepository } = require('./postgres/pt-package-repository');
const { PostgresPtSessionRepository } = require('./postgres/pt-session-repository');
const { PostgresHealthProfileRepository } = require('./postgres/health-profile-repository');
const { PostgresWeightLogRepository } = require('./postgres/weight-log-repository');
const { PostgresBodyMeasurementRepository } = require('./postgres/body-measurement-repository');
const { PostgresInvoiceRepository } = require('./postgres/invoice-repository');
const { PostgresPaymentRepository } = require('./postgres/payment-repository');
const { PostgresShiftRepository } = require('./postgres/shift-repository');
const { PostgresTrainerAssignmentRepository } = require('./postgres/trainer-assignment-repository');
const { PostgresCoursePackageRepository } = require('./postgres/course-package-repository');
const { PostgresCourseEnrollmentRepository } = require('./postgres/course-enrollment-repository');
const { PostgresClassAttendanceRepository } = require('./postgres/class-attendance-repository');
const { PostgresPromotionRepository } = require('./postgres/promotion-repository');
const { PostgresReviewRepository } = require('./postgres/review-repository');
const { PostgresFacilityRepository } = require('./postgres/facility-repository');
const { NoopVerificationService } = require('./noop-verification-service');

function createRuntimeDeps() {
  const config = getRuntimeConfig();
  const pool = createPostgresPool(config.databaseUrl);

  return {
    pool,
    idGenerator: new IdGenerator(),
    clock: new SystemClock(),
    passwordHasher: new Argon2PasswordHasher(),
    tokenService: new JwtTokenService(config),
    verificationService: new NoopVerificationService(),
    userRepository: new PostgresUserRepository(pool),
    profileRepository: new PostgresProfileRepository(pool),
    roleRepository: new PostgresRoleRepository(pool),
    roleAssignmentRepository: new PostgresRoleAssignmentRepository(pool),
    refreshSessionRepository: new PostgresRefreshSessionRepository(pool),
    passwordResetTokenRepository: new PostgresPasswordResetTokenRepository(pool),
    securityEventRepository: new PostgresSecurityEventRepository(pool),
    auditLogRepository: new PostgresAuditLogRepository(pool),
    branchRepository: new PostgresBranchRepository(pool),
    branchManagerAssignmentRepository: new PostgresBranchManagerAssignmentRepository(pool),
    membershipPlanRepository: new PostgresMembershipPlanRepository(pool),
    subscriptionRepository: new PostgresSubscriptionRepository(pool),
    subscriptionStatusHistoryRepository: new PostgresSubscriptionStatusHistoryRepository(pool),
    trialBookingRepository: new PostgresTrialBookingRepository(pool),
    trialStatusHistoryRepository: new PostgresTrialStatusHistoryRepository(pool),
    organizationRepository: new PostgresOrganizationRepository(pool),
    staffProfileRepository: new PostgresStaffProfileRepository(pool),
    memberCheckInRepository: new PostgresMemberCheckInRepository(pool),
    ptPackageRepository: new PostgresPtPackageRepository(pool),
    ptSessionRepository: new PostgresPtSessionRepository(pool),
    healthProfileRepository: new PostgresHealthProfileRepository(pool),
    weightLogRepository: new PostgresWeightLogRepository(pool),
    bodyMeasurementRepository: new PostgresBodyMeasurementRepository(pool),
    invoiceRepository: new PostgresInvoiceRepository(pool),
    paymentRepository: new PostgresPaymentRepository(pool),
    shiftRepository: new PostgresShiftRepository(pool),
    trainerAssignmentRepository: new PostgresTrainerAssignmentRepository(pool),
    coursePackageRepository: new PostgresCoursePackageRepository(pool),
    courseEnrollmentRepository: new PostgresCourseEnrollmentRepository(pool),
    classAttendanceRepository: new PostgresClassAttendanceRepository(pool),
    promotionRepository: new PostgresPromotionRepository(pool),
    reviewRepository: new PostgresReviewRepository(pool),
    facilityRepository: new PostgresFacilityRepository(pool),
  };
}

module.exports = { createRuntimeDeps };
