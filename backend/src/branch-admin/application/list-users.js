class ListUsersUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute() {
    return this.deps.userRepository.list();
  }
}

module.exports = { ListUsersUseCase };
