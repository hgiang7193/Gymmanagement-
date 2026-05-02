const { DomainError, requireField } = require('../../identity-access/application/_shared');

class ConvertTrialToMemberUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.trialBookingId, 'TRIAL_BOOKING_ID_REQUIRED');
    requireField(input?.membershipPlanId, 'MEMBERSHIP_PLAN_ID_REQUIRED');
    requireField(input?.homeBranchId, 'HOME_BRANCH_ID_REQUIRED');
    requireField(input?.actorUserId, 'ACTOR_USER_ID_REQUIRED');

    const [trialBooking, plan, branch] = await Promise.all([
      this.deps.trialBookingRepository.findById(input.trialBookingId),
      this.deps.membershipPlanRepository.findById(input.membershipPlanId),
      this.deps.branchRepository.findById(input.homeBranchId),
    ]);

    if (!trialBooking) {
      throw new DomainError('TRIAL_NOT_FOUND');
    }
    if (trialBooking.convertedSubscriptionId || trialBooking.status === 'CONVERTED') {
      throw new DomainError('TRIAL_ALREADY_CONVERTED');
    }
    if (!plan || !plan.isActive) {
      throw new DomainError('MEMBERSHIP_PLAN_NOT_AVAILABLE');
    }
    if (!branch) {
      throw new DomainError('BRANCH_NOT_FOUND');
    }
    if (!trialBooking.guestUserId) {
      throw new DomainError('TRIAL_GUEST_ACCOUNT_REQUIRED');
    }
    if (trialBooking.branchId !== input.homeBranchId) {
      throw new DomainError('CROSS_BRANCH_ACCESS');
    }

    const isManagerOfBranch = await this.deps.branchManagerAssignmentRepository.isManagerOfBranch(
      input.actorUserId,
      input.homeBranchId
    );
    if (!isManagerOfBranch) {
      throw new DomainError('CROSS_BRANCH_ACCESS');
    }

    const current = await this.deps.subscriptionRepository.findActiveByUserId(trialBooking.guestUserId);

    const memberRole = await this.deps.roleRepository.findByCode('MEMBER');
    if (!memberRole) {
      throw new DomainError('ROLE_NOT_FOUND');
    }

    const now = this.deps.clock.now();
    const expiresAt = new Date(now.getTime() + (plan.durationDays * 86400000));
    const subscription = {
      id: this.deps.idGenerator.next('subscription'),
      userId: trialBooking.guestUserId,
      membershipPlanId: plan.id,
      homeBranchId: branch.id,
      status: 'ACTIVE',
      startedAt: now,
      expiresAt,
      totalSessions: plan.totalSessions,
      sessionsUsed: 0,
      sessionsRemaining: plan.totalSessions,
      activatedBy: input.actorUserId,
      activatedAt: now,
    };

    await this.deps.subscriptionRepository.create(subscription);
    await this.deps.subscriptionStatusHistoryRepository.append({
      id: this.deps.idGenerator.next('subscription-history'),
      subscriptionId: subscription.id,
      fromStatus: null,
      toStatus: 'ACTIVE',
      changedBy: input.actorUserId,
      reason: 'trial_conversion',
      createdAt: now,
    });
    if (current) {
      current.status = 'REPLACED';
      await this.deps.subscriptionRepository.update(current);
      await this.deps.subscriptionStatusHistoryRepository.append({
        id: this.deps.idGenerator.next('subscription-history'),
        subscriptionId: current.id,
        fromStatus: 'ACTIVE',
        toStatus: 'REPLACED',
        changedBy: input.actorUserId,
        reason: 'replaced_by_trial_conversion',
        createdAt: now,
      });
    }
    await this.deps.roleAssignmentRepository.assign({
      id: this.deps.idGenerator.next('role-assignment'),
      userId: subscription.userId,
      roleId: memberRole.id,
      branchId: branch.id,
      assignedAt: now,
    });

    trialBooking.status = 'CONVERTED';
    trialBooking.convertedSubscriptionId = subscription.id;
    trialBooking.convertedAt = now;
    trialBooking.updatedAt = now;
    await this.deps.trialBookingRepository.update(trialBooking);
    await this.deps.trialStatusHistoryRepository.append({
      id: this.deps.idGenerator.next('trial-status-history'),
      trialBookingId: trialBooking.id,
      fromStatus: 'BOOKED',
      toStatus: 'CONVERTED',
      changedBy: input.actorUserId,
      createdAt: now,
    });

    await this.deps.auditLogRepository.append({
      actionCode: 'trial_converted_to_member',
      actorUserId: input.actorUserId,
      entityType: 'trial_booking',
      entityId: trialBooking.id,
      branchId: branch.id,
      metadata: { subscriptionId: subscription.id },
      createdAt: now,
    });
    await this.deps.auditLogRepository.append({
      actionCode: 'subscription_created',
      actorUserId: input.actorUserId,
      entityType: 'subscription',
      entityId: subscription.id,
      branchId: branch.id,
      createdAt: now,
    });
    await this.deps.auditLogRepository.append({
      actionCode: 'role_assignment_changed',
      actorUserId: input.actorUserId,
      entityType: 'user_role_assignment',
      entityId: subscription.userId,
      branchId: branch.id,
      createdAt: now,
    });

    return {
      trialBookingId: trialBooking.id,
      subscriptionId: subscription.id,
      userId: subscription.userId,
      membershipPlanId: subscription.membershipPlanId,
      homeBranchId: subscription.homeBranchId,
      role: 'MEMBER',
      status: subscription.status,
    };
  }
}

module.exports = { ConvertTrialToMemberUseCase };
