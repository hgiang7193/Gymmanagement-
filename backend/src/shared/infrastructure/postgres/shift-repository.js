const { SqlRepository } = require('./sql-repository');

class PostgresShiftRepository extends SqlRepository {
  async upsert(shift) {
    await this.execute(
      `insert into shifts (id, branch_id, shift_code, date, start_at, end_at, coach_capacity, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (branch_id, date, shift_code) do update
       set coach_capacity = excluded.coach_capacity,
           updated_at = excluded.updated_at`,
      [shift.id, shift.branchId, shift.shiftCode, shift.date, shift.startAt, shift.endAt, shift.coachCapacity, shift.createdAt, shift.updatedAt]
    );
    return shift;
  }

  async findById(id) {
    return this.oneMapped('select * from shifts where id = $1', [id]);
  }

  async findByBranchAndDate(branchId, date) {
    return this.manyMapped(
      'select * from shifts where branch_id = $1 and date = $2 order by start_at asc',
      [branchId, date]
    );
  }

  async findByDateRange(branchId, startDate, endDate) {
    return this.manyMapped(
      'select * from shifts where branch_id = $1 and date >= $2 and date <= $3 order by date asc, start_at asc',
      [branchId, startDate, endDate]
    );
  }

  // BR-SHIFT-01: shifts where (start_at - windowMinutes) <= now <= end_at
  async findAvailableForCheckin(branchId, now, windowMinutes = 30) {
    return this.manyMapped(
      `SELECT s.*,
              COUNT(ca.id) as total_checkins
       FROM shifts s
       LEFT JOIN class_attendance ca ON ca.shift_id = s.id
       WHERE s.branch_id = $1
         AND (s.start_at - ($3 || ' minutes')::interval) <= $2
         AND s.end_at >= $2
       GROUP BY s.id
       ORDER BY s.start_at ASC`,
      [branchId, now, String(windowMinutes)]
    );
  }

  async findByBranchAndDateRange(branchId, startDate, endDate) {
    return this.manyMapped(
      `SELECT s.*,
              COUNT(DISTINCT ca.id) as total_checkins,
              COUNT(DISTINCT ta.id) as assigned_coaches
       FROM shifts s
       LEFT JOIN class_attendance ca ON ca.shift_id = s.id
       LEFT JOIN trainer_assignments ta ON ta.shift_id = s.id
       WHERE s.branch_id = $1 AND s.date >= $2 AND s.date <= $3
       GROUP BY s.id
       ORDER BY s.date ASC, s.start_at ASC`,
      [branchId, startDate, endDate]
    );
  }
}

module.exports = { PostgresShiftRepository };
