const { DomainError, requireField } = require('./_shared');

class RefreshAccessTokenUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.refreshToken, 'REFRESH_TOKEN_REQUIRED');

    const now = this.deps.clock.now();
    const session = await this.deps.refreshSessionRepository.findByToken(input.refreshToken);
    if (!session || session.revokedAt) {
      await this.deps.securityEventRepository.append({ eventType: 'refresh_token_rejected', userId: session?.userId ?? null, createdAt: now });
      throw new DomainError('INVALID_REFRESH_TOKEN');
    }

    const primaryRole = (await this.deps.roleAssignmentRepository.findPrimaryRoleForUser(session.userId)) ?? 'GUEST';
    const managerBranchIds = await this.deps.branchManagerAssignmentRepository.listBranchIdsForManager(session.userId);
    const roleBranchIds = await this.deps.roleAssignmentRepository.listBranchIdsForUser(session.userId);
    const branchIds = [...new Set([...managerBranchIds, ...roleBranchIds])];
    await this.deps.refreshSessionRepository.revokeById(session.id, now);
    const newSessionId = this.deps.idGenerator.next('session');
    const refreshToken = await this.deps.tokenService.issueRefreshToken({ sessionId: newSessionId, userId: session.userId });
    await this.deps.refreshSessionRepository.create({ id: newSessionId, userId: session.userId, token: refreshToken, revokedAt: null, createdAt: now });
    const accessToken = await this.deps.tokenService.issueAccessToken({ userId: session.userId, primaryRole, branchIds });
    await this.deps.securityEventRepository.append({ eventType: 'refresh_token_rotated', userId: session.userId, createdAt: now });

    return { accessToken, refreshToken };
  }
}

module.exports = { RefreshAccessTokenUseCase };
