// UC-PROMO-01/02: Create and toggle promotions
class CreatePromotionUseCase {
  constructor({ promotionRepository, clock, idGenerator }) {
    this.promotionRepository = promotionRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute({ name, code, type, value, startsAt, endsAt, minOrderAmount, maxUses, stackable, scope, branchId, actorUserId }) {
    if (!name || !code || !type || value == null || !startsAt || !endsAt || !actorUserId) {
      throw new Error('VALIDATION_ERROR');
    }
    if (!['percent', 'fixed_amount'].includes(type)) throw new Error('INVALID_PROMO_TYPE');
    if (type === 'percent' && (Number(value) < 1 || Number(value) > 100)) throw new Error('INVALID_PROMO_VALUE');

    const existing = await this.promotionRepository.findByCode(code);
    if (existing) throw new Error('PROMO_CODE_EXISTS');

    const now = this.clock.now();
    const promo = {
      id: this.idGenerator.generate(),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type,
      value: Number(value),
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      minOrderAmount: Number(minOrderAmount ?? 0),
      maxUses: maxUses ? Number(maxUses) : null,
      stackable: stackable ?? false,
      scope: scope ?? 'branch',
      branchId: branchId ?? null,
      isActive: false,
      createdBy: actorUserId,
      createdAt: now,
    };
    await this.promotionRepository.create(promo);
    return promo;
  }
}

class TogglePromotionUseCase {
  constructor({ promotionRepository, clock }) {
    this.promotionRepository = promotionRepository;
    this.clock = clock;
  }

  async execute({ promotionId, isActive }) {
    const promo = await this.promotionRepository.findById(promotionId);
    if (!promo) throw new Error('PROMOTION_NOT_FOUND');
    await this.promotionRepository.toggle(promotionId, !!isActive, this.clock.now());
    return { promotionId, isActive: !!isActive };
  }
}

class ListPromotionsUseCase {
  constructor({ promotionRepository, clock }) {
    this.promotionRepository = promotionRepository;
    this.clock = clock;
  }

  async execute({ branchId, activeOnly = false }) {
    if (activeOnly) {
      return this.promotionRepository.listActive(branchId, this.clock.now());
    }
    return this.promotionRepository.listByBranch(branchId);
  }
}

module.exports = { CreatePromotionUseCase, TogglePromotionUseCase, ListPromotionsUseCase };
