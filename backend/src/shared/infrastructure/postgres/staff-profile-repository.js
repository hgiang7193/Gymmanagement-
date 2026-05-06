const { SqlRepository } = require('./sql-repository');

class PostgresStaffProfileRepository extends SqlRepository {
  async create(staff) {
    await this.execute(
      `insert into staff_profiles (id, user_id, employee_code, job_title, primary_branch_id, hire_date, status, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [staff.id, staff.userId, staff.employeeCode, staff.jobTitle, staff.primaryBranchId, staff.hireDate, staff.status, staff.createdAt, staff.updatedAt]
    );
    return staff;
  }

  async findByUserId(userId) {
    return this.oneMapped('select * from staff_profiles where user_id = $1', [userId]);
  }

  async findByEmployeeCode(code) {
    return this.oneMapped('select * from staff_profiles where employee_code = $1', [code]);
  }

  async update(staff) {
    await this.execute(
      `update staff_profiles
       set job_title = $1, primary_branch_id = $2, status = $3, updated_at = $4
       where id = $5`,
      [staff.jobTitle, staff.primaryBranchId, staff.status, staff.updatedAt, staff.id]
    );
  }
}

module.exports = { PostgresStaffProfileRepository };
