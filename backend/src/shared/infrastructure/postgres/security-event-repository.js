const { randomUUID } = require('node:crypto');
const { SqlRepository } = require('./sql-repository');

class PostgresSecurityEventRepository extends SqlRepository {
  async append(event) {
    await this.execute(
      `insert into security_events (id, user_id, event_type, severity, metadata_json, created_at)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        event.id ?? randomUUID(),
        event.userId ?? null,
        event.eventType,
        event.severity ?? 'info',
        JSON.stringify(event.metadata ?? {}),
        event.createdAt,
      ]
    );
  }
}

module.exports = { PostgresSecurityEventRepository };
