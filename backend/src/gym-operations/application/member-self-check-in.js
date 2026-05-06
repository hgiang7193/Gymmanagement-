// UC-MEMBER-03: Member self-check-in + biometric — must be atomic (BR-CHECKIN-03)
const CHECK_IN_WINDOW_MINUTES = 30; // BR-SHIFT-01

class MemberSelfCheckInUseCase {
  constructor({
    pool,
    courseEnrollmentRepository,
    classAttendanceRepository,
    shiftRepository,
    weightLogRepository,
    clock,
    idGenerator,
  }) {
    this.pool = pool;
    this.courseEnrollmentRepository = courseEnrollmentRepository;
    this.classAttendanceRepository = classAttendanceRepository;
    this.shiftRepository = shiftRepository;
    this.weightLogRepository = weightLogRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  /**
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.shiftId
   * @param {string} params.branchId
   * @param {number} params.weightKg          - Required (BR-CHECKIN-03)
   * @param {string} [params.measurementSource='manual']
   */
  async execute({ userId, shiftId, branchId, weightKg, measurementSource = 'manual' }) {
    if (!userId || !shiftId || !branchId) throw new Error('VALIDATION_ERROR');
    if (!weightKg || isNaN(Number(weightKg)) || Number(weightKg) <= 0) {
      throw new Error('WEIGHT_REQUIRED'); // BR-CHECKIN-03
    }

    const shift = await this.shiftRepository.findById(shiftId);
    if (!shift) throw new Error('SHIFT_NOT_FOUND');

    // BR-SHIFT-01: check-in window validation
    const now = this.clock.now();
    const windowOpenAt = new Date(new Date(shift.startAt).getTime() - CHECK_IN_WINDOW_MINUTES * 60_000);
    if (now < windowOpenAt) throw new Error('SHIFT_NOT_STARTED');
    if (now > new Date(shift.endAt)) throw new Error('SHIFT_ALREADY_ENDED');

    // Validate enrollment
    const enrollment = await this.courseEnrollmentRepository.findActiveByUser(userId);
    if (!enrollment) throw new Error('NO_ACTIVE_ENROLLMENT');
    if (enrollment.sessionsRemaining <= 0) throw new Error('NO_SESSIONS_REMAINING');

    // Duplicate check before transaction
    const existing = await this.classAttendanceRepository.findByUserAndShift(userId, shiftId);
    if (existing) throw new Error('DUPLICATE_CHECKIN');

    const attendanceId = this.idGenerator.generate();
    const weightLogId  = this.idGenerator.generate();
    const kg = Number(weightKg);

    // Atomic transaction: insert weight log + insert attendance
    // DB trigger (migration 004) auto-decrements sessions_remaining on attendance INSERT
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO member_weight_logs
           (id, user_id, weight_kg, measured_at, measurement_source, created_by, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [weightLogId, userId, kg, now, measurementSource, userId, now]
      );

      await client.query(
        `INSERT INTO class_attendance
           (id, enrollment_id, user_id, shift_id, branch_id,
            attended_at, check_in_time, status, created_by, created_at,
            proxy_checkin, override_reason, override_actor)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,null,null)`,
        [
          attendanceId,
          enrollment.id,
          userId,
          shiftId,
          branchId,
          now, now,
          'PRESENT',
          userId,
          now,
        ]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.message && err.message.includes('DUPLICATE_CHECKIN')) throw new Error('DUPLICATE_CHECKIN');
      if (err.message && err.message.includes('ENROLLMENT_NOT_ACTIVE')) throw new Error('NO_ACTIVE_ENROLLMENT');
      throw err;
    } finally {
      client.release();
    }

    const updated = await this.courseEnrollmentRepository.findById(enrollment.id);
    return {
      attendanceId,
      weightLogId,
      userId,
      shiftId,
      branchId,
      enrollmentId: enrollment.id,
      checkInTime: now,
      weightKg: kg,
      measurementSource,
      sessionsRemaining: updated.sessionsRemaining,
      sessionsAttended:  updated.sessionsAttended,
      totalSessions:     updated.totalSessions,
    };
  }
}

module.exports = { MemberSelfCheckInUseCase };
