const { DomainError, requireField } = require('../../identity-access/application/_shared');

const UPDATABLE_FIELDS = ['name', 'address', 'phoneNumber', 'zaloLink', 'zaloPhone', 'contactEmail'];

class UpdateBranchUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.branchId, 'BRANCH_ID_REQUIRED');

    const branch = await this.deps.branchRepository.findById(input.branchId);
    if (!branch) {
      throw new DomainError('BRANCH_NOT_FOUND');
    }

    const patch = {};
    for (const field of UPDATABLE_FIELDS) {
      if (input[field] !== undefined) patch[field] = input[field];
    }
    if (Object.keys(patch).length === 0) {
      throw new DomainError('NO_FIELDS_TO_UPDATE');
    }

    const now = this.deps.clock.now();
    const next = { ...branch, ...patch, updatedAt: now };
    await this.deps.branchRepository.update(next);

    await this.deps.auditLogRepository.append({
      actionCode: 'branch_updated',
      actorUserId: input.actorUserId,
      entityType: 'branch',
      entityId: branch.id,
      branchId: branch.id,
      metadata: { fields: Object.keys(patch) },
      createdAt: now,
    });

    return next;
  }
}

module.exports = { UpdateBranchUseCase };
