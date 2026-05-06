const { SqlRepository } = require('./sql-repository');

class PostgresUserRepository extends SqlRepository {
  async findByEmail(email) {
    return this.oneMapped('select * from users where email = $1', [email]);
  }

  async findById(id) {
    return this.oneMapped('select * from users where id = $1', [id]);
  }

  async save(user) {
    await this.execute(
      `insert into users (id, email, password_hash, status, email_verified_at, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, user.email, user.passwordHash, user.status, user.emailVerifiedAt, user.createdAt, user.updatedAt]
    );
    return user;
  }

  async update(user) {
    await this.execute(
      `update users
       set email = $2, password_hash = $3, status = $4, email_verified_at = $5, updated_at = $6
       where id = $1`,
      [user.id, user.email, user.passwordHash, user.status, user.emailVerifiedAt, user.updatedAt]
    );
    return user;
  }

  async list() {
    return this.many('select id, email, status from users order by created_at asc');
  }
}

module.exports = { PostgresUserRepository };
