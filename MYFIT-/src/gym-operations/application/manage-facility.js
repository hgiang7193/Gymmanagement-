class CreateAreaUseCase {
  constructor({ facilityRepository }) {
    this.facilityRepository = facilityRepository;
  }
  async execute({ branchId, name, description, actorUserId }) {
    if (!name?.trim()) throw new Error('AREA_NAME_REQUIRED');
    return this.facilityRepository.createArea({ branchId, name: name.trim(), description, createdBy: actorUserId });
  }
}

class UpdateAreaUseCase {
  constructor({ facilityRepository }) {
    this.facilityRepository = facilityRepository;
  }
  async execute({ areaId, name, description, isActive }) {
    return this.facilityRepository.updateArea({ id: areaId, name, description, isActive });
  }
}

class ListAreasUseCase {
  constructor({ facilityRepository }) {
    this.facilityRepository = facilityRepository;
  }
  async execute({ branchId, activeOnly = true }) {
    return this.facilityRepository.listAreasByBranch(branchId, { activeOnly });
  }
}

class CreateAssetUseCase {
  constructor({ facilityRepository }) {
    this.facilityRepository = facilityRepository;
  }
  async execute({ branchId, areaId, name, assetType, purchaseDate, purchasePrice, notes, actorUserId }) {
    if (!name?.trim()) throw new Error('ASSET_NAME_REQUIRED');
    if (!assetType?.trim()) throw new Error('ASSET_TYPE_REQUIRED');
    // Generate asset_code: <TYPE>-<timestamp>
    const assetCode = `${assetType.toUpperCase().slice(0, 6)}-${Date.now()}`;
    return this.facilityRepository.createAsset({
      branchId, areaId, assetCode, name: name.trim(), assetType, purchaseDate, purchasePrice, notes, createdBy: actorUserId,
    });
  }
}

class UpdateAssetUseCase {
  constructor({ facilityRepository }) {
    this.facilityRepository = facilityRepository;
  }
  async execute({ assetId, name, areaId, notes, status }) {
    const allowed = ['ACTIVE', 'MAINTENANCE', 'BROKEN', 'RETIRED'];
    if (status && !allowed.includes(status)) throw new Error('INVALID_ASSET_STATUS');
    const asset = await this.facilityRepository.findAssetById(assetId);
    if (!asset) throw new Error('ASSET_NOT_FOUND');
    return this.facilityRepository.updateAsset({ id: assetId, name, areaId, notes, status });
  }
}

class ListAssetsUseCase {
  constructor({ facilityRepository }) {
    this.facilityRepository = facilityRepository;
  }
  async execute({ branchId, status }) {
    return this.facilityRepository.listAssetsByBranch(branchId, { status });
  }
}

class CreateMaintenanceTicketUseCase {
  constructor({ facilityRepository }) {
    this.facilityRepository = facilityRepository;
  }
  async execute({ assetId, branchId, title, description, actorUserId }) {
    if (!title?.trim()) throw new Error('TICKET_TITLE_REQUIRED');
    const asset = await this.facilityRepository.findAssetById(assetId);
    if (!asset) throw new Error('ASSET_NOT_FOUND');
    const ticket = await this.facilityRepository.createTicket({
      assetId, branchId, title: title.trim(), description, reportedBy: actorUserId,
    });
    // Auto-set asset to MAINTENANCE if it was ACTIVE
    if (asset.status === 'ACTIVE') {
      await this.facilityRepository.updateAssetStatus(assetId, 'MAINTENANCE');
    }
    return ticket;
  }
}

class UpdateTicketStatusUseCase {
  constructor({ facilityRepository }) {
    this.facilityRepository = facilityRepository;
  }
  async execute({ ticketId, status, assignedTo }) {
    const allowed = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!allowed.includes(status)) throw new Error('INVALID_TICKET_STATUS');
    const ticket = await this.facilityRepository.findTicketById(ticketId);
    if (!ticket) throw new Error('TICKET_NOT_FOUND');
    const resolvedAt = status === 'RESOLVED' || status === 'CLOSED' ? new Date().toISOString() : null;
    const updated = await this.facilityRepository.updateTicketStatus({ id: ticketId, status, assignedTo, resolvedAt });
    // If resolved/closed and asset was MAINTENANCE, set back to ACTIVE
    if ((status === 'RESOLVED' || status === 'CLOSED')) {
      const asset = await this.facilityRepository.findAssetById(ticket.assetId);
      if (asset?.status === 'MAINTENANCE') {
        await this.facilityRepository.updateAssetStatus(ticket.assetId, 'ACTIVE');
      }
    }
    return updated;
  }
}

class FacilityDashboardUseCase {
  constructor({ facilityRepository }) {
    this.facilityRepository = facilityRepository;
  }
  async execute({ branchId }) {
    const [stats, openTickets, assets] = await Promise.all([
      this.facilityRepository.getDashboardStats(branchId),
      this.facilityRepository.listTicketsByBranch(branchId, { status: 'OPEN' }),
      this.facilityRepository.listAssetsByBranch(branchId),
    ]);
    return {
      branchId,
      assetsByStatus: stats.assetsByStatus,
      ticketsByStatus: stats.ticketsByStatus,
      openTickets: openTickets.slice(0, 10),
      totalAssets: assets.length,
    };
  }
}

// ── UC-FAC-07: Maintenance Schedules (lịch bảo trì định kỳ) ──
const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'once'];
const FREQUENCY_TO_DAYS = { daily: 1, weekly: 7, monthly: 30, quarterly: 90, yearly: 365, once: 0 };

class CreateMaintenanceScheduleUseCase {
  constructor({ facilityRepository, clock }) {
    this.facilityRepository = facilityRepository;
    this.clock = clock;
  }
  async execute({ branchId, assetId, title, description, frequency, intervalDays, nextDueAt, actorUserId }) {
    if (!branchId) throw new Error('BRANCH_ID_REQUIRED');
    if (!title?.trim()) throw new Error('SCHEDULE_TITLE_REQUIRED');
    if (!frequency || !VALID_FREQUENCIES.includes(frequency)) throw new Error('INVALID_SCHEDULE_FREQUENCY');

    const days = intervalDays ?? FREQUENCY_TO_DAYS[frequency];
    if (!days && frequency !== 'once') throw new Error('INVALID_SCHEDULE_INTERVAL');

    const due = nextDueAt ? new Date(nextDueAt) : new Date(this.clock.now().getTime() + days * 86400000);
    if (isNaN(due.getTime())) throw new Error('INVALID_SCHEDULE_DUE_DATE');

    return this.facilityRepository.createSchedule({
      branchId, assetId, title: title.trim(), description, frequency,
      intervalDays: days, nextDueAt: due, createdBy: actorUserId,
    });
  }
}

class ListMaintenanceSchedulesUseCase {
  constructor({ facilityRepository }) { this.facilityRepository = facilityRepository; }
  async execute({ branchId, activeOnly = true }) {
    return this.facilityRepository.listSchedulesByBranch(branchId, { activeOnly });
  }
}

class UpdateMaintenanceScheduleUseCase {
  constructor({ facilityRepository }) { this.facilityRepository = facilityRepository; }
  async execute({ scheduleId, title, description, frequency, intervalDays, nextDueAt, isActive }) {
    if (frequency && !VALID_FREQUENCIES.includes(frequency)) throw new Error('INVALID_SCHEDULE_FREQUENCY');
    return this.facilityRepository.updateSchedule({
      id: scheduleId, title, description, frequency, intervalDays,
      nextDueAt: nextDueAt ? new Date(nextDueAt) : null, isActive,
    });
  }
}

// Trigger schedule due → tạo maintenance ticket + cập nhật next_due_at.
class RunDueMaintenanceSchedulesUseCase {
  constructor({ facilityRepository, clock }) {
    this.facilityRepository = facilityRepository;
    this.clock = clock;
  }
  async execute({ branchId, actorUserId }) {
    const now = this.clock.now();
    const dueList = await this.facilityRepository.listDueSchedules(branchId, { now });
    const triggered = [];

    for (const sched of dueList) {
      let ticketId = null;
      if (sched.assetId) {
        const ticket = await this.facilityRepository.createTicket({
          assetId: sched.assetId,
          branchId: sched.branchId,
          title: `[Định kỳ] ${sched.title}`,
          description: sched.description || `Bảo trì định kỳ (${sched.frequency})`,
          reportedBy: actorUserId || sched.createdBy,
        });
        ticketId = ticket.id;
      }

      const nextDue = sched.frequency === 'once'
        ? null
        : new Date(now.getTime() + sched.intervalDays * 86400000);

      await this.facilityRepository.recordScheduleRun({
        scheduleId: sched.id,
        ticketId,
        triggeredAt: now,
        triggeredBy: actorUserId,
        nextDueAt: nextDue || new Date(8640000000000000),
      });

      // 'once' → tự động deactivate sau khi chạy.
      if (sched.frequency === 'once') {
        await this.facilityRepository.updateSchedule({ id: sched.id, isActive: false });
      }

      triggered.push({ scheduleId: sched.id, ticketId, nextDueAt: nextDue });
    }

    return { triggeredCount: triggered.length, triggered };
  }
}

module.exports = {
  CreateAreaUseCase,
  UpdateAreaUseCase,
  ListAreasUseCase,
  CreateAssetUseCase,
  UpdateAssetUseCase,
  ListAssetsUseCase,
  CreateMaintenanceTicketUseCase,
  UpdateTicketStatusUseCase,
  FacilityDashboardUseCase,
  CreateMaintenanceScheduleUseCase,
  ListMaintenanceSchedulesUseCase,
  UpdateMaintenanceScheduleUseCase,
  RunDueMaintenanceSchedulesUseCase,
};
