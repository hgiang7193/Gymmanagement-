class SubmitReviewUseCase {
  constructor({ reviewRepository, classAttendanceRepository, pool }) {
    this.reviewRepository = reviewRepository;
    this.classAttendanceRepository = classAttendanceRepository;
    this.pool = pool;
  }

  async execute({ userId, targetType, targetId, rating, comment, tags, branchId, attendanceId }) {
    if (!['shift', 'coach', 'equipment', 'exercise'].includes(targetType)) {
      throw new Error('INVALID_REVIEW_TARGET_TYPE');
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('INVALID_REVIEW_RATING');
    }

    // For shift reviews: member must have attended the shift
    if (targetType === 'shift') {
      const hasAttended = await this.classAttendanceRepository.one(
        'SELECT id FROM class_attendance WHERE shift_id = $1 AND user_id = $2 LIMIT 1',
        [targetId, userId]
      );
      if (!hasAttended) throw new Error('REVIEW_REQUIRES_ATTENDANCE');
    }

    // Daily rate limit from system_config (default 5)
    const configRow = await this.pool.query(
      `SELECT value FROM system_config WHERE key = 'review_max_per_day'`
    );
    const maxPerDay = parseInt(configRow.rows[0]?.value ?? '5', 10);
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = await this.reviewRepository.countByReviewerTargetTypeAndDate(userId, targetType, today);
    if (todayCount >= maxPerDay) {
      throw new Error('REVIEW_RATE_LIMIT_EXCEEDED');
    }

    // One review per shift (unique constraint enforced at DB level too)
    if (targetType === 'shift') {
      const alreadyReviewed = await this.reviewRepository.hasReviewedTarget(userId, 'shift', targetId);
      if (alreadyReviewed) throw new Error('REVIEW_ALREADY_SUBMITTED');
    }

    return this.reviewRepository.create({
      reviewerId: userId,
      targetType,
      targetId,
      rating,
      comment,
      tags,
      branchId,
      attendanceId,
    });
  }
}

class ListReviewsUseCase {
  constructor({ reviewRepository }) {
    this.reviewRepository = reviewRepository;
  }

  async execute({ targetType, targetId, branchId, status, forManager = false }) {
    if (targetType && targetId) {
      return this.reviewRepository.findByTarget(targetType, targetId, {
        status: forManager ? status : 'visible',
      });
    }
    if (branchId) {
      return this.reviewRepository.findByBranchAndStatus(branchId, forManager ? status : 'visible');
    }
    return [];
  }
}

class ModerateReviewUseCase {
  constructor({ reviewRepository }) {
    this.reviewRepository = reviewRepository;
  }

  async execute({ reviewId, status, reason, actorUserId }) {
    if (!['visible', 'flagged', 'hidden'].includes(status)) {
      throw new Error('INVALID_REVIEW_STATUS');
    }
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) throw new Error('REVIEW_NOT_FOUND');

    await this.reviewRepository.setStatus(reviewId, status);
    await this.reviewRepository.createModerationLog({
      reviewId,
      actorId: actorUserId,
      fromStatus: review.status,
      toStatus: status,
      reason: reason ?? '',
    });
    return { reviewId, status };
  }
}

module.exports = { SubmitReviewUseCase, ListReviewsUseCase, ModerateReviewUseCase };
