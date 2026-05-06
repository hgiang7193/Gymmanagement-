const { SqlRepository } = require('./sql-repository');

class PostgresOrganizationRepository extends SqlRepository {
  async create(org) {
    await this.execute(
      `insert into organizations (id, name, tax_id, created_at, updated_at)
       values ($1, $2, $3, $4, $5)`,
      [org.id, org.name, org.taxId, org.createdAt, org.updatedAt]
    );
    return org;
  }

  async findById(id) {
    return this.oneMapped('select * from organizations where id = $1', [id]);
  }

  async list() {
    return this.manyMapped('select * from organizations order by created_at asc');
  }
}

module.exports = { PostgresOrganizationRepository };
