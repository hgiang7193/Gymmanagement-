class ListManagerBranchesUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    const branchIds = await this.deps.branchManagerAssignmentRepository.listBranchIdsForManager(input.managerUserId);
    return this.deps.branchRepository.listByIds(branchIds);
  }
}

module.exports = { ListManagerBranchesUseCase };
