const { SqlRepository } = require('./sql-repository');

class PostgresPromotionRepository extends SqlRepository {
  async create(promo) {
    await this.execute(
      `INSERT INTO promotions
         (id, code, name, type, value, starts_at, ends_at,
          min_order_amount, max_uses, stackable, scope, branch_id,
          is_active, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)`,
      [
        promo.id, promo.code, promo.name, promo.type, promo.value,
        promo.startsAt, promo.endsAt, promo.minOrderAmount ?? 0,
        promo.maxUses ?? null, promo.stackable ?? false,
        promo.scope ?? 'branch', promo.branchId ?? null,
        promo.isActive ?? false, promo.createdBy, promo.createdAt,
      ]
    );
    return promo;
  }

  async findById(id) {
    return this.oneMapped('SELECT * FROM promotions WHERE id = $1', [id]);
  }

  async findByCode(code) {
    return this.oneMapped('SELECT * FROM promotions WHERE code = $1', [code]);
  }

  async listActive(branchId, now) {
    return this.manyMapped(
      `SELECT * FROM promotions
       WHERE is_active = true
         AND starts_at <= $1 AND ends_at >= $1
         AND (scope = 'global' OR branch_id = $2)
       ORDER BY created_at DESC`,
      [now, branchId]
    );
  }

  async listByBranch(branchId) {
    return this.manyMapped(
      `SELECT * FROM promotions WHERE branch_id = $1 OR scope = 'global' ORDER BY created_at DESC`,
      [branchId]
    );
  }

  async toggle(id, isActive, updatedAt) {
    await this.execute(
      'UPDATE promotions SET is_active=$1, updated_at=$2 WHERE id=$3',
      [isActive, updatedAt, id]
    );
  }

  async incrementUsage(id) {
    await this.execute(
      'UPDATE promotions SET uses_count = uses_count + 1, updated_at = NOW() WHERE id = $1',
      [id]
    );
  }
}

module.exports = { PostgresPromotionRepository };
