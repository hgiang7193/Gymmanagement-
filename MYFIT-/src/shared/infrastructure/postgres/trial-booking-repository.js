const { SqlRepository } = require('./sql-repository');

class PostgresTrialBookingRepository extends SqlRepository {
  async create(trialBooking) {
    await this.execute(
      `insert into trial_bookings (
          id, guest_user_id, full_name, phone_number, email, branch_id,
          trial_plan_name, scheduled_at, status, notes,
          converted_subscription_id, converted_at, created_at, updated_at
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        trialBooking.id,
        trialBooking.guestUserId,
        trialBooking.fullName,
        trialBooking.phoneNumber,
        trialBooking.email,
        trialBooking.branchId,
        trialBooking.trialPlanName,
        trialBooking.scheduledAt,
        trialBooking.status,
        trialBooking.notes,
        trialBooking.convertedSubscriptionId,
        trialBooking.convertedAt,
        trialBooking.createdAt,
        trialBooking.updatedAt,
      ]
    );
    return trialBooking;
  }

  async findById(id) {
    return this.oneMapped('select * from trial_bookings where id = $1', [id]);
  }

  async listByBranchIds(branchIds) {
    if (!branchIds.length) return [];
    return this.manyMapped(
      `select *
       from trial_bookings
       where branch_id = any($1::text[])
       order by scheduled_at asc, created_at asc`,
      [branchIds]
    );
  }

  async findByBranchAndDate(branchId, date) {
    return this.manyMapped(
      `SELECT * FROM trial_bookings
       WHERE branch_id = $1 AND date_trunc('day', scheduled_at) = $2::date
       ORDER BY scheduled_at ASC`,
      [branchId, date]
    );
  }

  async findByGuestUser(userId) {
    return this.manyMapped(
      `SELECT * FROM trial_bookings WHERE guest_user_id = $1 ORDER BY scheduled_at DESC`,
      [userId]
    );
  }

  async update(trialBooking) {
    await this.execute(
      `update trial_bookings
       set full_name = $2,
           phone_number = $3,
           email = $4,
           branch_id = $5,
           trial_plan_name = $6,
           scheduled_at = $7,
           status = $8,
           notes = $9,
           converted_subscription_id = $10,
           converted_at = $11,
           updated_at = $12
       where id = $1`,
      [
        trialBooking.id,
        trialBooking.fullName,
        trialBooking.phoneNumber,
        trialBooking.email,
        trialBooking.branchId,
        trialBooking.trialPlanName,
        trialBooking.scheduledAt,
        trialBooking.status,
        trialBooking.notes,
        trialBooking.convertedSubscriptionId,
        trialBooking.convertedAt,
        trialBooking.updatedAt,
      ]
    );
    return trialBooking;
  }
}

module.exports = { PostgresTrialBookingRepository };
