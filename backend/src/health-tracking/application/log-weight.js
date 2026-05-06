class LogWeightUseCase {
  constructor({ weightLogRepository, userRepository, clock, idGenerator }) {
    this.weightLogRepository = weightLogRepository;
    this.userRepository = userRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute(payload) {
    const user = await this.userRepository.findById(payload.userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const log = {
      id: this.idGenerator.generate(),
      userId: payload.userId,
      weightKg: payload.weightKg,
      measuredAt: payload.measuredAt || this.clock.now(),
      measurementSource: payload.measurementSource || 'manual',
      deviceId: payload.deviceId || null,
      note: payload.note || null,
      createdBy: payload.actorUserId,
      createdAt: this.clock.now()
    };
    
    await this.weightLogRepository.create(log);
    return log;
  }
}

module.exports = { LogWeightUseCase };
