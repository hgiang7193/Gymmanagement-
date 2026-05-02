const { DomainError, requireField } = require('../../identity-access/application/_shared');

class CloseBranchUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.branchId, 'BRANCH_ID_REQUIRED');

    const branch = await this.deps.branchRepository.findById(input.branchId);
    if (!branch) {
      throw new DomainError('BRANCH_NOT_FOUND');
    }
    if (branch.status === 'CLOSED') {
      throw new DomainError('BRANCH_ALREADY_CLOSED');
    }

    const force = input.force === true;
    const activeCount = await this.deps.branchRepository.countActiveSubscriptions(branch.id);
    if (activeCount > 0 && !force) {
      const err = new DomainError('BRANCH_HAS_ACTIVE_MEMBERS');
      err.metadata = { activeSubscriptions: activeCount };
      throw err;
    }

    const now = this.deps.clock.now();
    const next = { ...branch, status: 'CLOSED', updatedAt: now };
    await this.deps.branchRepository.update(next);

    await this.deps.auditLogRepository.append({
      actionCode: 'branch_closed',
      actorUserId: input.actorUserId,
      entityType: 'branch',
      entityId: branch.id,
      branchId: branch.id,
      metadata: { force, activeSubscriptions: activeCount, reason: input.reason ?? null },
      createdAt: now,
    });

    return { branchId: branch.id, status: 'CLOSED', activeSubscriptionsAtClose: activeCount };
  }
}

module.exports = { CloseBranchUseCase };
