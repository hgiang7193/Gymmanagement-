const { DomainError, requireField } = require('./_shared');

class LogoutCurrentSessionUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.refreshToken, 'REFRESH_TOKEN_REQUIRED');

    const now = this.deps.clock.now();
    const session = await this.deps.refreshSessionRepository.findByToken(input.refreshToken);
    if (!session) {
      throw new DomainError('SESSION_NOT_FOUND');
    }

    await this.deps.refreshSessionRepository.revokeById(session.id, now);
    await this.deps.securityEventRepository.append({ eventType: 'logout_success', userId: session.userId, createdAt: now });
  }
}

module.exports = { LogoutCurrentSessionUseCase };
