const { DomainError, requireField } = require('../../identity-access/application/_shared');

class UpdateTrialStatusUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.trialBookingId, 'TRIAL_BOOKING_ID_REQUIRED');
    requireField(input?.status, 'STATUS_REQUIRED');
    requireField(input?.actorUserId, 'ACTOR_USER_ID_REQUIRED');

    const trialBooking = await this.deps.trialBookingRepository.findById(input.trialBookingId);
    if (!trialBooking) {
      throw new DomainError('TRIAL_NOT_FOUND');
    }

    const isManagerOfBranch = await this.deps.branchManagerAssignmentRepository.isManagerOfBranch(
      input.actorUserId,
      trialBooking.branchId
    );
    if (!isManagerOfBranch) {
      throw new DomainError('CROSS_BRANCH_ACCESS');
    }

    const now = this.deps.clock.now();
    const previousStatus = trialBooking.status;
    trialBooking.status = input.status;
    trialBooking.updatedAt = now;

    await this.deps.trialBookingRepository.update(trialBooking);
    await this.deps.trialStatusHistoryRepository.append({
      id: this.deps.idGenerator.next('trial-status-history'),
      trialBookingId: trialBooking.id,
      fromStatus: previousStatus,
      toStatus: trialBooking.status,
      changedBy: input.actorUserId,
      createdAt: now,
    });
    await this.deps.auditLogRepository.append({
      actionCode: 'trial_status_changed',
      actorUserId: input.actorUserId,
      entityType: 'trial_booking',
      entityId: trialBooking.id,
      branchId: trialBooking.branchId,
      metadata: { fromStatus: previousStatus, toStatus: trialBooking.status },
      createdAt: now,
    });

    return trialBooking;
  }
}

module.exports = { UpdateTrialStatusUseCase };
