const { DomainError, requireField } = require('../../identity-access/application/_shared');

const ALLOWED_STATUSES = new Set(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_PASSWORD_RESET']);

class UpdateUserStatusUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.userId, 'USER_ID_REQUIRED');
    requireField(input?.status, 'STATUS_REQUIRED');

    if (!ALLOWED_STATUSES.has(input.status)) {
      throw new DomainError('INVALID_USER_STATUS');
    }

    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      throw new DomainError('USER_NOT_FOUND');
    }

    const wasActive = user.status === 'ACTIVE';
    const becomingNonActive = input.status !== 'ACTIVE';

    if (wasActive && becomingNonActive) {
      const primaryRole = await this.deps.roleAssignmentRepository.findPrimaryRoleForUser(user.id);
      if (primaryRole === 'ADMIN') {
        const activeAdminCount = await this.deps.roleAssignmentRepository.countActiveUsersByRoleCode('ADMIN');
        if (activeAdminCount <= 1) {
          throw new DomainError('LAST_ADMIN_PROTECTED');
        }
      }
    }

    const now = this.deps.clock.now();
    user.status = input.status;
    user.updatedAt = now;
    await this.deps.userRepository.update(user);

    if (becomingNonActive) {
      await this.deps.refreshSessionRepository.revokeAllForUser(user.id, now);
    }

    await this.deps.auditLogRepository.append({
      actionCode: 'user_status_changed',
      actorUserId: input.actorUserId,
      entityType: 'user',
      entityId: user.id,
      metadata: { newStatus: input.status, sessionsRevoked: becomingNonActive },
      createdAt: now,
    });
    return user;
  }
}

module.exports = { UpdateUserStatusUseCase };
