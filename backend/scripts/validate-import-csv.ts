const fs = require('node:fs/promises') as typeof import('node:fs/promises');
const path = require('node:path') as typeof import('node:path');

type Row = Record<string, string>;
type Spec = {
  fileName: string;
  requiredColumns: string[];
  optionalColumns?: string[];
  uniqueBy?: string[];
  validators?: Array<(row: Row, ctx: ValidationContext, rowNumber: number) => void>;
};

type ValidationContext = {
  baseDir: string;
  files: Record<string, Row[]>;
  warnings: string[];
  errors: string[];
  now: Date;
};

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const specs: Spec[] = [
  {
    fileName: 'branches.csv',
    requiredColumns: ['branch_code', 'branch_name', 'address', 'status'],
    optionalColumns: ['phone_number'],
    uniqueBy: ['branch_code'],
    validators: [
      (row, ctx, rowNumber) => {
        if (!['ACTIVE', 'INACTIVE'].includes(row.status)) {
          pushError(ctx, `branches.csv row ${rowNumber}: invalid status "${row.status}"`);
        }
      },
    ],
  },
  {
    fileName: 'users.csv',
    requiredColumns: ['email', 'full_name', 'status', 'primary_role'],
    optionalColumns: ['home_branch_code'],
    uniqueBy: ['email'],
    validators: [
      (row, ctx, rowNumber) => {
        if (!isEmail(row.email)) {
          pushError(ctx, `users.csv row ${rowNumber}: invalid email "${row.email}"`);
        }
        if (!['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(row.status)) {
          pushError(ctx, `users.csv row ${rowNumber}: invalid status "${row.status}"`);
        }
        if (!['ADMIN', 'MANAGER', 'MEMBER', 'GUEST'].includes(row.primary_role)) {
          pushError(ctx, `users.csv row ${rowNumber}: invalid primary_role "${row.primary_role}"`);
        }
        if (row.home_branch_code && !lookupBy(ctx.files['branches.csv'], 'branch_code', row.home_branch_code)) {
          pushError(ctx, `users.csv row ${rowNumber}: unknown home_branch_code "${row.home_branch_code}"`);
        }
        if (row.primary_role === 'MANAGER' && !row.home_branch_code) {
          pushError(ctx, `users.csv row ${rowNumber}: manager must have home_branch_code`);
        }
        if (row.primary_role === 'MEMBER' && !row.home_branch_code) {
          pushWarning(ctx, `users.csv row ${rowNumber}: member should have home_branch_code`);
        }
      },
    ],
  },
  {
    fileName: 'membership-plans.csv',
    requiredColumns: ['plan_code', 'plan_name', 'price', 'duration_days', 'total_sessions', 'is_active'],
    uniqueBy: ['plan_code'],
    validators: [
      (row, ctx, rowNumber) => {
        if (!isNonNegativeInteger(row.price)) {
          pushError(ctx, `membership-plans.csv row ${rowNumber}: invalid price "${row.price}"`);
        }
        if (!isPositiveInteger(row.duration_days)) {
          pushError(ctx, `membership-plans.csv row ${rowNumber}: invalid duration_days "${row.duration_days}"`);
        }
        if (!isPositiveInteger(row.total_sessions)) {
          pushError(ctx, `membership-plans.csv row ${rowNumber}: invalid total_sessions "${row.total_sessions}"`);
        }
        if (!['true', 'false'].includes(row.is_active.toLowerCase())) {
          pushError(ctx, `membership-plans.csv row ${rowNumber}: invalid is_active "${row.is_active}"`);
        }
      },
    ],
  },
  {
    fileName: 'trial-bookings.csv',
    requiredColumns: ['external_id', 'user_email', 'branch_code', 'membership_plan_code', 'trial_plan_name', 'scheduled_at', 'status', 'phone_number'],
    optionalColumns: ['notes'],
    uniqueBy: ['external_id'],
    validators: [
      (row, ctx, rowNumber) => {
        if (!lookupBy(ctx.files['users.csv'], 'email', row.user_email)) {
          pushError(ctx, `trial-bookings.csv row ${rowNumber}: unknown user_email "${row.user_email}"`);
        }
        if (!lookupBy(ctx.files['branches.csv'], 'branch_code', row.branch_code)) {
          pushError(ctx, `trial-bookings.csv row ${rowNumber}: unknown branch_code "${row.branch_code}"`);
        }
        if (!lookupBy(ctx.files['membership-plans.csv'], 'plan_code', row.membership_plan_code)) {
          pushError(ctx, `trial-bookings.csv row ${rowNumber}: unknown membership_plan_code "${row.membership_plan_code}"`);
        }
        if (!isIsoDate(row.scheduled_at)) {
          pushError(ctx, `trial-bookings.csv row ${rowNumber}: invalid scheduled_at "${row.scheduled_at}"`);
        }
        if (!['BOOKED', 'ATTENDED', 'CANCELLED', 'CONVERTED', 'NO_SHOW'].includes(row.status)) {
          pushError(ctx, `trial-bookings.csv row ${rowNumber}: invalid status "${row.status}"`);
        }
        if (row.status === 'BOOKED' && isIsoDate(row.scheduled_at)) {
          const scheduledAt = new Date(row.scheduled_at);
          if (scheduledAt.getTime() < ctx.now.getTime()) {
            pushError(ctx, `trial-bookings.csv row ${rowNumber}: scheduled_at cannot be in the past when status is BOOKED`);
          }
        }
      },
    ],
  },
];

function color(name: keyof typeof COLORS, value: string): string {
  return `${COLORS[name]}${value}${COLORS.reset}`;
}

function pushError(ctx: ValidationContext, message: string): void {
  ctx.errors.push(message);
}

function pushWarning(ctx: ValidationContext, message: string): void {
  ctx.warnings.push(message);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isIsoDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function isPositiveInteger(value: string): boolean {
  return /^\d+$/.test(value) && Number(value) > 0;
}

function isNonNegativeInteger(value: string): boolean {
  return /^\d+$/.test(value) && Number(value) >= 0;
}

function lookupBy(rows: Row[] | undefined, key: string, value: string): Row | undefined {
  return rows?.find((row) => row[key] === value);
}

function parseArgs(): { baseDir: string } {
  const args = process.argv.slice(2);
  const dirFlagIndex = args.findIndex((item) => item === '--dir');
  if (dirFlagIndex >= 0 && args[dirFlagIndex + 1]) {
    return { baseDir: path.resolve(process.cwd(), args[dirFlagIndex + 1]) };
  }
  return { baseDir: path.resolve(process.cwd(), 'docs', 'import-templates') };
}

function parseCsv(content: string): Row[] {
  const rows: string[][] = [];
  let currentField = '';
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (!rows.length) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((cells) => {
    const record: Row = {};
    headers.forEach((header, index) => {
      record[header] = String(cells[index] ?? '').trim();
    });
    return record;
  });
}

async function validateSpec(spec: Spec, ctx: ValidationContext): Promise<void> {
  const filePath = path.join(ctx.baseDir, spec.fileName);
  let content = '';
  try {
    content = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    pushError(ctx, `${spec.fileName}: file not found`);
    return;
  }

  const parsedRows = parseCsv(content);
  ctx.files[spec.fileName] = parsedRows;

  const firstLine = content.split(/\r?\n/, 1)[0] ?? '';
  const headers = firstLine.split(',').map((item) => item.trim());
  const allowed = new Set([...spec.requiredColumns, ...(spec.optionalColumns ?? [])]);

  for (const required of spec.requiredColumns) {
    if (!headers.includes(required)) {
      pushError(ctx, `${spec.fileName}: missing required column "${required}"`);
    }
  }

  for (const header of headers) {
    if (header && !allowed.has(header)) {
      pushWarning(ctx, `${spec.fileName}: extra column "${header}" is not in template contract`);
    }
  }

  if (!parsedRows.length) {
    pushWarning(ctx, `${spec.fileName}: no data rows found`);
  }

  if (spec.uniqueBy?.length) {
    const seen = new Set<string>();
    parsedRows.forEach((row, index) => {
      const key = spec.uniqueBy!.map((column) => row[column] ?? '').join('::');
      if (seen.has(key)) {
        pushError(ctx, `${spec.fileName} row ${index + 2}: duplicate natural key "${key}"`);
      }
      seen.add(key);
    });
  }

  parsedRows.forEach((row, index) => {
    const rowNumber = index + 2;
    spec.requiredColumns.forEach((column) => {
      if (!row[column]) {
        pushError(ctx, `${spec.fileName} row ${rowNumber}: required field "${column}" is empty`);
      }
    });
    spec.validators?.forEach((validator) => validator(row, ctx, rowNumber));
  });
}

async function main(): Promise<void> {
  const { baseDir } = parseArgs();
  const ctx: ValidationContext = {
    baseDir,
    files: {},
    warnings: [],
    errors: [],
    now: new Date(),
  };

  process.stdout.write(`${color('cyan', 'CSV Import Validator')}\n`);
  process.stdout.write(`Directory: ${baseDir}\n\n`);

  for (const spec of specs) {
    await validateSpec(spec, ctx);
  }

  if (ctx.warnings.length) {
    for (const warning of ctx.warnings) {
      process.stdout.write(`${color('yellow', '⚠️')} ${warning}\n`);
    }
  }

  if (ctx.errors.length) {
    for (const error of ctx.errors) {
      process.stdout.write(`${color('red', '❌')} ${error}\n`);
    }
    process.stdout.write(`\n${color('red', `Validation failed with ${ctx.errors.length} error(s)`)}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${color('green', '✅')} CSV templates validated successfully\n`);
  if (ctx.warnings.length) {
    process.stdout.write(`${color('yellow', `⚠️ Completed with ${ctx.warnings.length} warning(s)`)}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${color('red', '❌ CSV validator crashed')}\n`);
  process.stderr.write(`${String(error?.stack ?? error?.message ?? error)}\n`);
  process.exitCode = 1;
});
