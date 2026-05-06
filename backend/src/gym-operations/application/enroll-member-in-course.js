class EnrollMemberInCourseUseCase {
  constructor({ 
    coursePackageRepository,
    courseEnrollmentRepository,
    userRepository,
    branchRepository,
    clock,
    idGenerator 
  }) {
    this.coursePackageRepository = coursePackageRepository;
    this.courseEnrollmentRepository = courseEnrollmentRepository;
    this.userRepository = userRepository;
    this.branchRepository = branchRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  /**
   * Enroll a member in a course package (30/60/120 sessions)
   * @param {Object} params
   * @param {string} params.userId - Member user ID
   * @param {string} params.coursePackageId - Course package UUID
   * @param {string} params.branchId - Branch UUID
   * @param {string} params.actorUserId - Manager/staff who enrolled the member
   * @returns {Promise<Object>} Enrollment record
   */
  async execute({ userId, coursePackageId, branchId, actorUserId }) {
    // Validate inputs
    if (!userId || !coursePackageId || !branchId || !actorUserId) {
      throw new Error('VALIDATION_ERROR: userId, coursePackageId, branchId, and actorUserId are required');
    }

    // Validate member exists
    const member = await this.userRepository.findById(userId);
    if (!member) {
      throw new Error('USER_NOT_FOUND');
    }

    // Validate course package exists and is active
    const coursePackage = await this.coursePackageRepository.findById(coursePackageId);
    if (!coursePackage) {
      throw new Error('COURSE_PACKAGE_NOT_FOUND');
    }
    if (!coursePackage.isActive) {
      throw new Error('COURSE_PACKAGE_INACTIVE');
    }

    // Validate branch exists
    const branch = await this.branchRepository.findById(branchId);
    if (!branch) {
      throw new Error('BRANCH_NOT_FOUND');
    }

    // Check if member already has an active enrollment
    const existingEnrollment = await this.courseEnrollmentRepository.findActiveByUser(userId);
    if (existingEnrollment) {
      throw new Error('ACTIVE_ENROLLMENT_EXISTS');
    }

    // Create enrollment
    const now = this.clock.now();
    const enrollmentId = this.idGenerator.generate();
    
    const enrollment = {
      id: enrollmentId,
      userId,
      coursePackageId,
      branchId,
      status: 'ACTIVE',
      enrolledAt: now,
      startedAt: now,
      totalSessions: coursePackage.totalSessions,
      sessionsAttended: 0,
      sessionsRemaining: coursePackage.totalSessions,
      createdBy: actorUserId,
    };

    await this.courseEnrollmentRepository.create(enrollment);

    return {
      enrollmentId,
      userId,
      coursePackageId,
      branchId,
      status: 'ACTIVE',
      totalSessions: coursePackage.totalSessions,
      sessionsAttended: 0,
      sessionsRemaining: coursePackage.totalSessions,
      enrolledAt: now,
      totalPrice: coursePackage.totalPrice,
      pricePerSession: coursePackage.pricePerSession,
    };
  }
}

module.exports = { EnrollMemberInCourseUseCase };
