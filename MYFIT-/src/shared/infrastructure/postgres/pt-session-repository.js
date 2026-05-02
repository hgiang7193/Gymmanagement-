const { SqlRepository } = require('./sql-repository');

class PostgresPtSessionRepository extends SqlRepository {
  async create(session) {
    await this.execute(
      `insert into pt_sessions (id, member_user_id, trainer_user_id, pt_package_id, branch_id, scheduled_at, status, attended_at, notes, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [session.id, session.memberUserId, session.trainerUserId, session.ptPackageId, session.branchId, session.scheduledAt, session.status, session.attendedAt, session.notes, session.createdAt, session.updatedAt]
    );
    return session;
  }

  async findById(id) {
    return this.oneMapped('select * from pt_sessions where id = $1', [id]);
  }

  async update(session) {
    await this.execute(
      `update pt_sessions
       set status = $1, attended_at = $2, notes = $3, updated_at = $4
       where id = $5`,
      [session.status, session.attendedAt, session.notes, session.updatedAt, session.id]
    );
  }

  async listByTrainer(trainerUserId, status) {
    if (status) {
      return this.manyMapped('select * from pt_sessions where trainer_user_id = $1 and status = $2 order by scheduled_at asc', [trainerUserId, status]);
    }
    return this.manyMapped('select * from pt_sessions where trainer_user_id = $1 order by scheduled_at asc', [trainerUserId]);
  }

  async listByMember(memberUserId) {
    return this.manyMapped('select * from pt_sessions where member_user_id = $1 order by scheduled_at desc', [memberUserId]);
  }
}

module.exports = { PostgresPtSessionRepository };
