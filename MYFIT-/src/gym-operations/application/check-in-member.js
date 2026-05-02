class CheckInMemberUseCase {
  constructor({ memberCheckInRepository, userRepository, branchRepository, clock, idGenerator }) {
    this.memberCheckInRepository = memberCheckInRepository;
    this.userRepository = userRepository;
    this.branchRepository = branchRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute(payload) {
    const user = await this.userRepository.findById(payload.userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const branch = await this.branchRepository.findById(payload.branchId);
    if (!branch) throw new Error('BRANCH_NOT_FOUND');

    const checkIn = {
      id: this.idGenerator.generate(),
      userId: payload.userId,
      branchId: payload.branchId,
      subscriptionId: payload.subscriptionId || null,
      checkInTime: this.clock.now(),
      createdBy: payload.actorUserId || null,
      createdAt: this.clock.now()
    };

    await this.memberCheckInRepository.create(checkIn);
    return checkIn;
  }
}

module.exports = { CheckInMemberUseCase };
