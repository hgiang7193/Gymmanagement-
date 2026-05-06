const { requireField, DomainError } = require('../../identity-access/application/_shared');

class ListUserRolesUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    requireField(input?.userId, 'USER_ID_REQUIRED');
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw new DomainError('USER_NOT_FOUND');
    return this.deps.roleAssignmentRepository.listForUser(input.userId);
  }
}

module.exports = { ListUserRolesUseCase };
