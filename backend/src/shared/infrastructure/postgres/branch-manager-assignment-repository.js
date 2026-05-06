const { SqlRepository } = require('./sql-repository');

class PostgresBranchManagerAssignmentRepository extends SqlRepository {
  async assign(assignment) {
    await this.execute(
      `insert into branch_manager_assignments (id, branch_id, manager_user_id, active_from, active_to, created_at)
       values ($1, $2, $3, $4, $5, $6)`,
      [assignment.id, assignment.branchId, assignment.managerUserId, assignment.activeFrom, assignment.activeTo, assignment.createdAt]
    );
    return assignment;
  }

  async listBranchIdsForManager(managerUserId) {
    const rows = await this.many(
      `select distinct branch_id
       from branch_manager_assignments
       where manager_user_id = $1 and active_to is null`,
      [managerUserId]
    );
    return rows.map((row) => row.branch_id);
  }

  async isManagerOfBranch(managerUserId, branchId) {
    const row = await this.one(
      `select branch_id
       from branch_manager_assignments
       where manager_user_id = $1 and branch_id = $2 and active_to is null`,
      [managerUserId, branchId]
    );
    return Boolean(row);
  }
}

module.exports = { PostgresBranchManagerAssignmentRepository };
