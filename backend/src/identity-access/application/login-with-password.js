const { DomainError, requireField } = require('./_shared');

class LoginWithPasswordUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.email, 'EMAIL_REQUIRED');
    requireField(input?.password, 'PASSWORD_REQUIRED');

    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.deps.userRepository.findByEmail(normalizedEmail);
    const now = this.deps.clock.now();

    if (!user || !(await this.deps.passwordHasher.verify(input.password, user.passwordHash))) {
      await this.deps.securityEventRepository.append({ eventType: 'login_failed', userId: user?.id ?? null, createdAt: now });
      throw new DomainError('INVALID_CREDENTIALS');
    }

    if (user.status !== 'ACTIVE') {
      await this.deps.securityEventRepository.append({ eventType: 'login_failed', userId: user.id, createdAt: now });
      throw new DomainError('USER_INACTIVE');
    }

    const primaryRole = (await this.deps.roleAssignmentRepository.findPrimaryRoleForUser(user.id)) ?? 'GUEST';
    const branchIds = await this.deps.branchManagerAssignmentRepository.listBranchIdsForManager(user.id);
    const sessionId = this.deps.idGenerator.next('session');
    const refreshToken = await this.deps.tokenService.issueRefreshToken({ sessionId, userId: user.id });
    await this.deps.refreshSessionRepository.create({
      id: sessionId,
      userId: user.id,
      token: refreshToken,
      revokedAt: null,
      createdAt: now,
    });
    const accessToken = await this.deps.tokenService.issueAccessToken({ userId: user.id, primaryRole, branchIds });
    await this.deps.securityEventRepository.append({ eventType: 'login_success', userId: user.id, createdAt: now });

    return { accessToken, refreshToken };
  }
}

module.exports = { LoginWithPasswordUseCase };
