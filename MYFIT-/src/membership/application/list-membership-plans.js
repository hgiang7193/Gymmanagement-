class ListMembershipPlansUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute() {
    return this.deps.membershipPlanRepository.listActive();
  }
}

module.exports = { ListMembershipPlansUseCase };
