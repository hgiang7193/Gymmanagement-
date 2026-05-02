const { SqlRepository } = require('./sql-repository');

class PostgresMemberCheckInRepository extends SqlRepository {
  async create(checkIn) {
    await this.execute(
      `insert into member_check_ins (id, user_id, branch_id, subscription_id, check_in_time, created_by, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [checkIn.id, checkIn.userId, checkIn.branchId, checkIn.subscriptionId, checkIn.checkInTime, checkIn.createdBy, checkIn.createdAt]
    );
    return checkIn;
  }

  async listByBranchId(branchId, limit = 50) {
    return this.manyMapped(
      'select * from member_check_ins where branch_id = $1 order by check_in_time desc limit $2',
      [branchId, limit]
    );
  }

  async listByUserId(userId, limit = 50) {
    return this.manyMapped(
      'select * from member_check_ins where user_id = $1 order by check_in_time desc limit $2',
      [userId, limit]
    );
  }
}

module.exports = { PostgresMemberCheckInRepository };
