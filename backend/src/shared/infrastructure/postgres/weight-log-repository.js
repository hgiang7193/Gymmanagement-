const { SqlRepository } = require('./sql-repository');

class PostgresWeightLogRepository extends SqlRepository {
  async create(log) {
    await this.execute(
      `insert into member_weight_logs (id, user_id, weight_kg, measured_at, measurement_source, device_id, note, created_by, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [log.id, log.userId, log.weightKg, log.measuredAt, log.measurementSource, log.deviceId, log.note, log.createdBy, log.createdAt]
    );
    return log;
  }

  async listByUserId(userId, limit = 100) {
    return this.manyMapped(
      'select * from member_weight_logs where user_id = $1 order by measured_at desc limit $2',
      [userId, limit]
    );
  }
}

module.exports = { PostgresWeightLogRepository };
