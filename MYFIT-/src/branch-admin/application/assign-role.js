const { DomainError, requireField } = require('../../identity-access/application/_shared');

const ASSIGNABLE_ROLES = new Set(['MEMBER', 'COACH', 'MANAGER', 'ADMIN']);

class AssignRoleUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.userId, 'USER_ID_REQUIRED');
    requireField(input?.roleCode, 'ROLE_CODE_REQUIRED');

    if (!ASSIGNABLE_ROLES.has(input.roleCode)) {
      throw new DomainError('INVALID_ROLE_CODE');
    }

    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw new DomainError('USER_NOT_FOUND');

    const role = await this.deps.roleRepository.findByCode(input.roleCode);
    if (!role) throw new DomainError('ROLE_NOT_FOUND');

    let branchId = input.branchId ?? null;
    if (input.roleCode === 'MANAGER') {
      requireField(branchId, 'BRANCH_ID_REQUIRED');
      const branch = await this.deps.branchRepository.findById(branchId);
      if (!branch) throw new DomainError('BRANCH_NOT_FOUND');
    } else {
      branchId = null;
    }

    const existing = await this.deps.roleAssignmentRepository.findByUserRoleBranch(user.id, role.id, branchId);
    if (existing) {
      throw new DomainError('ROLE_ALREADY_ASSIGNED');
    }

    const now = this.deps.clock.now();
    const assignment = {
      id: this.deps.idGenerator.next('role-assignment'),
      userId: user.id,
      roleId: role.id,
      branchId,
      assignedAt: now,
    };
    await this.deps.roleAssignmentRepository.assign(assignment);

    if (input.roleCode === 'MANAGER' && branchId) {
      await this.deps.branchManagerAssignmentRepository.assign({
        id: this.deps.idGenerator.next('branch-manager-assignment'),
        branchId,
        managerUserId: user.id,
        activeFrom: now,
        activeTo: null,
        createdAt: now,
      });
    }

    await this.deps.auditLogRepository.append({
      actionCode: 'role_assigned',
      actorUserId: input.actorUserId,
      entityType: 'user_role_assignment',
      entityId: assignment.id,
      branchId,
      metadata: { roleCode: input.roleCode, targetUserId: user.id },
      createdAt: now,
    });

    return { assignmentId: assignment.id, userId: user.id, roleCode: input.roleCode, branchId };
  }
}

module.exports = { AssignRoleUseCase };
