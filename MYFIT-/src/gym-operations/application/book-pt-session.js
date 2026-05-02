class BookPtSessionUseCase {
  constructor({ ptSessionRepository, ptPackageRepository, userRepository, branchRepository, clock, idGenerator }) {
    this.ptSessionRepository = ptSessionRepository;
    this.ptPackageRepository = ptPackageRepository;
    this.userRepository = userRepository;
    this.branchRepository = branchRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute(payload) {
    const member = await this.userRepository.findById(payload.memberUserId);
    if (!member) throw new Error('USER_NOT_FOUND');

    const trainer = await this.userRepository.findById(payload.trainerUserId);
    if (!trainer) throw new Error('USER_NOT_FOUND');

    const branch = await this.branchRepository.findById(payload.branchId);
    if (!branch) throw new Error('BRANCH_NOT_FOUND');

    if (payload.ptPackageId) {
      const pkg = await this.ptPackageRepository.findById(payload.ptPackageId);
      if (!pkg) throw new Error('PT_PACKAGE_NOT_FOUND');
    }

    const session = {
      id: this.idGenerator.generate(),
      memberUserId: payload.memberUserId,
      trainerUserId: payload.trainerUserId,
      ptPackageId: payload.ptPackageId || null,
      branchId: payload.branchId,
      scheduledAt: payload.scheduledAt,
      status: 'scheduled',
      attendedAt: null,
      notes: payload.notes || null,
      createdAt: this.clock.now(),
      updatedAt: this.clock.now()
    };

    await this.ptSessionRepository.create(session);
    return session;
  }
}

module.exports = { BookPtSessionUseCase };
