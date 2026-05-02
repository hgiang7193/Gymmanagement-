const { v4: uuidv4 } = require('uuid');

// Fixed shift definitions per MVP_API_CONTRACTS.md Section 8.4
const SHIFT_DEFINITIONS = [
  { code: 'MORNING_1', startTime: '05:30', endTime: '06:30' },
  { code: 'MORNING_2', startTime: '06:30', endTime: '07:30' },
  { code: 'AFTERNOON_1', startTime: '16:30', endTime: '17:30' },
  { code: 'AFTERNOON_2', startTime: '17:30', endTime: '18:30' },
  { code: 'EVENING_1', startTime: '18:30', endTime: '19:30' },
  { code: 'EVENING_2', startTime: '19:30', endTime: '20:30' },
];

class GenerateDailyShiftsUseCase {
  constructor({ shiftRepository, clock }) {
    this.shiftRepository = shiftRepository;
    this.clock = clock;
  }

  /**
   * Generate 6 fixed shifts for a specific branch and date
   * @param {Object} params
   * @param {string} params.branchId - Branch UUID
   * @param {string} params.date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of created shifts
   */
  async execute({ branchId, date }) {
    if (!branchId || !date) {
      throw new Error('VALIDATION_ERROR: branchId and date are required');
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error('VALIDATION_ERROR: date must be in YYYY-MM-DD format');
    }

    const now = this.clock.now();
    const shifts = [];

    for (const def of SHIFT_DEFINITIONS) {
      // Construct start_at and end_at with timezone Asia/Ho_Chi_Minh (UTC+7)
      const startAt = new Date(`${date}T${def.startTime}:00+07:00`);
      const endAt = new Date(`${date}T${def.endTime}:00+07:00`);

      const shift = {
        id: uuidv4(),
        branchId,
        shiftCode: def.code,
        date,
        startAt,
        endAt,
        coachCapacity: 3,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await this.shiftRepository.upsert(shift);
        shifts.push(shift);
      } catch (error) {
        // If shift already exists (unique constraint), skip it
        if (error.message?.includes('uq_shift_branch_date_code')) {
          console.log(`Shift ${def.code} already exists for ${date}`);
          continue;
        }
        throw error;
      }
    }

    return shifts;
  }

  /**
   * Get shift definitions (for reference)
   */
  static getShiftDefinitions() {
    return SHIFT_DEFINITIONS;
  }
}

module.exports = { GenerateDailyShiftsUseCase, SHIFT_DEFINITIONS };
