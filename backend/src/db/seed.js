const { randomUUID } = require('crypto');
const { loadEnv } = require('../shared/load-env');
const { createPostgresPool } = require('../shared/infrastructure/postgres/pool');

loadEnv();

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;
const DAY = 24 * HOUR;

function addMs(date, ms) {
  return new Date(date.getTime() + ms);
}

function makeId() {
  return randomUUID();
}

function buildSeedData() {
  const timelineStart = new Date('2026-01-15T08:00:00+07:00');

  const ids = {
    roleAdmin: makeId(),
    roleManager: makeId(),
    roleCoach: makeId(),
    roleMember: makeId(),
    organization: makeId(),
    branchHn: makeId(),
    branchHcm: makeId(),
    planBasic: makeId(),
    planPro: makeId(),
    planPtStarter: makeId(),
    ptPkg10: makeId(),
    ptPkg20: makeId(),
  };

  const roles = [
    { id: ids.roleAdmin, code: 'admin', name: 'Admin' },
    { id: ids.roleManager, code: 'manager', name: 'Manager' },
    { id: ids.roleCoach, code: 'coach', name: 'Coach' },
    { id: ids.roleMember, code: 'member', name: 'Member' },
  ];

  const organization = {
    id: ids.organization,
    name: 'MYFIT Corp',
    taxId: '0312345678',
    createdAt: timelineStart,
    updatedAt: timelineStart,
  };

  const branches = [
    {
      id: ids.branchHn,
      organizationId: ids.organization,
      code: 'HN-01',
      name: 'MYFIT Hà Nội',
      address: '123 Tran Duy Hung, Cau Giay, Ha Noi',
      phoneNumber: '0901000001',
      status: 'active',
      createdAt: timelineStart,
      updatedAt: timelineStart,
    },
    {
      id: ids.branchHcm,
      organizationId: ids.organization,
      code: 'HCM-01',
      name: 'MYFIT HCM',
      address: '88 Nguyen Huu Canh, Binh Thanh, TP.HCM',
      phoneNumber: '0901000002',
      status: 'active',
      createdAt: timelineStart,
      updatedAt: timelineStart,
    },
  ];

  const users = [];
  const profiles = [];
  const roleAssignments = [];
  const managers = [];
  const coaches = [];
  const members = [];
  const managerAssignments = [];
  const staffProfiles = [];

  function addUser({ email, fullName, roleCode, branchId, createdAt, phoneNumber }) {
    const userId = makeId();
    const profileId = makeId();
    const roleId = roleCode === 'admin'
      ? ids.roleAdmin
      : roleCode === 'manager'
        ? ids.roleManager
        : roleCode === 'coach'
          ? ids.roleCoach
          : ids.roleMember;

    users.push({
      id: userId,
      email,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$HOz829I6Vq5PJisRIt0mug$Ay+i249XOpEBn5Mz8RfT/5+chC98SWmc3EgK9qmMODY',
      status: 'active',
      emailVerifiedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    });

    profiles.push({
      id: profileId,
      userId,
      fullName,
      phoneNumber: phoneNumber ?? null,
      createdAt,
      updatedAt: createdAt,
    });

    roleAssignments.push({
      id: makeId(),
      userId,
      roleId,
      branchId,
      assignedAt: createdAt,
    });

    return { id: userId, email, fullName };
  }

  const admin = addUser({
    email: 'admin@myfit.vn',
    fullName: 'MYFIT System Admin',
    roleCode: 'admin',
    branchId: null,
    phoneNumber: '0909000001',
    createdAt: addMs(timelineStart, 1 * MIN),
  });

  const managerHn = addUser({
    email: 'manager.hn@myfit.vn',
    fullName: 'Nguyen Minh Quan',
    roleCode: 'manager',
    branchId: ids.branchHn,
    phoneNumber: '0909000002',
    createdAt: addMs(timelineStart, 2 * MIN),
  });

  const managerHcm = addUser({
    email: 'manager.hcm@myfit.vn',
    fullName: 'Tran Hai Nam',
    roleCode: 'manager',
    branchId: ids.branchHcm,
    phoneNumber: '0909000003',
    createdAt: addMs(timelineStart, 2 * MIN),
  });

  managers.push({ userId: managerHn.id, branchId: ids.branchHn, activeFrom: addMs(timelineStart, 30 * MIN) });
  managers.push({ userId: managerHcm.id, branchId: ids.branchHcm, activeFrom: addMs(timelineStart, 30 * MIN) });

  for (let i = 1; i <= 2; i += 1) {
    const coach = addUser({
      email: `coach${String(i).padStart(2, '0')}.hn@myfit.vn`,
      fullName: `Coach Ha Noi ${i}`,
      roleCode: 'coach',
      branchId: ids.branchHn,
      phoneNumber: `09031${String(i).padStart(5, '0')}`,
      createdAt: addMs(timelineStart, (10 + i) * MIN),
    });

    coaches.push({
      userId: coach.id,
      branchId: ids.branchHn,
      employeeCode: `HN-PT-${String(i).padStart(3, '0')}`,
      hireDate: '2025-11-01',
    });
  }

  for (let i = 1; i <= 2; i += 1) {
    const coach = addUser({
      email: `coach${String(i).padStart(2, '0')}.hcm@myfit.vn`,
      fullName: `Coach HCM ${i}`,
      roleCode: 'coach',
      branchId: ids.branchHcm,
      phoneNumber: `09032${String(i).padStart(5, '0')}`,
      createdAt: addMs(timelineStart, (20 + i) * MIN),
    });

    coaches.push({
      userId: coach.id,
      branchId: ids.branchHcm,
      employeeCode: `HCM-PT-${String(i).padStart(3, '0')}`,
      hireDate: '2025-11-15',
    });
  }

  for (let i = 1; i <= 10; i += 1) {
    const member = addUser({
      email: `member${String(i).padStart(2, '0')}.hn@myfit.vn`,
      fullName: `Member Ha Noi ${i}`,
      roleCode: 'member',
      branchId: ids.branchHn,
      phoneNumber: `09021${String(i).padStart(5, '0')}`,
      createdAt: addMs(timelineStart, (60 + i) * MIN),
    });

    members.push({
      userId: member.id,
      email: member.email,
      fullName: member.fullName,
      branchId: ids.branchHn,
      managerUserId: managerHn.id,
      idx: i,
      city: 'hn',
    });
  }

  for (let i = 1; i <= 10; i += 1) {
    const member = addUser({
      email: `member${String(i).padStart(2, '0')}.hcm@myfit.vn`,
      fullName: `Member HCM ${i}`,
      roleCode: 'member',
      branchId: ids.branchHcm,
      phoneNumber: `09022${String(i).padStart(5, '0')}`,
      createdAt: addMs(timelineStart, (80 + i) * MIN),
    });

    members.push({
      userId: member.id,
      email: member.email,
      fullName: member.fullName,
      branchId: ids.branchHcm,
      managerUserId: managerHcm.id,
      idx: i,
      city: 'hcm',
    });
  }

  for (const m of managers) {
    managerAssignments.push({
      id: makeId(),
      branchId: m.branchId,
      managerUserId: m.userId,
      activeFrom: m.activeFrom,
      activeTo: null,
      createdAt: addMs(timelineStart, 1 * HOUR),
    });
  }

  for (const c of coaches) {
    staffProfiles.push({
      id: makeId(),
      userId: c.userId,
      employeeCode: c.employeeCode,
      jobTitle: 'Personal Trainer',
      primaryBranchId: c.branchId,
      hireDate: c.hireDate,
      status: 'active',
      createdAt: addMs(timelineStart, 1 * HOUR),
      updatedAt: addMs(timelineStart, 1 * HOUR),
    });
  }

  const membershipPlans = [
    {
      id: ids.planBasic,
      code: 'BASIC-12',
      name: 'Basic 12 Sessions',
      price: 1200000,
      durationDays: 30,
      totalSessions: 12,
      isActive: true,
      createdAt: timelineStart,
    },
    {
      id: ids.planPro,
      code: 'PRO-36',
      name: 'Pro 36 Sessions',
      price: 3200000,
      durationDays: 90,
      totalSessions: 36,
      isActive: true,
      createdAt: timelineStart,
    },
    {
      id: ids.planPtStarter,
      code: 'PT-STARTER-10',
      name: 'PT Starter',
      price: 1800000,
      durationDays: 30,
      totalSessions: 10,
      isActive: true,
      createdAt: timelineStart,
    },
  ];

  const ptPackages = [
    { id: ids.ptPkg10, code: 'PTPKG-10', name: 'PT 10 Sessions', price: 2500000, totalSessions: 10, isActive: true, createdAt: addMs(timelineStart, 2 * HOUR) },
    { id: ids.ptPkg20, code: 'PTPKG-20', name: 'PT 20 Sessions', price: 4600000, totalSessions: 20, isActive: true, createdAt: addMs(timelineStart, 2 * HOUR) },
  ];

  const subscriptions = [];
  const subscriptionStatusHistory = [];
  const memberCheckIns = [];

  for (let i = 0; i < members.length; i += 1) {
    const member = members[i];
    const plan = i % 3 === 0 ? membershipPlans[0] : i % 3 === 1 ? membershipPlans[1] : membershipPlans[2];
    const dayOffset = i % 3;
    const startedAt = addMs(timelineStart, dayOffset * DAY + (1 * HOUR) + i * MIN);
    const expiresAt = addMs(startedAt, plan.durationDays * DAY);
    const checkInCount = i % 3 === 0 ? 2 : 1;

    const subscription = {
      id: makeId(),
      userId: member.userId,
      membershipPlanId: plan.id,
      homeBranchId: member.branchId,
      status: 'active',
      startedAt,
      expiresAt,
      totalSessions: plan.totalSessions,
      sessionsUsed: checkInCount,
      sessionsRemaining: plan.totalSessions - checkInCount,
      activatedBy: member.managerUserId,
      activatedAt: startedAt,
    };

    subscriptions.push(subscription);
    member.subscriptionId = subscription.id;
    member.planPrice = plan.price;

    subscriptionStatusHistory.push({
      id: makeId(),
      subscriptionId: subscription.id,
      fromStatus: null,
      toStatus: 'active',
      changedBy: member.managerUserId,
      reason: 'initial_activation',
      createdAt: startedAt,
    });

    for (let j = 0; j < checkInCount; j += 1) {
      const checkInTime = j === 0
        ? addMs(timelineStart, dayOffset * DAY + (2 * HOUR) + (15 + ((i * 3) % 40)) * MIN)
        : addMs(timelineStart, ((dayOffset + 1) % 3) * DAY + (10 * HOUR) + (5 + ((i * 5) % 35)) * MIN);

      memberCheckIns.push({
        id: makeId(),
        userId: member.userId,
        branchId: member.branchId,
        subscriptionId: subscription.id,
        checkInTime,
        createdBy: member.managerUserId,
        createdAt: checkInTime,
      });
    }
  }

  const trialBookings = [];
  const trialStatusHistory = [];
  const trialMembers = [members[0], members[7], members[12], members[2], members[10], members[18], members[3], members[4]];

  for (let i = 0; i < trialMembers.length; i += 1) {
    const member = trialMembers[i];
    const converted = i < 3;
    const scheduledAt = addMs(timelineStart, (i % 3) * DAY + (30 * MIN) + i * 10 * MIN);
    const status = converted ? 'converted' : i % 2 === 0 ? 'attended' : 'confirmed';
    const convertedAt = converted ? addMs(scheduledAt, 2 * HOUR) : null;
    const createdAt = addMs(timelineStart, (i % 3) * DAY + (5 + i * 5) * MIN);

    const trial = {
      id: makeId(),
      guestUserId: member.userId,
      fullName: member.fullName,
      phoneNumber: member.city === 'hn' ? `09013${String(member.idx).padStart(5, '0')}` : `09014${String(member.idx).padStart(5, '0')}`,
      email: member.email,
      branchId: member.branchId,
      trialPlanName: 'Trial Workout 1 Session',
      scheduledAt,
      status,
      notes: 'seed trial booking',
      convertedSubscriptionId: converted ? member.subscriptionId : null,
      convertedAt,
      createdAt,
      updatedAt: convertedAt || addMs(scheduledAt, HOUR),
      changedBy: member.managerUserId,
    };

    trialBookings.push(trial);

    trialStatusHistory.push({
      id: makeId(),
      trialBookingId: trial.id,
      fromStatus: null,
      toStatus: 'booked',
      changedBy: member.managerUserId,
      createdAt,
    });

    trialStatusHistory.push({
      id: makeId(),
      trialBookingId: trial.id,
      fromStatus: 'booked',
      toStatus: status,
      changedBy: member.managerUserId,
      createdAt: convertedAt || addMs(scheduledAt, HOUR),
    });
  }

  const ptSessions = [];
  const membersByBranch = {
    [ids.branchHn]: members.filter((m) => m.branchId === ids.branchHn),
    [ids.branchHcm]: members.filter((m) => m.branchId === ids.branchHcm),
  };

  coaches.forEach((coach, coachIndex) => {
    const branchMembers = membersByBranch[coach.branchId];
    for (let i = 0; i < 4; i += 1) {
      const member = branchMembers[(coachIndex + i) % branchMembers.length];
      const scheduledAt = addMs(timelineStart, ((coachIndex + i) % 3) * DAY + (4 + i * 2) * HOUR + 10 * MIN);
      const status = i < 2 ? 'completed' : 'scheduled';
      const attendedAt = status === 'completed' ? addMs(scheduledAt, HOUR) : null;

      ptSessions.push({
        id: makeId(),
        memberUserId: member.userId,
        trainerUserId: coach.userId,
        ptPackageId: i % 2 === 0 ? ids.ptPkg10 : ids.ptPkg20,
        branchId: coach.branchId,
        scheduledAt,
        status,
        attendedAt,
        notes: 'Seed PT session',
        createdAt: addMs(scheduledAt, -2 * HOUR),
        updatedAt: attendedAt || addMs(scheduledAt, -1 * HOUR),
      });
    }
  });

  const invoices = [];
  const payments = [];
  let invoiceSequence = 1001;

  for (const member of members) {
    const dueDate = addMs(timelineStart, (invoiceSequence % 3) * DAY + 6 * HOUR);
    const processedAt = addMs(dueDate, 4 * HOUR);

    const invoice = {
      id: makeId(),
      invoiceNumber: `INV-SUB-202601-${invoiceSequence}`,
      userId: member.userId,
      branchId: member.branchId,
      totalAmount: member.planPrice,
      status: 'paid',
      dueDate,
      createdAt: addMs(dueDate, -6 * HOUR),
      updatedAt: processedAt,
    };

    invoiceSequence += 1;
    invoices.push(invoice);

    payments.push({
      id: makeId(),
      invoiceId: invoice.id,
      amount: invoice.totalAmount,
      paymentMethod: invoiceSequence % 2 === 0 ? 'transfer' : 'cash',
      status: 'success',
      transactionRef: `TXN${invoiceSequence}SUB`,
      processedAt,
      createdBy: member.managerUserId,
    });
  }

  const ptInvoiceMembers = [members[1], members[5], members[11], members[15]];

  for (let i = 0; i < ptInvoiceMembers.length; i += 1) {
    const member = ptInvoiceMembers[i];
    const ptPackage = i % 2 === 0 ? ptPackages[0] : ptPackages[1];
    const dueDate = addMs(timelineStart, (i % 3) * DAY + 8 * HOUR);
    const processedAt = addMs(dueDate, 4 * HOUR);

    const invoice = {
      id: makeId(),
      invoiceNumber: `INV-PT-202601-${invoiceSequence}`,
      userId: member.userId,
      branchId: member.branchId,
      totalAmount: ptPackage.price,
      status: 'paid',
      dueDate,
      createdAt: addMs(dueDate, -7 * HOUR),
      updatedAt: processedAt,
    };

    invoiceSequence += 1;
    invoices.push(invoice);

    payments.push({
      id: makeId(),
      invoiceId: invoice.id,
      amount: invoice.totalAmount,
      paymentMethod: 'pos',
      status: 'success',
      transactionRef: `TXN${invoiceSequence}PT`,
      processedAt,
      createdBy: member.managerUserId,
    });
  }

  const memberHealthProfiles = [];
  const goals = ['weight_loss', 'muscle_gain', 'fitness'];

  for (let i = 0; i < 14; i += 1) {
    const member = members[i];
    const dateOfBirth = addMs(new Date('1990-01-01T00:00:00+07:00'), i * 420 * DAY);

    memberHealthProfiles.push({
      id: makeId(),
      userId: member.userId,
      dateOfBirth,
      gender: i % 2 === 0 ? 'male' : 'female',
      heightCm: `${150 + ((i * 3) % 36)}.00`,
      primaryGoal: goals[i % goals.length],
      medicalConditions: null,
      createdAt: addMs(timelineStart, 2 * DAY + 12 * HOUR),
      updatedAt: addMs(timelineStart, 2 * DAY + 12 * HOUR),
    });
  }

  const coursePackages = [
    { id: makeId(), code: 'CP-10', name: 'Course Package 10', price: 2000000, totalSessions: 10, isActive: true, createdAt: timelineStart },
  ];

  const courseEnrollments = [];
  members.forEach(member => {
    courseEnrollments.push({
      id: makeId(),
      userId: member.userId,
      coursePackageId: coursePackages[0].id,
      branchId: member.branchId,
      status: 'active',
      enrolledAt: timelineStart,
      startedAt: timelineStart,
      totalSessions: coursePackages[0].totalSessions,
      sessionsAttended: 0,
      sessionsRemaining: coursePackages[0].totalSessions,
      completedAt: null,
      createdBy: member.managerUserId,
      createdAt: timelineStart,
      updatedAt: timelineStart,
    });
  });

  const shifts = [];
  const trainerAssignments = [];
  const classAttendances = [];

  const shiftTimes = [
    { start: 6, end: 7.5 },
    { start: 8, end: 9.5 },
    { start: 10, end: 11.5 },
    { start: 14, end: 15.5 },
    { start: 16, end: 17.5 },
    { start: 17.5, end: 19 },
    { start: 19, end: 20.5 },
    { start: 20.5, end: 22 },
  ];

  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const currentDate = new Date(timelineStart.getTime() + dayOffset * DAY);
    const dateStr = currentDate.toISOString().split('T')[0];

    for (const branch of branches) {
      const branchCoaches = coaches.filter(c => c.branchId === branch.id);
      const branchMembers = members.filter(m => m.branchId === branch.id);
      const branchEnrollments = courseEnrollments.filter(e => e.branchId === branch.id);

      shiftTimes.forEach((time, index) => {
        const startMs = time.start * HOUR;
        const endMs = time.end * HOUR;
        const shiftId = makeId();
        
        const baseDate = new Date(currentDate);
        baseDate.setHours(0,0,0,0);

        const tStart = new Date(currentDate.getTime());
        tStart.setUTCHours(time.start - 7, (time.start % 1) * 60, 0, 0); 
        const tEnd = new Date(currentDate.getTime());
        tEnd.setUTCHours(time.end - 7, (time.end % 1) * 60, 0, 0);

        shifts.push({
          id: shiftId,
          branchId: branch.id,
          shiftCode: `SH-${branch.code}-${dateStr}-${index}`,
          date: dateStr,
          startAt: tStart,
          endAt: tEnd,
          coachCapacity: 1,
          createdAt: timelineStart,
          updatedAt: timelineStart
        });

        const coach = branchCoaches[index % branchCoaches.length];
        if (coach) {
          trainerAssignments.push({
            id: makeId(),
            trainerUserId: coach.userId,
            shiftId,
            branchId: branch.id,
            note: 'Seeded trainer',
            assignedBy: null,
            assignedAt: timelineStart,
            unassignedAt: null,
            createdAt: timelineStart,
            updatedAt: timelineStart
          });
        }

        const numMembers = Math.floor(Math.random() * 6) + 5; 
        const selectedMembers = branchMembers.slice(0, numMembers);
        
        selectedMembers.forEach((member) => {
          const enrollment = branchEnrollments.find(e => e.userId === member.userId);
          classAttendances.push({
            id: makeId(),
            enrollmentId: enrollment ? enrollment.id : null,
            userId: member.userId,
            shiftId,
            branchId: branch.id,
            attendedAt: tStart,
            checkInTime: tStart,
            status: 'attended',
            createdBy: null,
            createdAt: tStart,
            proxyCheckin: false,
            overrideReason: null,
            overrideActor: null
          });
        });
      });
    }
  }

  return {
    roles,
    organization,
    branches,
    users,
    profiles,
    roleAssignments,
    managerAssignments,
    membershipPlans,
    subscriptions,
    subscriptionStatusHistory,
    trialBookings,
    trialStatusHistory,
    staffProfiles,
    memberCheckIns,
    ptPackages,
    ptSessions,
    invoices,
    payments,
    memberHealthProfiles,
    coursePackages,
    courseEnrollments,
    shifts,
    trainerAssignments,
    classAttendances,
    counts: {
      admin: 1,
      managers: managers.length,
      coaches: coaches.length,
      members: members.length,
      convertedTrials: trialBookings.filter((t) => t.status === 'converted').length,
    },
  };
}

async function insertMany(client, table, columns, rows) {
  if (!rows.length) return;

  const values = [];
  const placeholders = rows.map((row, rowIndex) => {
    const rowPlaceholders = row.map((_value, colIndex) => {
      values.push(row[colIndex]);
      return `$${rowIndex * row.length + colIndex + 1}`;
    });
    return `(${rowPlaceholders.join(', ')})`;
  });

  const sql = `insert into ${table} (${columns.join(', ')}) values ${placeholders.join(', ')}`;
  await client.query(sql, values);
}

async function seedDatabase(options = {}) {
  const shouldClosePool = !options.pool;
  const pool = options.pool ?? createPostgresPool(options.connectionString ?? process.env.DATABASE_URL);

  const data = buildSeedData();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      TRUNCATE TABLE
        class_attendance,
        course_enrollments,
        course_packages,
        trainer_assignments,
        shifts,
        payments,
        invoices,
        pt_sessions,
        pt_packages,
        member_check_ins,
        trial_status_history,
        trial_bookings,
        subscription_status_history,
        subscriptions,
        staff_profiles,
        branch_manager_assignments,
        user_role_assignments,
        profiles,
        users,
        membership_plans,
        branches,
        organizations,
        roles
      RESTART IDENTITY CASCADE
    `);

    await insertMany(
      client,
      'roles',
      ['id', 'code', 'name'],
      data.roles.map((r) => [r.id, r.code, r.name])
    );

    await insertMany(
      client,
      'organizations',
      ['id', 'name', 'tax_id', 'created_at', 'updated_at'],
      [[data.organization.id, data.organization.name, data.organization.taxId, data.organization.createdAt, data.organization.updatedAt]]
    );

    await insertMany(
      client,
      'branches',
      ['id', 'organization_id', 'code', 'name', 'address', 'phone_number', 'status', 'created_at', 'updated_at'],
      data.branches.map((b) => [b.id, b.organizationId, b.code, b.name, b.address, b.phoneNumber, b.status, b.createdAt, b.updatedAt])
    );

    await insertMany(
      client,
      'membership_plans',
      ['id', 'code', 'name', 'price', 'duration_days', 'total_sessions', 'is_active', 'created_at'],
      data.membershipPlans.map((p) => [p.id, p.code, p.name, p.price, p.durationDays, p.totalSessions, p.isActive, p.createdAt])
    );

    await insertMany(
      client,
      'users',
      ['id', 'email', 'password_hash', 'status', 'email_verified_at', 'created_at', 'updated_at'],
      data.users.map((u) => [u.id, u.email, u.passwordHash, u.status, u.emailVerifiedAt, u.createdAt, u.updatedAt])
    );

    await insertMany(
      client,
      'profiles',
      ['id', 'user_id', 'full_name', 'created_at', 'updated_at'],
      data.profiles.map((p) => [p.id, p.userId, p.fullName, p.createdAt, p.updatedAt])
    );

    await insertMany(
      client,
      'user_role_assignments',
      ['id', 'user_id', 'role_id', 'branch_id', 'assigned_at'],
      data.roleAssignments.map((a) => [a.id, a.userId, a.roleId, a.branchId, a.assignedAt])
    );

    await insertMany(
      client,
      'branch_manager_assignments',
      ['id', 'branch_id', 'manager_user_id', 'active_from', 'active_to', 'created_at'],
      data.managerAssignments.map((a) => [a.id, a.branchId, a.managerUserId, a.activeFrom, a.activeTo, a.createdAt])
    );

    await insertMany(
      client,
      'staff_profiles',
      ['id', 'user_id', 'employee_code', 'job_title', 'primary_branch_id', 'hire_date', 'status', 'created_at', 'updated_at'],
      data.staffProfiles.map((s) => [s.id, s.userId, s.employeeCode, s.jobTitle, s.primaryBranchId, s.hireDate, s.status, s.createdAt, s.updatedAt])
    );

    await insertMany(
      client,
      'subscriptions',
      ['id', 'user_id', 'membership_plan_id', 'home_branch_id', 'status', 'started_at', 'expires_at', 'total_sessions', 'sessions_used', 'sessions_remaining', 'activated_by', 'activated_at'],
      data.subscriptions.map((s) => [
        s.id,
        s.userId,
        s.membershipPlanId,
        s.homeBranchId,
        s.status,
        s.startedAt,
        s.expiresAt,
        s.totalSessions,
        s.sessionsUsed,
        s.sessionsRemaining,
        s.activatedBy,
        s.activatedAt,
      ])
    );

    await insertMany(
      client,
      'subscription_status_history',
      ['id', 'subscription_id', 'from_status', 'to_status', 'changed_by', 'reason', 'created_at'],
      data.subscriptionStatusHistory.map((h) => [h.id, h.subscriptionId, h.fromStatus, h.toStatus, h.changedBy, h.reason, h.createdAt])
    );

    await insertMany(
      client,
      'trial_bookings',
      ['id', 'guest_user_id', 'full_name', 'phone_number', 'email', 'branch_id', 'trial_plan_name', 'scheduled_at', 'status', 'notes', 'converted_subscription_id', 'converted_at', 'created_at', 'updated_at'],
      data.trialBookings.map((t) => [
        t.id,
        t.guestUserId,
        t.fullName,
        t.phoneNumber,
        t.email,
        t.branchId,
        t.trialPlanName,
        t.scheduledAt,
        t.status,
        t.notes,
        t.convertedSubscriptionId,
        t.convertedAt,
        t.createdAt,
        t.updatedAt,
      ])
    );

    await insertMany(
      client,
      'trial_status_history',
      ['id', 'trial_booking_id', 'from_status', 'to_status', 'changed_by', 'created_at'],
      data.trialStatusHistory.map((h) => [h.id, h.trialBookingId, h.fromStatus, h.toStatus, h.changedBy, h.createdAt])
    );

    await insertMany(
      client,
      'member_check_ins',
      ['id', 'user_id', 'branch_id', 'subscription_id', 'check_in_time', 'created_by', 'created_at'],
      data.memberCheckIns.map((c) => [c.id, c.userId, c.branchId, c.subscriptionId, c.checkInTime, c.createdBy, c.createdAt])
    );

    await insertMany(
      client,
      'pt_packages',
      ['id', 'code', 'name', 'price', 'total_sessions', 'is_active', 'created_at'],
      data.ptPackages.map((p) => [p.id, p.code, p.name, p.price, p.totalSessions, p.isActive, p.createdAt])
    );

    await insertMany(
      client,
      'pt_sessions',
      ['id', 'member_user_id', 'trainer_user_id', 'pt_package_id', 'branch_id', 'scheduled_at', 'status', 'attended_at', 'notes', 'created_at', 'updated_at'],
      data.ptSessions.map((s) => [
        s.id,
        s.memberUserId,
        s.trainerUserId,
        s.ptPackageId,
        s.branchId,
        s.scheduledAt,
        s.status,
        s.attendedAt,
        s.notes,
        s.createdAt,
        s.updatedAt,
      ])
    );

    await insertMany(
      client,
      'invoices',
      ['id', 'invoice_number', 'user_id', 'branch_id', 'total_amount', 'status', 'due_date', 'created_at', 'updated_at'],
      data.invoices.map((i) => [i.id, i.invoiceNumber, i.userId, i.branchId, i.totalAmount, i.status, i.dueDate, i.createdAt, i.updatedAt])
    );

    await insertMany(
      client,
      'payments',
      ['id', 'invoice_id', 'amount', 'payment_method', 'status', 'transaction_ref', 'processed_at', 'created_by'],
      data.payments.map((p) => [p.id, p.invoiceId, p.amount, p.paymentMethod, p.status, p.transactionRef, p.processedAt, p.createdBy])
    );

    await insertMany(
      client,
      'member_health_profiles',
      ['id', 'user_id', 'date_of_birth', 'gender', 'height_cm', 'primary_goal', 'medical_conditions', 'created_at', 'updated_at'],
      data.memberHealthProfiles.map((h) => [h.id, h.userId, h.dateOfBirth, h.gender, h.heightCm, h.primaryGoal, h.medicalConditions, h.createdAt, h.updatedAt])
    );

    await insertMany(
      client,
      'course_packages',
      ['id', 'code', 'name', 'price', 'total_sessions', 'is_active', 'created_at'],
      data.coursePackages.map(p => [p.id, p.code, p.name, p.price, p.totalSessions, p.isActive, p.createdAt])
    );

    await insertMany(
      client,
      'course_enrollments',
      ['id', 'user_id', 'course_package_id', 'branch_id', 'status', 'enrolled_at', 'started_at', 'total_sessions', 'sessions_attended', 'sessions_remaining', 'completed_at', 'created_by', 'created_at', 'updated_at'],
      data.courseEnrollments.map(e => [e.id, e.userId, e.coursePackageId, e.branchId, e.status, e.enrolledAt, e.startedAt, e.totalSessions, e.sessionsAttended, e.sessionsRemaining, e.completedAt, e.createdBy, e.createdAt, e.updatedAt])
    );

    await insertMany(
      client,
      'shifts',
      ['id', 'branch_id', 'shift_code', 'date', 'start_at', 'end_at', 'coach_capacity', 'created_at', 'updated_at'],
      data.shifts.map(s => [s.id, s.branchId, s.shiftCode, s.date, s.startAt, s.endAt, s.coachCapacity, s.createdAt, s.updatedAt])
    );

    await insertMany(
      client,
      'trainer_assignments',
      ['id', 'trainer_user_id', 'shift_id', 'branch_id', 'note', 'assigned_by', 'assigned_at', 'unassigned_at', 'created_at', 'updated_at'],
      data.trainerAssignments.map(t => [t.id, t.trainerUserId, t.shiftId, t.branchId, t.note, t.assignedBy, t.assignedAt, t.unassignedAt, t.createdAt, t.updatedAt])
    );

    await insertMany(
      client,
      'class_attendance',
      ['id', 'enrollment_id', 'user_id', 'shift_id', 'branch_id', 'attended_at', 'check_in_time', 'status', 'created_by', 'created_at', 'proxy_checkin', 'override_reason', 'override_actor'],
      data.classAttendances.map(c => [c.id, c.enrollmentId, c.userId, c.shiftId, c.branchId, c.attendedAt, c.checkInTime, c.status, c.createdBy, c.createdAt, c.proxyCheckin, c.overrideReason, c.overrideActor])
    );

    await client.query('COMMIT');

    return {
      ok: true,
      ...data.counts,
      subscriptions: data.subscriptions.length,
      checkIns: data.memberCheckIns.length,
      ptSessions: data.ptSessions.length,
      invoices: data.invoices.length,
      payments: data.payments.length,
      healthProfiles: data.memberHealthProfiles.length,
      shifts: data.shifts.length,
      classAttendances: data.classAttendances.length,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    if (shouldClosePool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  seedDatabase()
    .then((result) => {
      process.stdout.write(`Database seed completed: ${JSON.stringify(result)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}

module.exports = { seedDatabase };
