const { SqlRepository } = require('./sql-repository');

class PostgresSubscriptionRepository extends SqlRepository {
  async findActiveByUserId(userId) {
    return this.oneMapped(
      `select * from subscriptions
       where user_id = $1 and status = 'ACTIVE'
       order by activated_at desc
       limit 1`,
      [userId]
    );
  }

  async findCurrentByUserId(userId) {
    return this.oneMapped(
      `select * from subscriptions
       where user_id = $1
       order by activated_at desc
       limit 1`,
      [userId]
    );
  }

  async create(subscription) {
    await this.execute(
      `insert into subscriptions (
          id, user_id, membership_plan_id, home_branch_id, status,
          started_at, expires_at, total_sessions, sessions_used, sessions_remaining,
          activated_by, activated_at
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        subscription.id,
        subscription.userId,
        subscription.membershipPlanId,
        subscription.homeBranchId,
        subscription.status,
        subscription.startedAt,
        subscription.expiresAt,
        subscription.totalSessions,
        subscription.sessionsUsed,
        subscription.sessionsRemaining,
        subscription.activatedBy,
        subscription.activatedAt,
      ]
    );
    return subscription;
  }

  async update(subscription) {
    await this.execute(
      `update subscriptions
       set membership_plan_id = $2,
           home_branch_id = $3,
           status = $4,
           started_at = $5,
           expires_at = $6,
           total_sessions = $7,
           sessions_used = $8,
           sessions_remaining = $9,
           activated_by = $10,
           activated_at = $11
       where id = $1`,
      [
        subscription.id,
        subscription.membershipPlanId,
        subscription.homeBranchId,
        subscription.status,
        subscription.startedAt,
        subscription.expiresAt,
        subscription.totalSessions,
        subscription.sessionsUsed,
        subscription.sessionsRemaining,
        subscription.activatedBy,
        subscription.activatedAt,
      ]
    );
    return subscription;
  }
}

module.exports = { PostgresSubscriptionRepository };
