class ViewCoachShiftsUseCase {
  constructor({ shiftRepository, trainerAssignmentRepository, userRepository, branchRepository, roleAssignmentRepository, clock }) {
    this.shiftRepository = shiftRepository;
    this.trainerAssignmentRepository = trainerAssignmentRepository;
    this.userRepository = userRepository;
    this.branchRepository = branchRepository;
    this.roleAssignmentRepository = roleAssignmentRepository;
    this.clock = clock;
  }

  /**
   * Get all shifts for a branch on a specific date with coach assignment info
   * @param {Object} params
   * @param {string} params.coachId - Coach user ID
   * @param {string} params.branchId - Branch UUID
   * @param {string} params.date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Shifts data with assignment status
   */
  async execute({ coachId, branchId, date }) {
    if (!coachId || !branchId || !date) {
      throw new Error('VALIDATION_ERROR: coachId, branchId and date are required');
    }

    // Validate coach exists and has COACH role
    const coach = await this.userRepository.findById(coachId);
    if (!coach) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    const coachRole = await this.roleAssignmentRepository.findPrimaryRoleForUser(coachId);
    if (coachRole !== 'COACH') {
      throw new Error('FORBIDDEN');
    }

    // Validate branch exists
    const branch = await this.branchRepository.findById(branchId);
    if (!branch) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Check if coach is allowed to access this branch
    const isCoachAllowed = await this.trainerAssignmentRepository.isCoachAllowedForBranch(coachId, branchId);
    if (!isCoachAllowed) {
      throw new Error('COACH_NOT_ALLOWED_FOR_BRANCH');
    }

    // Generate shifts if they don't exist for this date
    const { GenerateDailyShiftsUseCase } = require('./generate-daily-shifts');
    const generator = new GenerateDailyShiftsUseCase({
      shiftRepository: this.shiftRepository,
      clock: this.clock,
    });
    await generator.execute({ branchId, date });

    // Get all shifts for the date
    const shifts = await this.shiftRepository.findByBranchAndDate(branchId, date);

    // Get active assignments for these shifts
    const shiftIds = shifts.map(s => s.id);
    const assignments = await this.trainerAssignmentRepository.getActiveAssignmentsByShiftIds(shiftIds);

    // Build assignment map
    const assignmentMap = {};
    const coachCountMap = {};
    assignments.forEach(assignment => {
      if (!assignmentMap[assignment.shiftId]) {
        assignmentMap[assignment.shiftId] = [];
      }
      assignmentMap[assignment.shiftId].push(assignment.trainerUserId);
      coachCountMap[assignment.shiftId] = (coachCountMap[assignment.shiftId] || 0) + 1;
    });

    const now = this.clock.now();

    // Enrich shifts with assignment info
    const enrichedShifts = shifts.map(shift => {
      const assignedCoaches = assignmentMap[shift.id] || [];
      const coachCount = coachCountMap[shift.id] || 0;
      const isAssigned = assignedCoaches.includes(coachId);
      const isFull = coachCount >= shift.coachCapacity;
      const isLocked = now >= shift.startAt;

      return {
        shiftId: shift.id,
        shiftCode: shift.shiftCode,
        startAt: shift.startAt,
        endAt: shift.endAt,
        coachCapacity: shift.coachCapacity,
        coachCount,
        isFull,
        isLocked,
        isAssigned,
      };
    });

    return {
      branchId,
      date,
      timezone: 'Asia/Ho_Chi_Minh',
      shifts: enrichedShifts,
    };
  }
}

module.exports = { ViewCoachShiftsUseCase };
