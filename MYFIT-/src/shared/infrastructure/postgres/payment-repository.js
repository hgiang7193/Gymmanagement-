const { SqlRepository } = require('./sql-repository');

class PostgresPaymentRepository extends SqlRepository {
  async create(payment) {
    await this.execute(
      `insert into payments (id, invoice_id, amount, payment_method, status, transaction_ref, processed_at, created_by)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [payment.id, payment.invoiceId, payment.amount, payment.paymentMethod, payment.status, payment.transactionRef, payment.processedAt, payment.createdBy]
    );
    return payment;
  }

  async listByInvoiceId(invoiceId) {
    return this.manyMapped('select * from payments where invoice_id = $1 order by processed_at desc', [invoiceId]);
  }
}

module.exports = { PostgresPaymentRepository };
