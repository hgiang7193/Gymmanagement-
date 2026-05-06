const CHECK_IN_WINDOW_MINUTES = 30; // BR-SHIFT-01: open 30 min before shift start

class CheckInMemberToClassUseCase {
  constructor({
    courseEnrollmentRepository,
    classAttendanceRepository,
    shiftRepository,
    userRepository,
    branchRepository,
    clock,
    idGenerator
  }) {
    this.courseEnrollmentRepository = courseEnrollmentRepository;
    this.classAttendanceRepository = classAttendanceRepository;
    this.shiftRepository = shiftRepository;
    this.userRepository = userRepository;
    this.branchRepository = branchRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  /**
   * Check-in member to a class session (manager/staff action).
   * @param {Object} params
   * @param {string} params.userId        - Member user ID
   * @param {string} params.shiftId       - Shift UUID
   * @param {string} params.branchId      - Branch UUID
   * @param {string} params.actorUserId   - Staff who checked in the member
   * @param {boolean} [params.proxyCheckin=false]
   * @param {string}  [params.overrideReason]  - Required when proxyCheckin=true
   */
  async execute({ userId, shiftId, branchId, actorUserId, proxyCheckin = false, overrideReason }) {
    if (!userId || !shiftId || !branchId || !actorUserId) {
      throw new Error('VALIDATION_ERROR');
    }

    const [member, shift, branch] = await Promise.all([
      this.userRepository.findById(userId),
      this.shiftRepository.findById(shiftId),
      this.branchRepository.findById(branchId),
    ]);

    if (!member) throw new Error('USER_NOT_FOUND');
    if (!shift)  throw new Error('SHIFT_NOT_FOUND');
    if (!branch) throw new Error('BRANCH_NOT_FOUND');

    // BR-SHIFT-01: validate check-in window
    const now = this.clock.now();
    const windowOpenAt = new Date(new Date(shift.startAt).getTime() - CHECK_IN_WINDOW_MINUTES * 60_000);
    if (now < windowOpenAt) throw new Error('SHIFT_NOT_STARTED');
    if (now > new Date(shift.endAt)) throw new Error('SHIFT_ALREADY_ENDED');

    if (proxyCheckin && !overrideReason) throw new Error('OVERRIDE_REASON_REQUIRED');

    const enrollment = await this.courseEnrollmentRepository.findActiveByUser(userId);
    if (!enrollment) throw new Error('NO_ACTIVE_ENROLLMENT');
    if (enrollment.sessionsRemaining <= 0) throw new Error('NO_SESSIONS_REMAINING');

    const existingAttendance = await this.classAttendanceRepository.findByUserAndShift(userId, shiftId);
    if (existingAttendance) throw new Error('DUPLICATE_CHECKIN');

    const attendanceId = this.idGenerator.generate();
    const attendance = {
      id: attendanceId,
      enrollmentId: enrollment.id,
      userId,
      shiftId,
      branchId,
      attendedAt: now,
      checkInTime: now,
      status: 'PRESENT',
      createdBy: actorUserId,
      proxyCheckin,
      overrideReason: proxyCheckin ? overrideReason : null,
      overrideActor: proxyCheckin ? actorUserId : null,
    };

    // DB trigger (004 migration) auto-decrements sessions_remaining on INSERT
    await this.classAttendanceRepository.create(attendance);

    const updatedEnrollment = await this.courseEnrollmentRepository.findById(enrollment.id);
    return {
      attendanceId,
      userId,
      shiftId,
      enrollmentId: enrollment.id,
      checkInTime: now,
      status: 'PRESENT',
      proxyCheckin,
      sessionsRemaining: updatedEnrollment.sessionsRemaining,
      sessionsAttended: updatedEnrollment.sessionsAttended,
      totalSessions: updatedEnrollment.totalSessions,
    };
  }
}

module.exports = { CheckInMemberToClassUseCase };
