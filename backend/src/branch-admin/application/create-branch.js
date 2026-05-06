const { DomainError, requireField } = require('../../identity-access/application/_shared');

class CreateBranchUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.code, 'BRANCH_CODE_REQUIRED');
    requireField(input?.name, 'BRANCH_NAME_REQUIRED');
    requireField(input?.address, 'BRANCH_ADDRESS_REQUIRED');

    const normalizedCode = input.code.trim().toUpperCase();
    const existing = await this.deps.branchRepository.findByCode(normalizedCode);
    if (existing) {
      throw new DomainError('BRANCH_CODE_ALREADY_EXISTS');
    }

    const now = this.deps.clock.now();
    const branch = {
      id: this.deps.idGenerator.next('branch'),
      code: normalizedCode,
      name: input.name,
      address: input.address,
      phoneNumber: input.phoneNumber ?? null,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    await this.deps.branchRepository.create(branch);
    await this.deps.auditLogRepository.append({ actionCode: 'branch_created', actorUserId: input.actorUserId, entityId: branch.id, createdAt: now });
    return branch;
  }
}

module.exports = { CreateBranchUseCase };
