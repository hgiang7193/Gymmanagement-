class CreateOrganizationUseCase {
  constructor({ organizationRepository, clock, idGenerator }) {
    this.organizationRepository = organizationRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute(payload) {
    const org = {
      id: this.idGenerator.generate(),
      name: payload.name,
      taxId: payload.taxId || null,
      createdAt: this.clock.now(),
      updatedAt: this.clock.now()
    };
    await this.organizationRepository.create(org);
    return org;
  }
}

module.exports = { CreateOrganizationUseCase };
