const { SqlRepository } = require('./sql-repository');

class PostgresRefreshSessionRepository extends SqlRepository {
  async create(session) {
    await this.execute(
      `insert into refresh_sessions (id, user_id, token, revoked_at, created_at)
       values ($1, $2, $3, $4, $5)`,
      [session.id, session.userId, session.token, session.revokedAt, session.createdAt]
    );
    return session;
  }

  async findByToken(token) {
    return this.one('select * from refresh_sessions where token = $1', [token]);
  }

  async revokeById(id, revokedAt) {
    await this.execute('update refresh_sessions set revoked_at = $2 where id = $1', [id, revokedAt]);
  }

  async revokeAllForUser(userId, revokedAt) {
    await this.execute('update refresh_sessions set revoked_at = $2 where user_id = $1 and revoked_at is null', [userId, revokedAt]);
  }
}

module.exports = { PostgresRefreshSessionRepository };
