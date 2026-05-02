const { requireField } = require('./_shared');

class RequestPasswordResetUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.email, 'EMAIL_REQUIRED');

    const now = this.deps.clock.now();
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.deps.userRepository.findByEmail(normalizedEmail);

    if (user) {
      await this.deps.passwordResetTokenRepository.create({
        id: this.deps.idGenerator.next('password-reset'),
        userId: user.id,
        token: this.deps.idGenerator.next('reset-token'),
        expiresAt: new Date(now.getTime() + 3600000),
        usedAt: null,
        createdAt: now,
      });
    }

    await this.deps.securityEventRepository.append({ eventType: 'password_reset_requested', userId: user?.id ?? null, createdAt: now });
    return { accepted: true };
  }
}

module.exports = { RequestPasswordResetUseCase };
