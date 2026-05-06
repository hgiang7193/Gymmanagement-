const { SqlRepository } = require('./sql-repository');
const { generateId } = require('../id-generator');
const { now } = require('../clock');

class PostgresReviewRepository extends SqlRepository {
  async create({ reviewerId, targetType, targetId, rating, comment, tags, branchId, attendanceId }) {
    const id = generateId();
    const createdAt = now();
    await this.execute(
      `INSERT INTO reviews (id, reviewer_id, target_type, target_id, rating, comment, tags, status, branch_id, attendance_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'visible',$8,$9,$10,$10)`,
      [id, reviewerId, targetType, targetId, rating, comment ?? null, JSON.stringify(tags ?? []), branchId ?? null, attendanceId ?? null, createdAt]
    );
    return { id, reviewerId, targetType, targetId, rating, comment, tags: tags ?? [], status: 'visible', branchId, attendanceId, createdAt };
  }

  async findByTarget(targetType, targetId, { status, limit = 50 } = {}) {
    const params = [targetType, targetId];
    let where = 'target_type = $1 AND target_id = $2';
    if (status) {
      params.push(status);
      where += ` AND status = $${params.length}`;
    }
    params.push(limit);
    return this.manyMapped(
      `SELECT r.*, p.full_name AS reviewer_name
       FROM reviews r
       LEFT JOIN profiles p ON p.user_id = r.reviewer_id
       WHERE ${where}
       ORDER BY r.created_at DESC
       LIMIT $${params.length}`,
      params
    );
  }

  async findByReviewer(reviewerId, { limit = 50 } = {}) {
    return this.manyMapped(
      `SELECT * FROM reviews WHERE reviewer_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [reviewerId, limit]
    );
  }

  async findById(id) {
    return this.oneMapped('SELECT * FROM reviews WHERE id = $1', [id]);
  }

  async countByReviewerTargetTypeAndDate(reviewerId, targetType, dateStr) {
    const row = await this.one(
      `SELECT COUNT(*)::int AS cnt FROM reviews
       WHERE reviewer_id = $1 AND target_type = $2 AND DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = $3`,
      [reviewerId, targetType, dateStr]
    );
    return row?.cnt ?? 0;
  }

  async hasReviewedTarget(reviewerId, targetType, targetId) {
    const row = await this.one(
      `SELECT id FROM reviews WHERE reviewer_id = $1 AND target_type = $2 AND target_id = $3 LIMIT 1`,
      [reviewerId, targetType, targetId]
    );
    return !!row;
  }

  async setStatus(id, status) {
    await this.execute(
      `UPDATE reviews SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );
  }

  async createModerationLog({ reviewId, actorId, fromStatus, toStatus, reason }) {
    const id = generateId();
    await this.execute(
      `INSERT INTO review_moderation_logs (id, review_id, actor_id, from_status, to_status, reason, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [id, reviewId, actorId, fromStatus, toStatus, reason]
    );
    return id;
  }

  // UC-MGR-REV-01: Tổng hợp đánh giá theo target_type cho 1 chi nhánh.
  async summaryByBranch(branchId, { sinceDays = 30 } = {}) {
    const aggregate = await this.many(
      `SELECT target_type,
              COUNT(*)::int                                AS total_count,
              ROUND(AVG(rating)::numeric, 2)               AS avg_rating,
              SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)::int AS five_star,
              SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)::int AS one_star,
              SUM(CASE WHEN status = 'flagged' THEN 1 ELSE 0 END)::int AS flagged_count,
              SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END)::int AS hidden_count
       FROM reviews
       WHERE branch_id = $1
         AND created_at >= NOW() - ($2::int || ' days')::interval
       GROUP BY target_type`,
      [branchId, sinceDays]
    );

    // Top 5 target_id theo từng target_type (cho trang dashboard).
    const topByType = await this.many(
      `WITH ranked AS (
         SELECT target_type, target_id,
                COUNT(*)::int                  AS review_count,
                ROUND(AVG(rating)::numeric, 2) AS avg_rating,
                ROW_NUMBER() OVER (PARTITION BY target_type ORDER BY COUNT(*) DESC) AS rn
         FROM reviews
         WHERE branch_id = $1
           AND status = 'visible'
           AND created_at >= NOW() - ($2::int || ' days')::interval
         GROUP BY target_type, target_id
       )
       SELECT target_type, target_id, review_count, avg_rating
       FROM ranked
       WHERE rn <= 5
       ORDER BY target_type, review_count DESC`,
      [branchId, sinceDays]
    );

    return { aggregate, topByType, sinceDays };
  }

  async findByBranchAndStatus(branchId, status, { limit = 100 } = {}) {
    const params = [branchId];
    let where = 'r.branch_id = $1';
    if (status) {
      params.push(status);
      where += ` AND r.status = $${params.length}`;
    }
    params.push(limit);
    return this.manyMapped(
      `SELECT r.*, p.full_name AS reviewer_name
       FROM reviews r
       LEFT JOIN profiles p ON p.user_id = r.reviewer_id
       WHERE ${where}
       ORDER BY r.created_at DESC
       LIMIT $${params.length}`,
      params
    );
  }
}

module.exports = { PostgresReviewRepository };
