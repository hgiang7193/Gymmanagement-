const { SqlRepository } = require('./sql-repository');

class PostgresClassAttendanceRepository extends SqlRepository {
  async create(attendance) {
    await this.execute(
      `INSERT INTO class_attendance (
        id, enrollment_id, user_id, shift_id, branch_id,
        attended_at, check_in_time, status, created_by, created_at,
        proxy_checkin, override_reason, override_actor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        attendance.id,
        attendance.enrollmentId,
        attendance.userId,
        attendance.shiftId,
        attendance.branchId,
        attendance.attendedAt,
        attendance.checkInTime,
        attendance.status,
        attendance.createdBy,
        attendance.createdAt || new Date(),
        attendance.proxyCheckin ?? false,
        attendance.overrideReason ?? null,
        attendance.overrideActor ?? null,
      ]
    );
    return attendance;
  }

  async findByUserAndShift(userId, shiftId) {
    return this.oneMapped(
      `SELECT * FROM class_attendance 
       WHERE user_id = $1 AND shift_id = $2`,
      [userId, shiftId]
    );
  }

  async findByUser(userId, limit = 50) {
    return this.manyMapped(
      `SELECT ca.*, s.shift_code, s.date, s.start_at, s.end_at
       FROM class_attendance ca
       JOIN shifts s ON ca.shift_id = s.id
       WHERE ca.user_id = $1
       ORDER BY ca.attended_at DESC
       LIMIT $2`,
      [userId, limit]
    );
  }

  async findByShift(shiftId) {
    return this.manyMapped(
      `SELECT ca.*, u.email as member_email
       FROM class_attendance ca
       JOIN users u ON ca.user_id = u.id
       WHERE ca.shift_id = $1
       ORDER BY ca.check_in_time ASC`,
      [shiftId]
    );
  }

  async findRosterByShift(shiftId) {
    return this.manyMapped(
      `SELECT ca.id, ca.user_id, ca.shift_id, ca.attended_at, ca.check_in_time,
              ca.status, ca.proxy_checkin, ca.override_reason,
              p.full_name as member_name,
              u.email as member_email,
              ce.sessions_remaining
       FROM class_attendance ca
       JOIN users u ON ca.user_id = u.id
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN course_enrollments ce ON ca.enrollment_id = ce.id
       WHERE ca.shift_id = $1
       ORDER BY ca.check_in_time ASC`,
      [shiftId]
    );
  }

  async countByBranchAndDate(branchId, date) {
    const row = await this.one(
      `SELECT COUNT(ca.id) as total
       FROM class_attendance ca
       JOIN shifts s ON ca.shift_id = s.id
       WHERE s.branch_id = $1 AND s.date = $2`,
      [branchId, date]
    );
    return parseInt(row?.total ?? 0, 10);
  }
}

module.exports = { PostgresClassAttendanceRepository };
