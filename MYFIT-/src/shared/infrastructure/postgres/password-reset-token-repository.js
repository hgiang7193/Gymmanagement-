const { SqlRepository } = require('./sql-repository');

class PostgresPasswordResetTokenRepository extends SqlRepository {
  async create(token) {
    await this.execute(
      `insert into password_reset_tokens (id, user_id, token, expires_at, used_at, created_at)
       values ($1, $2, $3, $4, $5, $6)`,
      [token.id, token.userId, token.token, token.expiresAt, token.usedAt, token.createdAt]
    );
    return token;
  }

  async findByToken(token) {
    return this.one('select * from password_reset_tokens where token = $1', [token]);
  }

  async markUsed(id, usedAt) {
    await this.execute('update password_reset_tokens set used_at = $2 where id = $1', [id, usedAt]);
  }
}

module.exports = { PostgresPasswordResetTokenRepository };
