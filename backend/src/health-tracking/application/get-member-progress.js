class GetMemberProgressUseCase {
  constructor({ healthProfileRepository, weightLogRepository, bodyMeasurementRepository }) {
    this.healthProfileRepository = healthProfileRepository;
    this.weightLogRepository = weightLogRepository;
    this.bodyMeasurementRepository = bodyMeasurementRepository;
  }

  async execute(payload) {
    const profile = await this.healthProfileRepository.findByUserId(payload.userId);
    // TODO (WS3.4): Phase 2 - Chuyển đổi việc query trực tiếp sang Materialized View
    // để tối ưu performance cho các truy vấn thống kê tiến trình sức khỏe phức tạp.
    const weightLogs = await this.weightLogRepository.listByUserId(payload.userId, 20);
    const bodyMeasurements = await this.bodyMeasurementRepository.listByUserId(payload.userId, 50);

    return {
      profile: profile || null,
      recentWeightLogs: weightLogs || [],
      recentBodyMeasurements: bodyMeasurements || []
    };
  }
}

module.exports = { GetMemberProgressUseCase };
