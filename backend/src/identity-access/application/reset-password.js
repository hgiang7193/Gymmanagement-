const { DomainError, requireField } = require('./_shared');

class ResetPasswordUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.token, 'RESET_TOKEN_REQUIRED');
    requireField(input?.newPassword, 'PASSWORD_REQUIRED');

    const now = this.deps.clock.now();
    const resetToken = await this.deps.passwordResetTokenRepository.findByToken(input.token);
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) {
      throw new DomainError('INVALID_RESET_TOKEN');
    }

    const user = await this.deps.userRepository.findById(resetToken.userId);
    if (!user) {
      throw new DomainError('USER_NOT_FOUND');
    }

    user.passwordHash = await this.deps.passwordHasher.hash(input.newPassword);
    user.updatedAt = now;
    await this.deps.userRepository.update(user);
    await this.deps.passwordResetTokenRepository.markUsed(resetToken.id, now);
    await this.deps.refreshSessionRepository.revokeAllForUser(user.id, now);
    await this.deps.securityEventRepository.append({ eventType: 'password_reset_completed', userId: user.id, createdAt: now });
    await this.deps.auditLogRepository.append({ actionCode: 'password_reset_completed', actorUserId: user.id, createdAt: now });
  }
}

module.exports = { ResetPasswordUseCase };
