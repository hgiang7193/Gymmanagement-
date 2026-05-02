const { SqlRepository } = require('./sql-repository');

class PostgresTrialStatusHistoryRepository extends SqlRepository {
  async append(entry) {
    await this.execute(
      `insert into trial_status_history (id, trial_booking_id, from_status, to_status, changed_by, created_at)
       values ($1, $2, $3, $4, $5, $6)`,
      [entry.id, entry.trialBookingId, entry.fromStatus, entry.toStatus, entry.changedBy, entry.createdAt]
    );
  }
}

module.exports = { PostgresTrialStatusHistoryRepository };
