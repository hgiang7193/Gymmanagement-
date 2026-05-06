const { SqlRepository } = require('./sql-repository');

class PostgresBranchRepository extends SqlRepository {
  async create(branch) {
    await this.execute(
      `insert into branches (id, code, name, address, phone_number, status, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [branch.id, branch.code, branch.name, branch.address, branch.phoneNumber, branch.status, branch.createdAt, branch.updatedAt]
    );
    return branch;
  }

  async list() {
    return this.manyMapped('select * from branches order by created_at asc');
  }

  async findByCode(code) {
    return this.oneMapped('select * from branches where code = $1', [code]);
  }

  async findById(id) {
    return this.oneMapped('select * from branches where id = $1', [id]);
  }

  async listByIds(branchIds) {
    if (!branchIds.length) return [];
    return this.manyMapped('select * from branches where id = any($1::text[]) order by created_at asc', [branchIds]);
  }

  async update(branch) {
    await this.execute(
      `update branches
       set name = $2,
           address = $3,
           phone_number = $4,
           status = $5,
           zalo_link = $6,
           zalo_phone = $7,
           contact_email = $8,
           updated_at = $9
       where id = $1`,
      [
        branch.id,
        branch.name,
        branch.address,
        branch.phoneNumber ?? null,
        branch.status,
        branch.zaloLink ?? null,
        branch.zaloPhone ?? null,
        branch.contactEmail ?? null,
        branch.updatedAt,
      ]
    );
    return branch;
  }

  async countActiveSubscriptions(branchId) {
    const row = await this.one(
      `select count(*)::int as count
       from subscriptions
       where home_branch_id = $1 and status = 'ACTIVE'`,
      [branchId]
    );
    return row?.count ?? 0;
  }
}

module.exports = { PostgresBranchRepository };
