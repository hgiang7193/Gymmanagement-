const { SqlRepository } = require('./sql-repository');

class PostgresMembershipPlanRepository extends SqlRepository {
  async listActive() {
    return this.manyMapped('select * from membership_plans where is_active = true order by created_at asc');
  }

  async findById(id) {
    return this.oneMapped('select * from membership_plans where id = $1', [id]);
  }

  async listAll() {
    return this.manyMapped('select * from membership_plans order by created_at desc');
  }

  async create(plan) {
    await this.execute(
      `INSERT INTO membership_plans
         (id, code, name, price, duration_days, total_sessions, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [plan.id, plan.code, plan.name, plan.price, plan.durationDays, plan.totalSessions, plan.isActive, plan.createdAt]
    );
    return plan;
  }

  async update(plan) {
    await this.execute(
      `UPDATE membership_plans
       SET name=$1, price=$2, duration_days=$3, total_sessions=$4, updated_at=$5
       WHERE id=$6`,
      [plan.name, plan.price, plan.durationDays, plan.totalSessions, plan.updatedAt, plan.id]
    );
  }

  async setActive(id, isActive, updatedAt) {
    await this.execute(
      'UPDATE membership_plans SET is_active=$1, updated_at=$2 WHERE id=$3',
      [isActive, updatedAt, id]
    );
  }
}

module.exports = { PostgresMembershipPlanRepository };
