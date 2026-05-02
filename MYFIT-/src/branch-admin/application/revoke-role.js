const { DomainError, requireField } = require('../../identity-access/application/_shared');

class RevokeRoleUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.userId, 'USER_ID_REQUIRED');
    requireField(input?.roleCode, 'ROLE_CODE_REQUIRED');

    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw new DomainError('USER_NOT_FOUND');

    const role = await this.deps.roleRepository.findByCode(input.roleCode);
    if (!role) throw new DomainError('ROLE_NOT_FOUND');

    const branchId = input.roleCode === 'MANAGER' ? (input.branchId ?? null) : null;

    if (input.roleCode === 'ADMIN') {
      const activeAdminCount = await this.deps.roleAssignmentRepository.countActiveUsersByRoleCode('ADMIN');
      if (activeAdminCount <= 1) {
        const primary = await this.deps.roleAssignmentRepository.findPrimaryRoleForUser(user.id);
        if (primary === 'ADMIN' && user.status === 'ACTIVE') {
          throw new DomainError('LAST_ADMIN_PROTECTED');
        }
      }
    }

    const assignment = await this.deps.roleAssignmentRepository.findByUserRoleBranch(user.id, role.id, branchId);
    if (!assignment) {
      throw new DomainError('ROLE_NOT_ASSIGNED');
    }

    const now = this.deps.clock.now();
    await this.deps.roleAssignmentRepository.deleteById(assignment.id);

    await this.deps.auditLogRepository.append({
      actionCode: 'role_revoked',
      actorUserId: input.actorUserId,
      entityType: 'user_role_assignment',
      entityId: assignment.id,
      branchId,
      metadata: { roleCode: input.roleCode, targetUserId: user.id },
      createdAt: now,
    });

    return { userId: user.id, roleCode: input.roleCode, branchId };
  }
}

module.exports = { RevokeRoleUseCase };
