const { SqlRepository } = require('./sql-repository');

class PostgresProfileRepository extends SqlRepository {
  async findByUserId(userId) {
    return this.oneMapped('select * from profiles where user_id = $1', [userId]);
  }

  async save(profile) {
    await this.execute(
      `insert into profiles (id, user_id, full_name, created_at, updated_at)
       values ($1, $2, $3, $4, $5)`,
      [profile.id, profile.userId, profile.fullName, profile.createdAt, profile.updatedAt]
    );
    return profile;
  }
}

module.exports = { PostgresProfileRepository };
