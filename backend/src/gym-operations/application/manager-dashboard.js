// UC-MGR-01: Manager daily operations dashboard
function toDateInHoChiMinh(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

class ManagerDashboardUseCase {
  constructor({ shiftRepository, classAttendanceRepository, invoiceRepository, trialBookingRepository, branchManagerAssignmentRepository, clock }) {
    this.shiftRepository = shiftRepository;
    this.classAttendanceRepository = classAttendanceRepository;
    this.invoiceRepository = invoiceRepository;
    this.trialBookingRepository = trialBookingRepository;
    this.branchManagerAssignmentRepository = branchManagerAssignmentRepository;
    this.clock = clock;
  }

  async execute({ managerUserId, branchId, date }) {
    if (!managerUserId || !branchId) throw new Error('VALIDATION_ERROR');

    const now = this.clock.now();
    const targetDate = date || toDateInHoChiMinh(now);

    const [shifts, totalCheckins, trialBookings, invoices] = await Promise.all([
      this.shiftRepository.findByBranchAndDate(branchId, targetDate),
      this.classAttendanceRepository.countByBranchAndDate(branchId, targetDate),
      this.trialBookingRepository.findByBranchAndDate(branchId, targetDate),
      this.invoiceRepository.findByBranchAndDate(branchId, targetDate),
    ]);

    const shiftSummaries = await Promise.all(
      shifts.map(async shift => {
        const roster = await this.classAttendanceRepository.findByShift(shift.id);
        return {
          shiftId: shift.id,
          shiftCode: shift.shiftCode,
          startAt: shift.startAt,
          endAt: shift.endAt,
          checkinCount: roster.length,
        };
      })
    );

    const paidInvoices = (invoices || []).filter(i => i.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);

    return {
      date: targetDate,
      branchId,
      totalCheckins,
      totalShifts: shifts.length,
      totalTrialBookings: (trialBookings || []).length,
      totalPaidInvoices: paidInvoices.length,
      totalRevenue,
      shiftBreakdown: shiftSummaries,
    };
  }
}

module.exports = { ManagerDashboardUseCase };
