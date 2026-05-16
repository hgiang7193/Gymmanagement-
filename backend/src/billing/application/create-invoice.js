// UC-POS-01: Tạo hoá đơn cho member tại chi nhánh.
// Branch scope: manager chỉ tạo hoá đơn cho chi nhánh mình quản lý.
class CreateInvoiceUseCase {
  constructor({ invoiceRepository, userRepository, branchRepository, branchManagerAssignmentRepository, clock, idGenerator }) {
    this.invoiceRepository = invoiceRepository;
    this.userRepository = userRepository;
    this.branchRepository = branchRepository;
    this.branchManagerAssignmentRepository = branchManagerAssignmentRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async execute(payload) {
    if (!payload?.userId || !payload?.branchId) throw new Error('VALIDATION_ERROR');

    const user = await this.userRepository.findById(payload.userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const branch = await this.branchRepository.findById(payload.branchId);
    if (!branch) throw new Error('BRANCH_NOT_FOUND');

    if (payload.actorRole === 'MANAGER' && this.branchManagerAssignmentRepository && payload.actorUserId) {
      const isManager = await this.branchManagerAssignmentRepository.isManagerOfBranch(payload.actorUserId, payload.branchId);
      if (!isManager) throw new Error('CROSS_BRANCH_ACCESS');
    }

    const items = payload.items?.map(item => ({
      id: this.idGenerator.generate(),
      itemType: item.itemType,
      itemId: item.itemId,
      itemName: item.itemName,
      unitPrice: item.unitPrice,
      quantity: item.quantity || 1,
      subtotal: item.unitPrice * (item.quantity || 1)
    })) || [];

    const computedTotal = items.reduce((sum, i) => sum + i.subtotal, 0);

    const invoice = {
      id: this.idGenerator.generate(),
      invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: payload.userId,
      branchId: payload.branchId,
      totalAmount: payload.totalAmount ?? computedTotal,
      status: 'pending',
      dueDate: payload.dueDate || this.clock.now(),
      items,
      createdAt: this.clock.now(),
      updatedAt: this.clock.now()
    };

    await this.invoiceRepository.create(invoice);
    return invoice;
  }
}

module.exports = { CreateInvoiceUseCase };
