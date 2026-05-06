const { SqlRepository } = require('./sql-repository');

class PostgresBodyMeasurementRepository extends SqlRepository {
  async create(measurement) {
    await this.execute(
      `insert into member_body_measurements (id, user_id, measurement_type, value, unit, measured_at, measurement_source, created_by, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [measurement.id, measurement.userId, measurement.measurementType, measurement.value, measurement.unit, measurement.measuredAt, measurement.measurementSource, measurement.createdBy, measurement.createdAt]
    );
    return measurement;
  }

  async listByUserId(userId, limit = 200) {
    return this.manyMapped(
      'select * from member_body_measurements where user_id = $1 order by measured_at desc limit $2',
      [userId, limit]
    );
  }

  async listByUserIdAndType(userId, measurementType, limit = 50) {
    return this.manyMapped(
      'select * from member_body_measurements where user_id = $1 and measurement_type = $2 order by measured_at desc limit $3',
      [userId, measurementType, limit]
    );
  }
}

module.exports = { PostgresBodyMeasurementRepository };
