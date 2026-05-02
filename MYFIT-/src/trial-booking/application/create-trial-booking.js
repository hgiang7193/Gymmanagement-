const { DomainError, requireField } = require('../../identity-access/application/_shared');

class CreateTrialBookingUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.actorUserId, 'ACTOR_USER_ID_REQUIRED');
    requireField(input?.branchId, 'BRANCH_ID_REQUIRED');
    requireField(input?.trialPlanName, 'TRIAL_PLAN_NAME_REQUIRED');
    requireField(input?.scheduledAt, 'SCHEDULED_AT_REQUIRED');
    requireField(input?.phoneNumber, 'PHONE_NUMBER_REQUIRED');

    const [user, branch] = await Promise.all([
      this.deps.userRepository.findById(input.actorUserId),
      this.deps.branchRepository.findById(input.branchId),
    ]);

    if (!user) {
      throw new DomainError('USER_NOT_FOUND');
    }
    if (!branch) {
      throw new DomainError('BRANCH_NOT_FOUND');
    }

    const current = await this.deps.subscriptionRepository.findActiveByUserId(user.id);
    if (current) {
      throw new DomainError('SUBSCRIPTION_CONFLICT');
    }

    const profile = await this.deps.profileRepository.findByUserId?.(user.id);
    const now = this.deps.clock.now();
    const trialBooking = {
      id: this.deps.idGenerator.next('trial-booking'),
      guestUserId: user.id,
      fullName: input.fullName ?? profile?.fullName ?? user.email,
      phoneNumber: input.phoneNumber,
      email: input.email ?? user.email,
      branchId: branch.id,
      trialPlanName: input.trialPlanName,
      scheduledAt: new Date(input.scheduledAt),
      status: 'BOOKED',
      notes: input.notes ?? null,
      convertedSubscriptionId: null,
      convertedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.deps.trialBookingRepository.create(trialBooking);
    await this.deps.trialStatusHistoryRepository.append({
      id: this.deps.idGenerator.next('trial-status-history'),
      trialBookingId: trialBooking.id,
      fromStatus: null,
      toStatus: 'BOOKED',
      changedBy: user.id,
      createdAt: now,
    });
    await this.deps.auditLogRepository.append({
      actionCode: 'trial_booking_created',
      actorUserId: user.id,
      entityType: 'trial_booking',
      entityId: trialBooking.id,
      branchId: branch.id,
      createdAt: now,
    });

    return trialBooking;
  }
}

module.exports = { CreateTrialBookingUseCase };
