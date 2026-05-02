const { SqlRepository } = require('./sql-repository');

class PostgresInvoiceRepository extends SqlRepository {
  async create(invoice) {
    await this.execute(
      `insert into invoices (id, invoice_number, user_id, branch_id, total_amount, status, due_date, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [invoice.id, invoice.invoiceNumber, invoice.userId, invoice.branchId, invoice.totalAmount, invoice.status, invoice.dueDate, invoice.createdAt, invoice.updatedAt]
    );
    if (invoice.items && invoice.items.length > 0) {
      for (const item of invoice.items) {
        await this.execute(
          `insert into invoice_line_items (id, invoice_id, item_type, item_id, item_name, unit_price, quantity, subtotal, created_at)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [item.id, invoice.id, item.itemType, item.itemId, item.itemName, item.unitPrice, item.quantity, item.subtotal, invoice.createdAt]
        );
      }
    }
    return invoice;
  }

  async findById(id) {
    return this.oneMapped('select * from invoices where id = $1', [id]);
  }

  async updateStatus(invoiceId, status, updatedAt) {
    await this.execute(
      'update invoices set status = $1, updated_at = $2 where id = $3',
      [status, updatedAt, invoiceId]
    );
  }

  async listByUserId(userId) {
    return this.manyMapped('select * from invoices where user_id = $1 order by created_at desc', [userId]);
  }

  async findWithLineItemsByUser(userId) {
    const invoices = await this.manyMapped(
      `SELECT i.*, p.full_name as member_name
       FROM invoices i
       LEFT JOIN profiles p ON p.user_id = i.user_id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC`,
      [userId]
    );
    for (const inv of invoices) {
      inv.lineItems = await this.manyMapped(
        'SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY created_at ASC',
        [inv.id]
      );
      inv.payments = await this.manyMapped(
        'SELECT * FROM payments WHERE invoice_id = $1 ORDER BY processed_at ASC',
        [inv.id]
      );
    }
    return invoices;
  }

  async findByBranchAndDate(branchId, date) {
    return this.manyMapped(
      `SELECT * FROM invoices
       WHERE branch_id = $1 AND date_trunc('day', created_at) = $2::date
       ORDER BY created_at DESC`,
      [branchId, date]
    );
  }

  async cancel(invoiceId, cancelledBy, cancelReason, now) {
    await this.execute(
      `UPDATE invoices SET status='cancelled', cancelled_at=$1, cancel_reason=$2, cancelled_by=$3, updated_at=$1 WHERE id=$4`,
      [now, cancelReason, cancelledBy, invoiceId]
    );
  }
}

module.exports = { PostgresInvoiceRepository };
