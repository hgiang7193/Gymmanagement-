const { SqlRepository } = require('./sql-repository');

class PostgresSubscriptionStatusHistoryRepository extends SqlRepository {
  async append(entry) {
    await this.execute(
      `insert into subscription_status_history (id, subscription_id, from_status, to_status, changed_by, reason, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [entry.id, entry.subscriptionId, entry.fromStatus, entry.toStatus, entry.changedBy, entry.reason, entry.createdAt]
    );
  }
}

module.exports = { PostgresSubscriptionStatusHistoryRepository };
