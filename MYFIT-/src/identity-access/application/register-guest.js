const { DomainError, requireField } = require('./_shared');

class RegisterGuestUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.email, 'EMAIL_REQUIRED');
    requireField(input?.password, 'PASSWORD_REQUIRED');

    const normalizedEmail = input.email.trim().toLowerCase();
    const existingUser = await this.deps.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new DomainError('EMAIL_ALREADY_EXISTS');
    }

    const guestRole = await this.deps.roleRepository.findByCode('GUEST');
    if (!guestRole) {
      throw new DomainError('ROLE_NOT_FOUND');
    }

    const passwordHash = await this.deps.passwordHasher.hash(input.password);
    const now = this.deps.clock.now();
    const user = {
      id: this.deps.idGenerator.next('user'),
      email: normalizedEmail,
      passwordHash,
      status: 'ACTIVE',
      emailVerifiedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const profile = {
      id: this.deps.idGenerator.next('profile'),
      userId: user.id,
      fullName: input.profile?.fullName ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await this.deps.userRepository.save(user);
    await this.deps.profileRepository.save(profile);
    await this.deps.roleAssignmentRepository.assign({
      id: this.deps.idGenerator.next('role-assignment'),
      userId: user.id,
      roleId: guestRole.id,
      branchId: null,
      assignedAt: now,
    });
    await this.deps.verificationService.sendEmailVerification({ userId: user.id, email: user.email });
    await this.deps.auditLogRepository.append({ actionCode: 'guest_registered', actorUserId: user.id, createdAt: now });
    await this.deps.securityEventRepository.append({ eventType: 'register_success', userId: user.id, createdAt: now });

    return { user, profile };
  }
}

module.exports = { RegisterGuestUseCase };
