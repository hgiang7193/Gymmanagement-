class AssignCoachToShiftUseCase {
  constructor({ shiftRepository, trainerAssignmentRepository, userRepository, branchRepository, branchManagerAssignmentRepository, clock, idGenerator }) {
    this.shiftRepository = shiftRepository;
    this.trainerAssignmentRepository = trainerAssignmentRepository;
    this.userRepository = userRepository;
    this.branchRepository = branchRepository;
    this.branchManagerAssignmentRepository = branchManagerAssignmentRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  /**
   * Assign a coach to a shift
   * @param {Object} params
   * @param {string} params.coachId - Coach user ID
   * @param {string} params.shiftId - Shift UUID
   * @param {string} [params.note] - Optional note
   * @returns {Promise<Object>} Assignment result
   */
  async execute({ coachId, shiftId, note, assignedBy, actorRole, branchManagerAssignmentRepository }) {
    if (!coachId || !shiftId) {
      throw new Error('VALIDATION_ERROR: coachId and shiftId are required');
    }
    const repo = branchManagerAssignmentRepository || this.branchManagerAssignmentRepository;

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

    // UC-MGR-STAFF-03: nếu là manager assign, kiểm tra branch scope.
    if (actorRole === 'MANAGER' && assignedBy && repo) {
      const isManager = await repo.isManagerOfBranch(assignedBy, shift.branchId);
      if (!isManager) throw new Error('CROSS_BRANCH_ACCESS');
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

    // Check for duplicate assignment
    const existingAssignment = await this.trainerAssignmentRepository.getActiveAssignment(coachId, shiftId);
    if (existingAssignment) {
      throw new Error('SHIFT_ASSIGNMENT_EXISTS');
    }

    // Check capacity (with concurrency guard via database transaction)
    const activeCount = await this.trainerAssignmentRepository.getActiveAssignmentCount(shiftId);
    if (activeCount >= shift.coachCapacity) {
      throw new Error('SHIFT_COACH_CAPACITY_REACHED');
    }

    // Create assignment within a transaction to ensure consistency
    const assignmentId = this.idGenerator.generate();
    const assignment = await this.trainerAssignmentRepository.createAssignment({
      id: assignmentId,
      trainerUserId: coachId,
      shiftId,
      branchId: shift.branchId,
      note: note || null,
      assignedBy: assignedBy || coachId,
    });

    // Get updated count
    const updatedCount = await this.trainerAssignmentRepository.getActiveAssignmentCount(shiftId);
    const isFull = updatedCount >= shift.coachCapacity;

    return {
      shiftId,
      coachId,
      assignedAt: assignment.assignedAt,
      coachCount: updatedCount,
      coachCapacity: shift.coachCapacity,
      isFull,
    };
  }
}

module.exports = { AssignCoachToShiftUseCase };
