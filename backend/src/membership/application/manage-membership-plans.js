// UC-PROD-01/02/03: Create, update, toggle membership plan catalog
class CreateMembershipPlanUseCase {
  constructor({ membershipPlanRepository, clock, idGenerator }) {
    this.membershipPlanRepository = membershipPlanRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute({ name, code, planType, price, durationDays, totalSessions, description }) {
    if (!name || !code || !price || !durationDays || totalSessions == null) throw new Error('VALIDATION_ERROR');
    const now = this.clock.now();
    const plan = {
      id: this.idGenerator.generate(),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      planType: planType ?? 'membership',
      price: Number(price),
      durationDays: Number(durationDays),
      totalSessions: Number(totalSessions),
      description: description ?? null,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    };
    await this.membershipPlanRepository.create(plan);
    return plan;
  }
}

class UpdateMembershipPlanUseCase {
  constructor({ membershipPlanRepository, clock }) {
    this.membershipPlanRepository = membershipPlanRepository;
    this.clock = clock;
  }

  async execute({ planId, name, price, durationDays, totalSessions, description }) {
    const plan = await this.membershipPlanRepository.findById(planId);
    if (!plan) throw new Error('PLAN_NOT_FOUND');
    const now = this.clock.now();
    await this.membershipPlanRepository.update({
      id: planId,
      name: name ?? plan.name,
      price: price != null ? Number(price) : plan.price,
      durationDays: durationDays != null ? Number(durationDays) : plan.durationDays,
      totalSessions: totalSessions != null ? Number(totalSessions) : plan.totalSessions,
      description: description !== undefined ? description : plan.description,
      updatedAt: now,
    });
    return { planId, updatedAt: now };
  }
}

class ToggleMembershipPlanUseCase {
  constructor({ membershipPlanRepository, clock }) {
    this.membershipPlanRepository = membershipPlanRepository;
    this.clock = clock;
  }

  async execute({ planId, isActive }) {
    const plan = await this.membershipPlanRepository.findById(planId);
    if (!plan) throw new Error('PLAN_NOT_FOUND');
    await this.membershipPlanRepository.setActive(planId, !!isActive, this.clock.now());
    return { planId, isActive: !!isActive };
  }
}

module.exports = { CreateMembershipPlanUseCase, UpdateMembershipPlanUseCase, ToggleMembershipPlanUseCase };
