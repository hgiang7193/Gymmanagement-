const { SqlRepository } = require('./sql-repository');

const ROLE_PRIORITY = ['ADMIN', 'MANAGER', 'COACH', 'MEMBER', 'GUEST'];

class PostgresRoleAssignmentRepository extends SqlRepository {
  async assign(roleAssignment) {
    await this.execute(
      `insert into user_role_assignments (id, user_id, role_id, branch_id, assigned_at)
       values ($1, $2, $3, $4, $5)`,
      [roleAssignment.id, roleAssignment.userId, roleAssignment.roleId, roleAssignment.branchId, roleAssignment.assignedAt]
    );
    return roleAssignment;
  }

  async findPrimaryRoleForUser(userId) {
    const rows = await this.many(
      `select r.code
       from user_role_assignments ura
       join roles r on r.id = ura.role_id
       where ura.user_id = $1`,
      [userId]
    );
    const codes = rows.map((row) => row.code);
    return ROLE_PRIORITY.find((code) => codes.includes(code)) ?? null;
  }

  async listBranchIdsForUser(userId) {
    const rows = await this.many(
      `select distinct branch_id
       from user_role_assignments
       where user_id = $1 and branch_id is not null`,
      [userId]
    );
    return rows.map((row) => row.branch_id);
  }

  async listForUser(userId) {
    return this.manyMapped(
      `select ura.id, ura.user_id, ura.role_id, ura.branch_id, ura.assigned_at,
              r.code as role_code, r.name as role_name
       from user_role_assignments ura
       join roles r on r.id = ura.role_id
       where ura.user_id = $1
       order by ura.assigned_at asc`,
      [userId]
    );
  }

  async findByUserRoleBranch(userId, roleId, branchId) {
    return this.oneMapped(
      `select * from user_role_assignments
       where user_id = $1 and role_id = $2 and branch_id is not distinct from $3`,
      [userId, roleId, branchId ?? null]
    );
  }

  async deleteById(id) {
    await this.execute('delete from user_role_assignments where id = $1', [id]);
  }

  async countActiveUsersByRoleCode(roleCode) {
    const row = await this.one(
      `select count(distinct ura.user_id)::int as count
       from user_role_assignments ura
       join roles r on r.id = ura.role_id
       join users u on u.id = ura.user_id
       where r.code = $1 and u.status = 'ACTIVE'`,
      [roleCode]
    );
    return row?.count ?? 0;
  }
}

module.exports = { PostgresRoleAssignmentRepository };
