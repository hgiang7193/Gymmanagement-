const { randomUUID } = require('node:crypto');
const { SqlRepository } = require('./sql-repository');

class PostgresAuditLogRepository extends SqlRepository {
  // Alias for use cases that call .create()
  async create(event) {
    return this.append(event);
  }

  async append(event) {
    await this.execute(
      `insert into audit_logs (id, actor_user_id, action_code, entity_type, entity_id, branch_id, metadata_json, created_at)
      values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        event.id ?? randomUUID(),
        event.actorUserId ?? null,
        event.actionCode,
        event.entityType ?? null,
        event.entityId ?? null,
        event.branchId ?? null,
        JSON.stringify(event.metadata ?? {}),
        event.createdAt,
      ]
    );
  }
}

module.exports = { PostgresAuditLogRepository };
