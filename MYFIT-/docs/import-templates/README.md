# CSV Import Templates

Bo file nay dung de team map du lieu that vao format on dinh truoc khi viet import job.

## Files

- `branches.csv`
- `users.csv`
- `membership-plans.csv`
- `trial-bookings.csv`

## Validation goals

- Dung ten cot
- Co du required columns
- Khong duplicate natural keys
- Enum values hop le
- Reference cheo hop le:
  - `users.home_branch_code` -> `branches.branch_code`
  - `trial-bookings.branch_code` -> `branches.branch_code`
  - `trial-bookings.user_email` -> `users.email`
  - `trial-bookings.membership_plan_code` -> `membership-plans.plan_code`
- Rule nghiep vu bo sung:
  - `MANAGER` bat buoc phai co `home_branch_code`
  - `MEMBER` khong nen thieu `home_branch_code` (warning)
  - `trial-bookings.status=BOOKED` thi `scheduled_at` khong duoc nam trong qua khu

## Run validator

Validate bo template mac dinh:

```powershell
npm run validate:import
```

Validate 1 thu muc khac:

```powershell
node --experimental-strip-types scripts/validate-import-csv.ts --dir path\to\csv-folder
```

## Import vao PostgreSQL

Yeu cau:

- Set `DATABASE_URL`
- Da chay `npm run validate:import` truoc

PowerShell:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myfit"
$env:IMPORTED_USER_PASSWORD="ChangeMe123!"
npm run import:csv
```

Import tu folder CSV khac:

```powershell
node --experimental-strip-types scripts/import-csv-to-postgres.ts --dir path\to\csv-folder
```

## Notes

- File CSV phai co header o dong dau tien.
- UTF-8 duoc khuyen nghi.
- Validator co ho tro quoted CSV co dau phay trong field.
- Mot so cot la optional, nhung neu co gia tri thi van bi validate.
- Importer se upsert theo natural key/declarative id de an toan khi chay lai.
- User import vao he thong se duoc gan mat khau tam tu `IMPORTED_USER_PASSWORD` hoac mac dinh `ChangeMe123!`.
