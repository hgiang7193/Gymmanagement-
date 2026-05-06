const { DomainError, requireField } = require('../../identity-access/application/_shared');

class ActivateMembershipUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.userId, 'USER_ID_REQUIRED');
    requireField(input?.membershipPlanId, 'MEMBERSHIP_PLAN_ID_REQUIRED');
    requireField(input?.homeBranchId, 'HOME_BRANCH_ID_REQUIRED');
    requireField(input?.actorUserId, 'ACTOR_USER_ID_REQUIRED');

    const [user, plan, branch] = await Promise.all([
      this.deps.userRepository.findById(input.userId),
      this.deps.membershipPlanRepository.findById(input.membershipPlanId),
      this.deps.branchRepository.findById(input.homeBranchId),
    ]);

    if (!user) {
      throw new DomainError('USER_NOT_FOUND');
    }
    if (!plan || !plan.isActive) {
      throw new DomainError('MEMBERSHIP_PLAN_NOT_AVAILABLE');
    }
    if (!branch) {
      throw new DomainError('BRANCH_NOT_FOUND');
    }

    const isManagerOfBranch = await this.deps.branchManagerAssignmentRepository.isManagerOfBranch(
      input.actorUserId,
      input.homeBranchId
    );
    if (!isManagerOfBranch) {
      throw new DomainError('CROSS_BRANCH_ACCESS');
    }

    const current = await this.deps.subscriptionRepository.findActiveByUserId(user.id);
    if (current) {
      throw new DomainError('SUBSCRIPTION_CONFLICT');
    }

    const memberRole = await this.deps.roleRepository.findByCode('MEMBER');
    if (!memberRole) {
      throw new DomainError('ROLE_NOT_FOUND');
    }

    const activatedAt = input.activatedAt ? new Date(input.activatedAt) : this.deps.clock.now();
    const expiresAt = new Date(activatedAt.getTime() + (plan.durationDays * 86400000));
    const subscription = {
      id: this.deps.idGenerator.next('subscription'),
      userId: user.id,
      membershipPlanId: plan.id,
      homeBranchId: branch.id,
      status: 'ACTIVE',
      startedAt: activatedAt,
      expiresAt,
      totalSessions: plan.totalSessions,
      sessionsUsed: 0,
      sessionsRemaining: plan.totalSessions,
      activatedBy: input.actorUserId,
      activatedAt,
    };

    await this.deps.subscriptionRepository.create(subscription);
    await this.deps.subscriptionStatusHistoryRepository.append({
      id: this.deps.idGenerator.next('subscription-history'),
      subscriptionId: subscription.id,
      fromStatus: null,
      toStatus: 'ACTIVE',
      changedBy: input.actorUserId,
      reason: 'manager_activation',
      createdAt: activatedAt,
    });
    await this.deps.roleAssignmentRepository.assign({
      id: this.deps.idGenerator.next('role-assignment'),
      userId: user.id,
      roleId: memberRole.id,
      branchId: branch.id,
      assignedAt: activatedAt,
    });
    await this.deps.auditLogRepository.append({
      actionCode: 'membership_activated',
      actorUserId: input.actorUserId,
      entityType: 'subscription',
      entityId: subscription.id,
      branchId: branch.id,
      createdAt: activatedAt,
    });

    return subscription;
  }
}

module.exports = { ActivateMembershipUseCase };
