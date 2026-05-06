class ListBranchesUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute() {
    return this.deps.branchRepository.list();
  }
}

module.exports = { ListBranchesUseCase };
