class ListManagerTrialsUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    const branchIds = await this.deps.branchManagerAssignmentRepository.listBranchIdsForManager(input.managerUserId);
    return this.deps.trialBookingRepository.listByBranchIds(branchIds);
  }
}

module.exports = { ListManagerTrialsUseCase };
