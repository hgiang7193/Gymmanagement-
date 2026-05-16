// UC-POS-02: Record payment toward invoice (cộng dồn so với tổng hoá đơn).
// UC-POS-03: Khi invoice chuyển 'paid', tự động kích hoạt subscription / course
//             tương ứng với từng line item (membership | course | pt).
class RecordPaymentUseCase {
  constructor(deps) {
    this.deps = deps;
    this.pool = deps.pool;
    this.paymentRepository = deps.paymentRepository;
    this.invoiceRepository = deps.invoiceRepository;
    this.subscriptionRepository = deps.subscriptionRepository;
    this.membershipPlanRepository = deps.membershipPlanRepository;
    this.coursePackageRepository = deps.coursePackageRepository;
    this.courseEnrollmentRepository = deps.courseEnrollmentRepository;
    this.roleRepository = deps.roleRepository;
    this.roleAssignmentRepository = deps.roleAssignmentRepository;
    this.subscriptionStatusHistoryRepository = deps.subscriptionStatusHistoryRepository;
    this.auditLogRepository = deps.auditLogRepository;
    this.branchManagerAssignmentRepository = deps.branchManagerAssignmentRepository;
    this.clock = deps.clock;
    this.idGenerator = deps.idGenerator;
  }

  async execute(payload) {
    if (!payload?.invoiceId) throw new Error('VALIDATION_ERROR');
    const amount = Number(payload.amount);
    if (!amount || isNaN(amount) || amount <= 0) throw new Error('VALIDATION_ERROR');
    if (!payload.paymentMethod) throw new Error('VALIDATION_ERROR');

    const invoice = await this.invoiceRepository.findById(payload.invoiceId);
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    if (invoice.status === 'cancelled') throw new Error('INVOICE_ALREADY_CANCELLED');
    if (invoice.status === 'paid') throw new Error('INVOICE_ALREADY_PAID');

    // UC-POS-01/02 branch scope: manager chỉ thanh toán hoá đơn thuộc chi nhánh mình quản lý.
    if (payload.actorRole === 'MANAGER' && this.branchManagerAssignmentRepository) {
      const isManager = await this.branchManagerAssignmentRepository.isManagerOfBranch(
        payload.actorUserId,
        invoice.branchId
      );
      if (!isManager) throw new Error('CROSS_BRANCH_ACCESS');
    }

    const now = this.clock.now();
    const paymentId = this.idGenerator.generate();

    // Cộng dồn các payment đã thành công + payment mới, so với totalAmount.
    const existingPayments = await this.paymentRepository.listByInvoiceId(invoice.id);
    const paidSoFar = existingPayments
      .filter(p => p.status === 'success')
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const newTotalPaid = paidSoFar + amount;
    const invoiceTotal = Number(invoice.totalAmount) - Number(invoice.discountAmount || 0);

    if (newTotalPaid > invoiceTotal) throw new Error('PAYMENT_EXCEEDS_INVOICE');

    const willBePaid = newTotalPaid >= invoiceTotal;
    const newStatus = willBePaid ? 'paid' : 'partial';

    const client = this.pool ? await this.pool.connect() : null;
    try {
      if (client) await client.query('BEGIN');

      const insertPayment = `insert into payments (id, invoice_id, amount, payment_method, status, transaction_ref, processed_at, created_by)
                             values ($1, $2, $3, $4, $5, $6, $7, $8)`;
      const params = [paymentId, invoice.id, amount, payload.paymentMethod, 'success', payload.transactionRef || null, now, payload.actorUserId];
      if (client) await client.query(insertPayment, params);
      else await this.paymentRepository.create({
        id: paymentId, invoiceId: invoice.id, amount, paymentMethod: payload.paymentMethod,
        status: 'success', transactionRef: payload.transactionRef || null, processedAt: now, createdBy: payload.actorUserId,
      });

      if (client) {
        await client.query('update invoices set status=$1, updated_at=$2 where id=$3', [newStatus, now, invoice.id]);
      } else {
        await this.invoiceRepository.updateStatus(invoice.id, newStatus, now);
      }

      // UC-POS-03: kích hoạt sau khi đủ tiền.
      const activations = willBePaid
        ? await this.activateLineItems({ client, invoice, actorUserId: payload.actorUserId, now })
        : [];

      if (client) await client.query('COMMIT');

      return {
        id: paymentId,
        invoiceId: invoice.id,
        amount,
        paymentMethod: payload.paymentMethod,
        status: 'success',
        invoiceStatus: newStatus,
        paidSoFar: newTotalPaid,
        invoiceTotal,
        activations,
        processedAt: now,
      };
    } catch (err) {
      if (client) await client.query('ROLLBACK');
      throw err;
    } finally {
      if (client) client.release();
    }
  }

  async activateLineItems({ client, invoice, actorUserId, now }) {
    const itemsRes = client
      ? await client.query('select * from invoice_line_items where invoice_id = $1', [invoice.id])
      : null;
    const items = itemsRes ? itemsRes.rows : [];
    const activations = [];

    for (const item of items) {
      const itemType = item.item_type;
      const itemId = item.item_id;
      if (!itemType || !itemId) continue;

      if (itemType === 'membership') {
        const planRes = await client.query('select * from membership_plans where id=$1', [itemId]);
        const plan = planRes.rows[0];
        if (!plan) continue;

        const existingActive = await client.query(
          `select id from subscriptions where user_id=$1 and status='ACTIVE' limit 1`,
          [invoice.userId]
        );
        if (existingActive.rows.length > 0) {
          activations.push({ type: 'membership', skipped: true, reason: 'ALREADY_ACTIVE' });
          continue;
        }

        const subId = this.idGenerator.generate();
        const expiresAt = new Date(now.getTime() + plan.duration_days * 86400000);
        await client.query(
          `insert into subscriptions (id, user_id, membership_plan_id, home_branch_id, status,
              started_at, expires_at, total_sessions, sessions_used, sessions_remaining,
              activated_by, activated_at)
           values ($1,$2,$3,$4,'ACTIVE',$5,$6,$7,0,$7,$8,$5)`,
          [subId, invoice.userId, plan.id, invoice.branchId, now, expiresAt, plan.total_sessions, actorUserId]
        );

        const memberRole = await this.roleRepository.findByCode('MEMBER');
        if (memberRole) {
          const roleAssignmentExists = await client.query(
            `select id from user_role_assignments where user_id=$1 and role_id=$2`,
            [invoice.userId, memberRole.id]
          );
          if (roleAssignmentExists.rows.length === 0) {
            await client.query(
              `insert into user_role_assignments (id, user_id, role_id, branch_id, assigned_at)
               values ($1,$2,$3,$4,$5)`,
              [this.idGenerator.generate(), invoice.userId, memberRole.id, invoice.branchId, now]
            );
          }
        }

        await client.query(
          `insert into subscription_status_history (id, subscription_id, from_status, to_status, changed_by, reason, created_at)
           values ($1,$2,null,'ACTIVE',$3,'payment_received',$4)`,
          [this.idGenerator.generate(), subId, actorUserId, now]
        );

        await client.query(
          `insert into audit_logs (id, actor_user_id, action_code, entity_type, entity_id, branch_id, metadata_json, created_at)
           values ($1,$2,'membership_activated_via_payment','subscription',$3,$4,$5,$6)`,
          [this.idGenerator.generate(), actorUserId, subId, invoice.branchId,
           JSON.stringify({ invoiceId: invoice.id, planId: plan.id }), now]
        );

        activations.push({ type: 'membership', subscriptionId: subId, planId: plan.id });
      } else if (itemType === 'course') {
        const pkgRes = await client.query('select * from course_packages where id=$1', [itemId]);
        const pkg = pkgRes.rows[0];
        if (!pkg) continue;

        const existingActive = await client.query(
          `select id from course_enrollments where user_id=$1 and status='ACTIVE' limit 1`,
          [invoice.userId]
        );
        if (existingActive.rows.length > 0) {
          activations.push({ type: 'course', skipped: true, reason: 'ALREADY_ACTIVE' });
          continue;
        }

        const enrollId = this.idGenerator.generate();
        await client.query(
          `insert into course_enrollments (id, user_id, course_package_id, branch_id, status,
              enrolled_at, started_at, total_sessions, sessions_attended, sessions_remaining,
              created_by, created_at)
           values ($1,$2,$3,$4,'ACTIVE',$5,$5,$6,0,$6,$7,$5)`,
          [enrollId, invoice.userId, pkg.id, invoice.branchId, now, pkg.total_sessions, actorUserId]
        );

        await client.query(
          `insert into audit_logs (id, actor_user_id, action_code, entity_type, entity_id, branch_id, metadata_json, created_at)
           values ($1,$2,'course_enrolled_via_payment','course_enrollment',$3,$4,$5,$6)`,
          [this.idGenerator.generate(), actorUserId, enrollId, invoice.branchId,
           JSON.stringify({ invoiceId: invoice.id, packageId: pkg.id }), now]
        );

        activations.push({ type: 'course', enrollmentId: enrollId, packageId: pkg.id });
      }
    }

    await client.query(
      `insert into audit_logs (id, actor_user_id, action_code, entity_type, entity_id, branch_id, metadata_json, created_at)
       values ($1,$2,'invoice_paid','invoice',$3,$4,$5,$6)`,
      [this.idGenerator.generate(), actorUserId, invoice.id, invoice.branchId,
       JSON.stringify({ activations: activations.length }), now]
    );

    return activations;
  }
}

module.exports = { RecordPaymentUseCase };
