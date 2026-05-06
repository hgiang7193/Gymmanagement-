// UC-COACH-04: Coach hỗ trợ check-in hộ học viên khi có sự cố.
// Khác manager-override: coach chỉ được proxy check-in cho ca mà mình đang được phân công,
// trong khoảng thời gian shift đang diễn ra (không có grace period sau khi shift end — đó là quyền manager).
class CoachProxyCheckInUseCase {
  constructor({
    pool,
    courseEnrollmentRepository,
    classAttendanceRepository,
    shiftRepository,
    userRepository,
    trainerAssignmentRepository,
    clock,
    idGenerator,
  }) {
    this.pool = pool;
    this.courseEnrollmentRepository = courseEnrollmentRepository;
    this.classAttendanceRepository = classAttendanceRepository;
    this.shiftRepository = shiftRepository;
    this.userRepository = userRepository;
    this.trainerAssignmentRepository = trainerAssignmentRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute({ coachUserId, userId, shiftId, reason }) {
    if (!coachUserId || !userId || !shiftId) throw new Error('VALIDATION_ERROR');
    if (!reason || !reason.trim()) throw new Error('OVERRIDE_REASON_REQUIRED');

    const [member, shift] = await Promise.all([
      this.userRepository.findById(userId),
      this.shiftRepository.findById(shiftId),
    ]);
    if (!member) throw new Error('USER_NOT_FOUND');
    if (!shift) throw new Error('SHIFT_NOT_FOUND');

    // Coach phải đang được phân công vào shift này.
    const assignment = await this.trainerAssignmentRepository.getActiveAssignment(coachUserId, shiftId);
    if (!assignment) throw new Error('COACH_NOT_ASSIGNED_TO_SHIFT');

    // Chỉ proxy được khi shift đang diễn ra (tính cả 30' trước start để hỗ trợ check-in sớm).
    const now = this.clock.now();
    const earliest = new Date(new Date(shift.startAt).getTime() - 30 * 60_000);
    if (now < earliest) throw new Error('SHIFT_NOT_STARTED');
    if (now > new Date(shift.endAt)) throw new Error('SHIFT_ALREADY_ENDED');

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
        [attendanceId, enrollment.id, userId, shiftId, shift.branchId,
         now, now, 'PRESENT', coachUserId, now, reason.trim(), coachUserId]
      );
      await client.query(
        `INSERT INTO audit_logs
           (id, actor_user_id, action_code, entity_type, entity_id, branch_id, metadata_json, created_at)
         VALUES ($1,$2,'attendance_proxy_coach','class_attendance',$3,$4,$5,$6)`,
        [auditId, coachUserId, attendanceId, shift.branchId,
         JSON.stringify({ targetUserId: userId, shiftId, reason: reason.trim() }), now]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const updated = await this.courseEnrollmentRepository.findById(enrollment.id);
    return {
      attendanceId, userId, shiftId, branchId: shift.branchId,
      overrideReason: reason.trim(), overrideActor: coachUserId,
      proxyCheckin: true, sessionsRemaining: updated.sessionsRemaining,
    };
  }
}

module.exports = { CoachProxyCheckInUseCase };
