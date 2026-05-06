class UpdateHealthProfileUseCase {
  constructor({ healthProfileRepository, userRepository, clock, idGenerator }) {
    this.healthProfileRepository = healthProfileRepository;
    this.userRepository = userRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute(payload) {
    const user = await this.userRepository.findById(payload.userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    let profile = await this.healthProfileRepository.findByUserId(payload.userId);
    if (profile) {
      profile.dateOfBirth = payload.dateOfBirth !== undefined ? payload.dateOfBirth : profile.dateOfBirth;
      profile.gender = payload.gender !== undefined ? payload.gender : profile.gender;
      profile.heightCm = payload.heightCm !== undefined ? payload.heightCm : profile.heightCm;
      profile.primaryGoal = payload.primaryGoal !== undefined ? payload.primaryGoal : profile.primaryGoal;
      profile.medicalConditions = payload.medicalConditions !== undefined ? payload.medicalConditions : profile.medicalConditions;
      profile.updatedAt = this.clock.now();
      await this.healthProfileRepository.update(profile);
    } else {
      profile = {
        id: this.idGenerator.generate(),
        userId: payload.userId,
        dateOfBirth: payload.dateOfBirth || null,
        gender: payload.gender || null,
        heightCm: payload.heightCm || null,
        primaryGoal: payload.primaryGoal || null,
        medicalConditions: payload.medicalConditions || null,
        createdAt: this.clock.now(),
        updatedAt: this.clock.now()
      };
      await this.healthProfileRepository.create(profile);
    }
    return profile;
  }
}

module.exports = { UpdateHealthProfileUseCase };
