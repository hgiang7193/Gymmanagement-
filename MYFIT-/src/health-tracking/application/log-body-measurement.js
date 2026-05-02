class LogBodyMeasurementUseCase {
  constructor({ bodyMeasurementRepository, userRepository, clock, idGenerator }) {
    this.bodyMeasurementRepository = bodyMeasurementRepository;
    this.userRepository = userRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute(payload) {
    const user = await this.userRepository.findById(payload.userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const measurement = {
      id: this.idGenerator.generate(),
      userId: payload.userId,
      measurementType: payload.measurementType,
      value: payload.value,
      unit: payload.unit,
      measuredAt: payload.measuredAt || this.clock.now(),
      measurementSource: payload.measurementSource || 'manual',
      createdBy: payload.actorUserId,
      createdAt: this.clock.now()
    };

    await this.bodyMeasurementRepository.create(measurement);
    return measurement;
  }
}

module.exports = { LogBodyMeasurementUseCase };
