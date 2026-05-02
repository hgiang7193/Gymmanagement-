// UC-MGR-04: Manager override check-in when member can't self-check-in
const OVERRIDE_GRACE_PERIOD_MINUTES = 60;

class OverrideCheckInUseCase {
  constructor({
    pool,
    courseEnrollmentRepository,
    classAttendanceRepository,
    shiftRepository,
    userRepository,
    auditLogRepository,
    clock,
    idGenerator,
  }) {
    this.pool = pool;
    this.courseEnrollmentRepository = courseEnrollmentRepository;
    this.classAttendanceRepository = classAttendanceRepository;
    this.shiftRepository = shiftRepository;
    this.userRepository = userRepository;
    this.auditLogRepository = auditLogRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute({ managerUserId, userId, shiftId, branchId, reason }) {
    if (!managerUserId || !userId || !shiftId || !branchId) throw new Error('VALIDATION_ERROR');
    if (!reason || !reason.trim()) throw new Error('OVERRIDE_REASON_REQUIRED');

    const [member, shift] = await Promise.all([
      this.userRepository.findById(userId),
      this.shiftRepository.findById(shiftId),
    ]);
    if (!member) throw new Error('USER_NOT_FOUND');
    if (!shift)  throw new Error('SHIFT_NOT_FOUND');

    // Allow override within grace period after shift end
    const now = this.clock.now();
    const graceCutoff = new Date(new Date(shift.endAt).getTime() + OVERRIDE_GRACE_PERIOD_MINUTES * 60_000);
    if (now > graceCutoff) throw new Error('SHIFT_GRACE_PERIOD_EXPIRED');

    const existing = await this.classAttendanceRepository.findByUserAndShift(userId, shiftId);
    if (existing) throw new Error('DUPLICATE_CHECKIN');

    const enrollment = await this.courseEnrollmentRepository.findActiveByUser(userId);
    if (!enrollment) throw new Error('NO_ACTIVE_ENROLLMENT');
    if (enrollment.sessionsRemaining <= 0) throw new Error('NO_SESSIONS_REMAINING');

    const attendanceId = this.idGenerator.generate();
    const auditId = this.idGenerator.generate();

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO class_attendance
           (id, enrollment_id, user_id, shift_id, branch_id,
            attended_at, check_in_time, status, created_by, created_at,
            proxy_checkin, override_reason, override_actor)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11,$12)`,
        [
          attendanceId, enrollment.id, userId, shiftId, branchId,
          now, now, 'PRESENT', managerUserId, now,
          reason.trim(), managerUserId,
        ]
      );

      await client.query(
        `INSERT INTO audit_logs
           (id, actor_user_id, action_code, entity_type, entity_id, branch_id, metadata_json, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          auditId, managerUserId, 'attendance_override', 'class_attendance', attendanceId,
          branchId,
          JSON.stringify({ targetUserId: userId, shiftId, reason: reason.trim() }),
          now,
        ]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.message?.includes('DUPLICATE_CHECKIN')) throw new Error('DUPLICATE_CHECKIN');
      if (err.message?.includes('ENROLLMENT_NOT_ACTIVE')) throw new Error('NO_ACTIVE_ENROLLMENT');
      throw err;
    } finally {
      client.release();
    }

    const updated = await this.courseEnrollmentRepository.findById(enrollment.id);
    return {
      attendanceId,
      userId,
      shiftId,
      branchId,
      overrideReason: reason.trim(),
      overrideActor: managerUserId,
      proxyCheckin: true,
      sessionsRemaining: updated.sessionsRemaining,
    };
  }
}

module.exports = { OverrideCheckInUseCase };
