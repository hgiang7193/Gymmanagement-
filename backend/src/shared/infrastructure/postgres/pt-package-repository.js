const { SqlRepository } = require('./sql-repository');

class PostgresPtPackageRepository extends SqlRepository {
  async create(pkg) {
    await this.execute(
      `insert into pt_packages (id, code, name, price, total_sessions, is_active, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [pkg.id, pkg.code, pkg.name, pkg.price, pkg.totalSessions, pkg.isActive, pkg.createdAt]
    );
    return pkg;
  }

  async findByCode(code) {
    return this.oneMapped('select * from pt_packages where code = $1', [code]);
  }

  async findById(id) {
    return this.oneMapped('select * from pt_packages where id = $1', [id]);
  }

  async listActive() {
    return this.manyMapped('select * from pt_packages where is_active = true order by price asc');
  }
}

module.exports = { PostgresPtPackageRepository };
