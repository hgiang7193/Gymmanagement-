const { SqlRepository } = require('./sql-repository');

class PostgresRoleRepository extends SqlRepository {
  async findByCode(code) {
    return this.one('select * from roles where code = $1', [code]);
  }
}

module.exports = { PostgresRoleRepository };
