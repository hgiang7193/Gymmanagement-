const { SqlRepository } = require('./sql-repository');

class PostgresCoursePackageRepository extends SqlRepository {
  async findById(id) {
    return this.oneMapped(
      'SELECT * FROM course_packages WHERE id = $1',
      [id]
    );
  }

  async listActive() {
    return this.manyMapped(
      'SELECT * FROM course_packages WHERE is_active = true ORDER BY total_sessions ASC'
    );
  }
}

module.exports = { PostgresCoursePackageRepository };
