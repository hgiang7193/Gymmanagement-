// UC-MEMBER-02: List shifts available for member check-in today
const CHECK_IN_WINDOW_MINUTES = 30;

class GetAvailableShiftsUseCase {
  constructor({ shiftRepository, classAttendanceRepository, clock }) {
    this.shiftRepository = shiftRepository;
    this.classAttendanceRepository = classAttendanceRepository;
    this.clock = clock;
  }

  async execute({ branchId, userId }) {
    if (!branchId) throw new Error('VALIDATION_ERROR');
    const now = this.clock.now();
    const shifts = await this.shiftRepository.findAvailableForCheckin(branchId, now, CHECK_IN_WINDOW_MINUTES);

    // For each shift mark whether this user already checked in
    const checkedInShiftIds = new Set();
    if (userId) {
      const todayStr = now.toISOString().slice(0, 10);
      const todayAttendance = await this.classAttendanceRepository.manyMapped(
        `SELECT ca.shift_id FROM class_attendance ca
         JOIN shifts s ON ca.shift_id = s.id
         WHERE ca.user_id = $1 AND s.date = $2`,
        [userId, todayStr]
      );
      todayAttendance.forEach(a => checkedInShiftIds.add(a.shiftId));
    }

    return shifts.map(s => ({
      id: s.id,
      branchId: s.branchId,
      shiftCode: s.shiftCode,
      date: s.date,
      startAt: s.startAt,
      endAt: s.endAt,
      totalCheckins: parseInt(s.totalCheckins ?? 0, 10),
      alreadyCheckedIn: checkedInShiftIds.has(s.id),
    }));
  }
}

module.exports = { GetAvailableShiftsUseCase };
