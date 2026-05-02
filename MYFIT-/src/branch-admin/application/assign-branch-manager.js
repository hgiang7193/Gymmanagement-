const { DomainError, requireField } = require('../../identity-access/application/_shared');

class AssignBranchManagerUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.branchId, 'BRANCH_ID_REQUIRED');
    requireField(input?.managerUserId, 'MANAGER_USER_ID_REQUIRED');

    const branch = await this.deps.branchRepository.findById(input.branchId);
    if (!branch) {
      throw new DomainError('BRANCH_NOT_FOUND');
    }

    const manager = await this.deps.userRepository.findById(input.managerUserId);
    if (!manager) {
      throw new DomainError('USER_NOT_FOUND');
    }

    const managerRole = await this.deps.roleRepository.findByCode('MANAGER');
    if (!managerRole) {
      throw new DomainError('ROLE_NOT_FOUND');
    }

    const now = this.deps.clock.now();
    await this.deps.branchManagerAssignmentRepository.assign({
      id: this.deps.idGenerator.next('branch-manager-assignment'),
      branchId: branch.id,
      managerUserId: manager.id,
      activeFrom: now,
      activeTo: null,
      createdAt: now,
    });
    await this.deps.roleAssignmentRepository.assign({
      id: this.deps.idGenerator.next('role-assignment'),
      userId: manager.id,
      roleId: managerRole.id,
      branchId: branch.id,
      assignedAt: now,
    });
    await this.deps.auditLogRepository.append({
      actionCode: 'branch_manager_assigned',
      actorUserId: input.actorUserId,
      entityType: 'branch_manager_assignment',
      entityId: manager.id,
      branchId: branch.id,
      createdAt: now,
    });

    return {
      branchId: branch.id,
      managerUserId: manager.id,
      activeFrom: now,
    };
  }
}

module.exports = { AssignBranchManagerUseCase };
