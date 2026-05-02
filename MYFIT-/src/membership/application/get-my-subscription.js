class GetMySubscriptionUseCase {
  constructor(deps) {
    this.deps = deps;
  }

  async execute(input) {
    return this.deps.subscriptionRepository.findCurrentByUserId(input.userId);
  }
}

module.exports = { GetMySubscriptionUseCase };
