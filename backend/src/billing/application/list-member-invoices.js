// UC-MEMBER-06: Member views their own invoice/payment history
class ListMemberInvoicesUseCase {
  constructor({ invoiceRepository }) {
    this.invoiceRepository = invoiceRepository;
  }

  async execute({ userId }) {
    if (!userId) throw new Error('VALIDATION_ERROR');
    return this.invoiceRepository.findWithLineItemsByUser(userId);
  }
}

module.exports = { ListMemberInvoicesUseCase };
