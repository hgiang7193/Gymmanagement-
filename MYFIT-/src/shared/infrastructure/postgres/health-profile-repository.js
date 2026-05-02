const { SqlRepository } = require('./sql-repository');

class PostgresHealthProfileRepository extends SqlRepository {
  async create(profile) {
    await this.execute(
      `insert into member_health_profiles (id, user_id, date_of_birth, gender, height_cm, primary_goal, medical_conditions, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [profile.id, profile.userId, profile.dateOfBirth, profile.gender, profile.heightCm, profile.primaryGoal, profile.medicalConditions, profile.createdAt, profile.updatedAt]
    );
    return profile;
  }

  async findByUserId(userId) {
    return this.oneMapped('select * from member_health_profiles where user_id = $1', [userId]);
  }

  async update(profile) {
    await this.execute(
      `update member_health_profiles
       set date_of_birth = $1, gender = $2, height_cm = $3, primary_goal = $4, medical_conditions = $5, updated_at = $6
       where id = $7`,
      [profile.dateOfBirth, profile.gender, profile.heightCm, profile.primaryGoal, profile.medicalConditions, profile.updatedAt, profile.id]
    );
  }
}

module.exports = { PostgresHealthProfileRepository };
