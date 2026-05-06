// UC-MGR-02 / UC-COACH-02: View roster for a shift
class ListShiftRosterUseCase {
  constructor({ classAttendanceRepository, shiftRepository }) {
    this.classAttendanceRepository = classAttendanceRepository;
    this.shiftRepository = shiftRepository;
  }

  async execute({ shiftId }) {
    if (!shiftId) throw new Error('VALIDATION_ERROR');
    const shift = await this.shiftRepository.findById(shiftId);
    if (!shift) throw new Error('SHIFT_NOT_FOUND');
    const roster = await this.classAttendanceRepository.findRosterByShift(shiftId);
    return {
      shift: {
        id: shift.id,
        shiftCode: shift.shiftCode,
        date: shift.date,
        startAt: shift.startAt,
        endAt: shift.endAt,
        branchId: shift.branchId,
      },
      totalCheckins: roster.length,
      members: roster,
    };
  }
}

module.exports = { ListShiftRosterUseCase };
