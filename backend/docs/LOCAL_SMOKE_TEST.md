# Local DB Smoke Test

Tai lieu nay dung de chay backend MYFIT tren PostgreSQL local va verify end-to-end nhanh.

## 1. Tao file env

Copy `.env.example` thanh `.env`.

Gia tri local mac dinh da khop voi `docker-compose.yml`:

```env
POSTGRES_DB=myfit
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgres://postgres:postgres@localhost:5432/myfit
ACCESS_TOKEN_SECRET=change-me-access-secret
REFRESH_TOKEN_SECRET=change-me-refresh-secret
PORT=3000
HOST=127.0.0.1
```

## 2. Kiem tra runtime env

Chi check env:

```powershell
npm run runtime:check
```

Check ca env + database/schema:

```powershell
node scripts/check-runtime-env.js --with-db
```

Neu DB chua len, script se bao ro can chay `npm run db:up`.

## 3. Khoi dong PostgreSQL local

```powershell
npm run db:up
```

Neu can xem log:

```powershell
npm run db:logs
```

## 4. Bootstrap schema va seed data

```powershell
npm run db:bootstrap
npm run db:seed
```

## 5. Import CSV that (neu can)

```powershell
npm run validate:import
npm run import:csv
```

## 6. Start backend

```powershell
npm start
```

Neu DB chua san sang, app se fail som voi startup preflight message de doc.

## 7. Chay smoke test end-to-end

```powershell
node --experimental-strip-types scripts/smoke-test-trial-booking.ts --dry-run
npm run test:smoke
```

`--dry-run` se verify env + connectivity truoc.

## 8. Workflow nhanh nhat

```powershell
npm run db:up
npm run db:bootstrap
npm run db:seed
npm start
```

Sau do mo terminal moi:

```powershell
npm run test:smoke
```

## 9. Dung local DB

```powershell
npm run db:down
```
