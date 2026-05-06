class UnassignCoachFromShiftUseCase {
  constructor({ shiftRepository, trainerAssignmentRepository, userRepository, clock }) {
    this.shiftRepository = shiftRepository;
    this.trainerAssignmentRepository = trainerAssignmentRepository;
    this.userRepository = userRepository;
    this.clock = clock;
  }

  /**
   * Unassign a coach from a shift
   * @param {Object} params
   * @param {string} params.coachId - Coach user ID
   * @param {string} params.shiftId - Shift UUID
   * @returns {Promise<Object>} Unassignment result
   */
  async execute({ coachId, shiftId }) {
    if (!coachId || !shiftId) {
      throw new Error('VALIDATION_ERROR: coachId and shiftId are required');
    }

    // Validate coach exists and has COACH role
    const coach = await this.userRepository.findById(coachId);
    if (!coach) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    const coachRole = await this.userRepository.getUserRole(coachId);
    if (coachRole?.code !== 'COACH') {
      throw new Error('FORBIDDEN');
    }

    // Get shift
    const shift = await this.shiftRepository.findById(shiftId);
    if (!shift) {
      throw new Error('SHIFT_NOT_FOUND');
    }

    // Check if coach is allowed in this branch
    const isCoachAllowed = await this.trainerAssignmentRepository.isCoachAllowedForBranch(coachId, shift.branchId);
    if (!isCoachAllowed) {
      throw new Error('COACH_NOT_ALLOWED_FOR_BRANCH');
    }

    // Check if shift has already ended (cannot modify after shift ends)
    const now = this.clock.now();
    if (now >= shift.endAt) {
      throw new Error('SHIFT_ALREADY_ENDED');
    }

    // Check if coach is assigned to this shift
    const existingAssignment = await this.trainerAssignmentRepository.getActiveAssignment(coachId, shiftId);
    if (!existingAssignment) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Check minimum requirement: at least 1 coach must remain
    const activeCount = await this.trainerAssignmentRepository.getActiveAssignmentCount(shiftId);
    if (activeCount <= 1) {
      throw new Error('SHIFT_REQUIRES_AT_LEAST_ONE_COACH');
    }

    // Unassign the coach
    await this.trainerAssignmentRepository.unassignCoach(existingAssignment.id, coachId);

    // Get updated count
    const updatedCount = await this.trainerAssignmentRepository.getActiveAssignmentCount(shiftId);
    const isFull = updatedCount >= shift.coachCapacity;

    return {
      shiftId,
      coachId,
      unassignedAt: now,
      coachCount: updatedCount,
      coachCapacity: shift.coachCapacity,
      isFull,
    };
  }
}

module.exports = { UnassignCoachFromShiftUseCase };
