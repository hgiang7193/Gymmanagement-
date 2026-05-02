// UC-POS-05: Cancel invoice (pending) or refund (paid)
class CancelInvoiceUseCase {
  constructor({ invoiceRepository, subscriptionRepository, branchManagerAssignmentRepository, clock, idGenerator, auditLogRepository }) {
    this.invoiceRepository = invoiceRepository;
    this.subscriptionRepository = subscriptionRepository;
    this.branchManagerAssignmentRepository = branchManagerAssignmentRepository;
    this.auditLogRepository = auditLogRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute({ invoiceId, reason, actorUserId, actorRole }) {
    if (!invoiceId || !reason?.trim() || !actorUserId) throw new Error('VALIDATION_ERROR');

    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    if (invoice.status === 'cancelled') throw new Error('INVOICE_ALREADY_CANCELLED');
    if (invoice.status === 'paid') throw new Error('USE_REFUND_FOR_PAID_INVOICE');

    if (actorRole === 'MANAGER' && this.branchManagerAssignmentRepository) {
      const isManager = await this.branchManagerAssignmentRepository.isManagerOfBranch(actorUserId, invoice.branchId);
      if (!isManager) throw new Error('CROSS_BRANCH_ACCESS');
    }

    const now = this.clock.now();
    await this.invoiceRepository.cancel(invoiceId, actorUserId, reason.trim(), now);
    await this.auditLogRepository.create({
      id: this.idGenerator.generate(),
      actorUserId,
      actionCode: 'invoice_cancelled',
      entityType: 'invoice',
      entityId: invoiceId,
      branchId: invoice.branchId,
      metadataJson: { reason: reason.trim() },
      createdAt: now,
    });

    return { invoiceId, status: 'cancelled', cancelledAt: now };
  }
}

module.exports = { CancelInvoiceUseCase };
