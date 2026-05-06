const { SqlRepository } = require('./sql-repository');
const { generateId } = require('../id-generator');

class PostgresFacilityRepository extends SqlRepository {
  // ── Areas ──────────────────────────────────────────────
  async createArea({ branchId, name, description, createdBy }) {
    const id = generateId();
    await this.execute(
      `INSERT INTO areas (id, branch_id, name, description, is_active, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,true,$5,NOW(),NOW())`,
      [id, branchId, name, description ?? null, createdBy]
    );
    return { id, branchId, name, description, isActive: true, createdBy };
  }

  async listAreasByBranch(branchId, { activeOnly = true } = {}) {
    const where = activeOnly ? 'branch_id = $1 AND is_active = true' : 'branch_id = $1';
    return this.manyMapped(`SELECT * FROM areas WHERE ${where} ORDER BY name`, [branchId]);
  }

  async updateArea({ id, name, description, isActive }) {
    await this.execute(
      `UPDATE areas SET name = COALESCE($2, name), description = COALESCE($3, description),
       is_active = COALESCE($4, is_active), updated_at = NOW() WHERE id = $1`,
      [id, name ?? null, description ?? null, isActive ?? null]
    );
    return this.oneMapped('SELECT * FROM areas WHERE id = $1', [id]);
  }

  // ── Assets ─────────────────────────────────────────────
  async createAsset({ branchId, areaId, assetCode, name, assetType, purchaseDate, purchasePrice, notes, createdBy }) {
    const id = generateId();
    await this.execute(
      `INSERT INTO assets (id, branch_id, area_id, asset_code, name, asset_type, purchase_date, purchase_price, status, notes, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVE',$9,$10,NOW(),NOW())`,
      [id, branchId, areaId ?? null, assetCode, name, assetType, purchaseDate ?? null, purchasePrice ?? null, notes ?? null, createdBy]
    );
    return { id, branchId, areaId, assetCode, name, assetType, status: 'ACTIVE' };
  }

  async listAssetsByBranch(branchId, { status } = {}) {
    const params = [branchId];
    let where = 'a.branch_id = $1';
    if (status) { params.push(status); where += ` AND a.status = $${params.length}`; }
    return this.manyMapped(
      `SELECT a.*, ar.name AS area_name FROM assets a
       LEFT JOIN areas ar ON ar.id = a.area_id
       WHERE ${where} ORDER BY a.name`,
      params
    );
  }

  async updateAssetStatus(id, status) {
    await this.execute(
      `UPDATE assets SET status = $2, updated_at = NOW() WHERE id = $1`,
      [id, status]
    );
    return this.oneMapped('SELECT * FROM assets WHERE id = $1', [id]);
  }

  async updateAsset({ id, name, areaId, notes, status }) {
    await this.execute(
      `UPDATE assets SET
         name = COALESCE($2, name),
         area_id = COALESCE($3, area_id),
         notes = COALESCE($4, notes),
         status = COALESCE($5, status),
         updated_at = NOW()
       WHERE id = $1`,
      [id, name ?? null, areaId ?? null, notes ?? null, status ?? null]
    );
    return this.oneMapped('SELECT * FROM assets WHERE id = $1', [id]);
  }

  async findAssetById(id) {
    return this.oneMapped('SELECT * FROM assets WHERE id = $1', [id]);
  }

  // ── Maintenance Tickets ────────────────────────────────
  async createTicket({ assetId, branchId, title, description, reportedBy }) {
    const id = generateId();
    await this.execute(
      `INSERT INTO maintenance_tickets (id, asset_id, branch_id, title, description, status, reported_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,'OPEN',$6,NOW(),NOW())`,
      [id, assetId, branchId, title, description ?? null, reportedBy]
    );
    return { id, assetId, branchId, title, description, status: 'OPEN', reportedBy };
  }

  async updateTicketStatus({ id, status, assignedTo, resolvedAt }) {
    await this.execute(
      `UPDATE maintenance_tickets SET
         status = $2,
         assigned_to = COALESCE($3, assigned_to),
         resolved_at = COALESCE($4, resolved_at),
         updated_at = NOW()
       WHERE id = $1`,
      [id, status, assignedTo ?? null, resolvedAt ?? null]
    );
    return this.oneMapped('SELECT * FROM maintenance_tickets WHERE id = $1', [id]);
  }

  async listTicketsByBranch(branchId, { status } = {}) {
    const params = [branchId];
    let where = 't.branch_id = $1';
    if (status) { params.push(status); where += ` AND t.status = $${params.length}`; }
    return this.manyMapped(
      `SELECT t.*, a.name AS asset_name, a.asset_code
       FROM maintenance_tickets t
       JOIN assets a ON a.id = t.asset_id
       WHERE ${where}
       ORDER BY t.created_at DESC`,
      params
    );
  }

  async findTicketById(id) {
    return this.oneMapped(
      `SELECT t.*, a.name AS asset_name, a.asset_code
       FROM maintenance_tickets t JOIN assets a ON a.id = t.asset_id
       WHERE t.id = $1`,
      [id]
    );
  }

  // ── Maintenance Schedules (UC-FAC-07) ──────────────────
  async createSchedule({ branchId, assetId, title, description, frequency, intervalDays, nextDueAt, createdBy }) {
    const id = generateId();
    await this.execute(
      `INSERT INTO maintenance_schedules
         (id, branch_id, asset_id, title, description, frequency, interval_days, next_due_at, is_active, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,NOW(),NOW())`,
      [id, branchId, assetId ?? null, title, description ?? null, frequency, intervalDays, nextDueAt, createdBy]
    );
    return this.oneMapped('SELECT * FROM maintenance_schedules WHERE id = $1', [id]);
  }

  async listSchedulesByBranch(branchId, { activeOnly = true } = {}) {
    const where = activeOnly ? 's.branch_id = $1 AND s.is_active = true' : 's.branch_id = $1';
    return this.manyMapped(
      `SELECT s.*, a.name AS asset_name, a.asset_code
       FROM maintenance_schedules s
       LEFT JOIN assets a ON a.id = s.asset_id
       WHERE ${where}
       ORDER BY s.next_due_at ASC`,
      [branchId]
    );
  }

  async findScheduleById(id) {
    return this.oneMapped('SELECT * FROM maintenance_schedules WHERE id = $1', [id]);
  }

  async updateSchedule({ id, title, description, frequency, intervalDays, nextDueAt, isActive }) {
    await this.execute(
      `UPDATE maintenance_schedules SET
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         frequency = COALESCE($4, frequency),
         interval_days = COALESCE($5, interval_days),
         next_due_at = COALESCE($6, next_due_at),
         is_active = COALESCE($7, is_active),
         updated_at = NOW()
       WHERE id = $1`,
      [id, title ?? null, description ?? null, frequency ?? null, intervalDays ?? null, nextDueAt ?? null, isActive ?? null]
    );
    return this.findScheduleById(id);
  }

  async listDueSchedules(branchId, { now }) {
    const params = now ? [now] : [];
    const branchClause = branchId ? `AND branch_id = $${params.length + 1}` : '';
    if (branchId) params.push(branchId);
    return this.manyMapped(
      `SELECT * FROM maintenance_schedules
       WHERE is_active = true AND next_due_at <= ${now ? '$1' : 'NOW()'} ${branchClause}
       ORDER BY next_due_at ASC`,
      params
    );
  }

  async recordScheduleRun({ scheduleId, ticketId, triggeredAt, triggeredBy, nextDueAt }) {
    const runId = generateId();
    await this.execute(
      `INSERT INTO maintenance_schedule_runs (id, schedule_id, ticket_id, triggered_at, triggered_by)
       VALUES ($1,$2,$3,$4,$5)`,
      [runId, scheduleId, ticketId ?? null, triggeredAt, triggeredBy ?? null]
    );
    await this.execute(
      `UPDATE maintenance_schedules
         SET last_run_at = $2, next_due_at = $3, updated_at = NOW()
       WHERE id = $1`,
      [scheduleId, triggeredAt, nextDueAt]
    );
    return runId;
  }

  // ── Dashboard ──────────────────────────────────────────
  async getDashboardStats(branchId) {
    const [assetsRow, ticketsRow] = await Promise.all([
      this.pool.query(
        `SELECT status, COUNT(*)::int AS cnt FROM assets WHERE branch_id = $1 GROUP BY status`,
        [branchId]
      ),
      this.pool.query(
        `SELECT status, COUNT(*)::int AS cnt FROM maintenance_tickets WHERE branch_id = $1 GROUP BY status`,
        [branchId]
      ),
    ]);
    const assetsByStatus = Object.fromEntries(assetsRow.rows.map(r => [r.status, r.cnt]));
    const ticketsByStatus = Object.fromEntries(ticketsRow.rows.map(r => [r.status, r.cnt]));
    return { assetsByStatus, ticketsByStatus };
  }
}

module.exports = { PostgresFacilityRepository };
