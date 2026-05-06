const { SqlRepository } = require('./sql-repository');

class PostgresCourseEnrollmentRepository extends SqlRepository {
  async create(enrollment) {
    await this.execute(
      `INSERT INTO course_enrollments (
        id, user_id, course_package_id, branch_id, status, 
        enrolled_at, started_at, total_sessions, 
        sessions_attended, sessions_remaining, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        enrollment.id,
        enrollment.userId,
        enrollment.coursePackageId,
        enrollment.branchId,
        enrollment.status,
        enrollment.enrolledAt,
        enrollment.startedAt,
        enrollment.totalSessions,
        enrollment.sessionsAttended,
        enrollment.sessionsRemaining,
        enrollment.createdBy,
        enrollment.createdAt || new Date(),
      ]
    );
    return enrollment;
  }

  async findById(id) {
    return this.oneMapped(
      'SELECT * FROM course_enrollments WHERE id = $1',
      [id]
    );
  }

  async findActiveByUser(userId) {
    return this.oneMapped(
      `SELECT * FROM course_enrollments 
       WHERE user_id = $1 AND status = 'ACTIVE' 
       ORDER BY enrolled_at DESC 
       LIMIT 1`,
      [userId]
    );
  }

  async findByUser(userId) {
    return this.manyMapped(
      `SELECT ce.*, cp.name as package_name, cp.total_sessions as package_total_sessions
       FROM course_enrollments ce
       JOIN course_packages cp ON ce.course_package_id = cp.id
       WHERE ce.user_id = $1
       ORDER BY ce.enrolled_at DESC`,
      [userId]
    );
  }

  async decrementSessionsRemaining(enrollmentId) {
    await this.execute(
      `UPDATE course_enrollments 
       SET sessions_remaining = sessions_remaining - 1,
           sessions_attended = sessions_attended + 1,
           updated_at = NOW()
       WHERE id = $1 AND sessions_remaining > 0`,
      [enrollmentId]
    );
  }

  async completeEnrollment(enrollmentId) {
    await this.execute(
      `UPDATE course_enrollments 
       SET status = 'COMPLETED',
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [enrollmentId]
    );
  }
}

module.exports = { PostgresCourseEnrollmentRepository };
