// UC-MGR-01: Manager daily operations dashboard
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
    const targetDate = date || now.toISOString().slice(0, 10);

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
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

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
