// UC-POS-05: Refund a paid invoice (full or partial).
// Khi refund: hoàn lại tiền + (nếu full refund) deactivate subscription/course
// đã được kích hoạt từ invoice này.
class CreateRefundUseCase {
  constructor({ pool, invoiceRepository, branchManagerAssignmentRepository, clock, idGenerator }) {
    this.pool = pool;
    this.invoiceRepository = invoiceRepository;
    this.branchManagerAssignmentRepository = branchManagerAssignmentRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute({ invoiceId, amount, reason, actorUserId, actorRole }) {
    if (!invoiceId || !reason?.trim() || !actorUserId) throw new Error('VALIDATION_ERROR');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) throw new Error('VALIDATION_ERROR');

    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    if (invoice.status !== 'paid') throw new Error('INVOICE_NOT_PAID');

    // Branch scope: manager chỉ refund hoá đơn thuộc chi nhánh mình.
    if (actorRole === 'MANAGER' && this.branchManagerAssignmentRepository) {
      const isManager = await this.branchManagerAssignmentRepository.isManagerOfBranch(actorUserId, invoice.branchId);
      if (!isManager) throw new Error('CROSS_BRANCH_ACCESS');
    }

    const refundAmount = Number(amount);
    if (refundAmount > invoice.totalAmount) throw new Error('REFUND_EXCEEDS_INVOICE');

    const now = this.clock.now();
    const refundId = this.idGenerator.generate();
    const isFullRefund = refundAmount >= invoice.totalAmount;
    const deactivations = [];

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO refunds (id, invoice_id, amount, reason, status, processed_by, processed_at, created_at)
         VALUES ($1,$2,$3,$4,'completed',$5,$6,$6)`,
        [refundId, invoiceId, refundAmount, reason.trim(), actorUserId, now]
      );

      if (isFullRefund) {
        await client.query(
          `UPDATE invoices SET status='cancelled', cancelled_at=$1, cancel_reason=$2, cancelled_by=$3, updated_at=$1 WHERE id=$4`,
          [now, reason.trim(), actorUserId, invoiceId]
        );

        // Deactivate gói/khoá đã activate từ line items của invoice này.
        const itemsRes = await client.query(
          'SELECT item_type, item_id FROM invoice_line_items WHERE invoice_id = $1',
          [invoiceId]
        );

        for (const item of itemsRes.rows) {
          if (item.item_type === 'membership' && item.item_id) {
            const subRes = await client.query(
              `SELECT id FROM subscriptions
               WHERE user_id = $1 AND membership_plan_id = $2 AND status = 'ACTIVE'
               ORDER BY activated_at DESC LIMIT 1`,
              [invoice.userId, item.item_id]
            );
            const sub = subRes.rows[0];
            if (sub) {
              await client.query(
                `UPDATE subscriptions SET status='CANCELLED', expires_at=$1 WHERE id=$2`,
                [now, sub.id]
              );
              await client.query(
                `INSERT INTO subscription_status_history (id, subscription_id, from_status, to_status, changed_by, reason, created_at)
                 VALUES ($1,$2,'ACTIVE','CANCELLED',$3,'invoice_refunded',$4)`,
                [this.idGenerator.generate(), sub.id, actorUserId, now]
              );
              deactivations.push({ type: 'membership', subscriptionId: sub.id });
            }
          } else if (item.item_type === 'course' && item.item_id) {
            const enrollRes = await client.query(
              `SELECT id FROM course_enrollments
               WHERE user_id = $1 AND course_package_id = $2 AND status = 'ACTIVE'
               ORDER BY enrolled_at DESC LIMIT 1`,
              [invoice.userId, item.item_id]
            );
            const enrollment = enrollRes.rows[0];
            if (enrollment) {
              await client.query(
                `UPDATE course_enrollments SET status='CANCELLED', updated_at=$1 WHERE id=$2`,
                [now, enrollment.id]
              );
              deactivations.push({ type: 'course', enrollmentId: enrollment.id });
            }
          }
        }
      }

      await client.query(
        `INSERT INTO audit_logs (id,actor_user_id,action_code,entity_type,entity_id,branch_id,metadata_json,created_at)
         VALUES ($1,$2,'invoice_refunded','invoice',$3,$4,$5,$6)`,
        [this.idGenerator.generate(), actorUserId, invoiceId, invoice.branchId,
         JSON.stringify({ refundAmount, reason: reason.trim(), isFullRefund, deactivations: deactivations.length }), now]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return { refundId, invoiceId, amount: refundAmount, isFullRefund, deactivations, status: 'completed', processedAt: now };
  }
}

module.exports = { CreateRefundUseCase };
