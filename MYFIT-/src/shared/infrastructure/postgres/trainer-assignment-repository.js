const { SqlRepository } = require('./sql-repository');

class PostgresTrainerAssignmentRepository extends SqlRepository {
  async createAssignment(assignment) {
    const now = new Date();
    await this.execute(
      `insert into trainer_assignments (id, trainer_user_id, shift_id, branch_id, note, assigned_by, assigned_at, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [assignment.id, assignment.trainerUserId, assignment.shiftId, assignment.branchId, assignment.note, assignment.assignedBy, now, now, now]
    );
    return { ...assignment, assignedAt: now };
  }

  async getActiveAssignment(trainerUserId, shiftId) {
    return this.oneMapped(
      'select * from trainer_assignments where trainer_user_id = $1 and shift_id = $2 and unassigned_at is null',
      [trainerUserId, shiftId]
    );
  }

  async getActiveAssignmentCount(shiftId) {
    const result = await this.one(
      'select count(*) as count from trainer_assignments where shift_id = $1 and unassigned_at is null',
      [shiftId]
    );
    return parseInt(result.count, 10);
  }

  async getActiveAssignmentsByShiftIds(shiftIds) {
    if (!shiftIds || shiftIds.length === 0) {
      return [];
    }
    const placeholders = shiftIds.map((_, idx) => `$${idx + 1}`).join(', ');
    return this.manyMapped(
      `select * from trainer_assignments where shift_id in (${placeholders}) and unassigned_at is null`,
      shiftIds
    );
  }

  async unassignCoach(assignmentId, unassignedBy) {
    const now = new Date();
    await this.execute(
      'update trainer_assignments set unassigned_at = $1, updated_at = $1 where id = $2',
      [now, assignmentId]
    );
  }

  async isCoachAllowedForBranch(coachId, branchId) {
    // Check if coach has any active assignment in this branch
    // This can be extended with explicit branch permissions later
    const result = await this.one(
      `select exists(
        select 1 from trainer_assignments ta
        join shifts s on ta.shift_id = s.id
        where ta.trainer_user_id = $1
        and ta.branch_id = $2
        and ta.unassigned_at is null
      ) as allowed`,
      [coachId, branchId]
    );

    // For MVP, allow all coaches to access any branch they're registered for
    // Return true if coach has at least one assignment anywhere
    // In production, you'd have a separate coach_branch_permissions table
    const hasAnyAssignment = await this.one(
      'select exists(select 1 from trainer_assignments where trainer_user_id = $1) as has_assignment',
      [coachId]
    );

    // If no assignments yet, allow (first time assignment)
    // Otherwise check if branch matches
    return !hasAnyAssignment.has_assignment || result.allowed;
  }

  async getAssignmentsByCoach(coachId, limit = 100) {
    return this.manyMapped(
      `select ta.*, s.shift_code, s.date, s.start_at, s.end_at, b.name as branch_name
       from trainer_assignments ta
       join shifts s on ta.shift_id = s.id
       join branches b on ta.branch_id = b.id
       where ta.trainer_user_id = $1 and ta.unassigned_at is null
       order by s.date desc, s.start_at desc
       limit $2`,
      [coachId, limit]
    );
  }
}

module.exports = { PostgresTrainerAssignmentRepository };
