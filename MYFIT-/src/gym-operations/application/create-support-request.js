// UC-MEMBER-07: Member submits a support request when check-in fails
class CreateSupportRequestUseCase {
  constructor({ pool, shiftRepository, clock, idGenerator }) {
    this.pool = pool;
    this.shiftRepository = shiftRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute({ userId, shiftId, branchId, reason }) {
    if (!userId || !branchId) throw new Error('VALIDATION_ERROR');

    const id = this.idGenerator.generate();
    const now = this.clock.now();

    await this.pool.query(
      `INSERT INTO support_requests (id, member_id, shift_id, branch_id, reason, status, created_at)
       VALUES ($1,$2,$3,$4,$5,'open',$6)`,
      [id, userId, shiftId ?? null, branchId, reason ?? null, now]
    );

    return { id, userId, shiftId, branchId, reason, status: 'open', createdAt: now };
  }
}

module.exports = { CreateSupportRequestUseCase };
