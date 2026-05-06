# MYFIT Database Development Workflow

## 📋 Standard Workflow for Schema Changes

Quy trình chuẩn để thay đổi database schema trong dự án MYFIT.

---

## 🔄 The Complete Workflow

### Phase 1: Development (Local)

```bash
# 1. Tạo migration file mới
src/db/migrations/005_your_change.sql

# 2. Chạy migration trên local
psql -U postgres -d myfit -f src/db/migrations/005_your_change.sql

# 3. Test thoroughly
# - Test new features work
# - Test rollback works
# - Check performance

# 4. Export schema mới nhất
pg_dump -U postgres -d myfit \
  --schema-only \
  --no-owner \
  --no-privileges \
  > src/db/schema.sql

# 5. Commit cả migration và schema
git add src/db/migrations/005_*.sql
git add src/db/schema.sql
git commit -m "feat: description of your change"
```

---

### Phase 2: Code Review

```bash
# Reviewer checklist:
# ✓ Migration is idempotent (can run multiple times safely)
# ✓ Rollback script exists and works
# ✓ No data loss scenarios
# ✓ Performance impact documented
# ✓ Backwards compatible with existing code
```

---

### Phase 3: Staging Deployment

```bash
# 1. Backup staging database
pg_dump -U postgres -d myfit-staging > backup_before_005.sql

# 2. Run migration on staging
psql -U postgres -d myfit-staging -f src/db/migrations/005_your_change.sql

# 3. Verify on staging
# - Run application tests
# - Check logs for errors
# - Monitor performance

# 4. If issues found → rollback
psql -U postgres -d myfit-staging -f src/db/migrations/rollback_005.sql
```

---

### Phase 4: Production Deployment

```bash
# 1. Schedule maintenance window (if needed)
# 2. Notify users (if downtime required)
# 3. Backup production database
pg_dump -U postgres -d myfit-production > backup_prod_$(date +%Y%m%d).sql

# 4. Run migration during low-traffic period
psql -U postgres -d myfit-production -f src/db/migrations/005_your_change.sql

# 5. Verify immediately
psql -U postgres -d myfit-production -c "SELECT count(*) FROM information_schema.triggers WHERE trigger_name LIKE 'trg_%';"

# 6. Monitor for 24-48 hours
# - Check error logs
# - Monitor query performance
# - Watch for unexpected behavior
```

---

## 🚀 Quick Start: Using the Automated Script

For local development, use the provided batch script:

```bash
# Windows
update-schema.bat

# This will:
# 1. Run migration 004
# 2. Run verification tests
# 3. Export updated schema.sql
# 4. Stage files for git commit
# 5. Show next steps
```

---

## 📝 Migration File Naming Convention

Format: `NNN_descriptive_name.sql`

Examples:
- ✅ `004_add_auto_session_decrement_and_optimizations.sql`
- ✅ `005_add_payment_methods.sql`
- ❌ `add_new_column.sql` (missing number)
- ❌ `004_stuff.sql` (not descriptive)

**Rules:**
- 3-digit sequential number (001, 002, 003...)
- Lowercase with underscores
- Descriptive but concise (max 80 chars)
- Prefix with action verb (add, create, alter, drop, etc.)

---

## 🔧 Common Migration Patterns

### Pattern 1: Add Column with Default

```sql
-- Safe: Add nullable column first
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number text null;

-- Backfill existing rows
UPDATE users SET phone_number = 'N/A' WHERE phone_number IS NULL;

-- Then make NOT NULL if needed
ALTER TABLE users ALTER COLUMN phone_number SET NOT NULL;
```

### Pattern 2: Create Index Concurrently (Production-safe)

```sql
-- For large tables, use CONCURRENTLY to avoid locking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
  ON users (email);
```

### Pattern 3: Add Trigger Safely

```sql
-- Drop first in case re-running migration
DROP TRIGGER IF EXISTS trg_my_trigger ON my_table;

CREATE TRIGGER trg_my_trigger
AFTER INSERT ON my_table
FOR EACH ROW
EXECUTE FUNCTION my_function();
```

### Pattern 4: Create Materialized View

```sql
DROP MATERIALIZED VIEW IF EXISTS my_view;

CREATE MATERIALIZED VIEW my_view AS
SELECT ...
WITH DATA;

-- Add indexes for performance
CREATE INDEX idx_my_view_id ON my_view (id);
```

---

## ⚠️ Dangerous Operations (Avoid These!)

### ❌ DON'T: Drop Column Without Backup

```sql
-- DANGEROUS: Data loss!
ALTER TABLE users DROP COLUMN important_data;
```

### ✅ DO: Soft Delete Instead

```sql
-- Safer: Mark as deleted
ALTER TABLE users ADD COLUMN deleted_at timestamptz null;
UPDATE users SET deleted_at = NOW() WHERE ...;
```

---

### ❌ DON'T: Change Column Type Directly

```sql
-- DANGEROUS: May fail or lose data
ALTER TABLE users ALTER COLUMN user_id TYPE integer;
```

### ✅ DO: Create New Column and Migrate

```sql
-- Safe approach
ALTER TABLE users ADD COLUMN user_id_new integer;
UPDATE users SET user_id_new = user_id::integer;
ALTER TABLE users DROP COLUMN user_id;
ALTER TABLE users RENAME COLUMN user_id_new TO user_id;
```

---

## 🧪 Testing Checklist

Before committing any migration:

### Functional Tests
- [ ] Migration runs without errors
- [ ] Rollback runs without errors
- [ ] Can run migration twice (idempotent)
- [ ] New features work as expected
- [ ] Existing features still work

### Data Integrity Tests
- [ ] No data loss occurs
- [ ] Foreign keys are valid
- [ ] Constraints work correctly
- [ ] Triggers fire when expected
- [ ] Default values are correct

### Performance Tests
- [ ] Query performance not degraded
- [ ] Indexes are effective
- [ ] Materialized views refresh quickly
- [ ] No lock contention issues

### Edge Cases
- [ ] Works with empty tables
- [ ] Works with large tables (1M+ rows)
- [ ] Handles NULL values correctly
- [ ] Handles concurrent operations
- [ ] Error messages are clear

---

## 📊 Migration Status Tracking

Create a tracking table (optional):

```sql
CREATE TABLE IF NOT EXISTS migration_history (
  id serial primary key,
  migration_file text unique not null,
  applied_at timestamptz not null default now(),
  success boolean not null,
  execution_time_ms integer,
  applied_by text not null
);

-- Log each migration
INSERT INTO migration_history (migration_file, success, execution_time_ms, applied_by)
VALUES ('004_add_auto_decrement.sql', true, 1234, 'developer_name');
```

---

## 🔄 Branching Strategy

### Feature Branch Workflow

```bash
# 1. Create feature branch
git checkout -b feature/add-payment-method

# 2. Create migration
# src/db/migrations/005_add_payment_methods.sql

# 3. Test locally
./update-schema.bat

# 4. Commit
git commit -m "feat: add payment methods table"

# 5. Push and create PR
git push origin feature/add-payment-method

# 6. After review, merge to main
git checkout main
git merge feature/add-payment-method
```

---

## 🐛 Troubleshooting

### Issue: Migration partially applied

```sql
-- Check what was applied
SELECT * FROM information_schema.columns 
WHERE table_name = 'your_table';

-- Manually rollback if needed
ROLLBACK; -- if in transaction
-- Or manually undo changes
```

### Issue: Schema.sql out of sync

```bash
# Re-export from database
pg_dump -U postgres -d myfit --schema-only > src/db/schema.sql

# Or regenerate from migrations
psql -U postgres -d myfit < src/db/schema.sql
```

### Issue: Lock timeout on production

```sql
-- Check for locks
SELECT * FROM pg_locks WHERE granted = false;

-- Kill blocking queries (carefully!)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'active' AND query_start < now() - interval '5 minutes';
```

---

## 📚 Additional Resources

- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Migration Best Practices:** https://www.prisma.io/dataguide/types/relational/database-migration-best-practices
- **Safe Operations:** https://github.com/ankane/strong_migrations

---

## ✅ Quick Reference Commands

```bash
# Run single migration
psql -U postgres -d myfit -f src/db/migrations/004_file.sql

# Run all pending migrations
./run-migrations.bat

# Export current schema
pg_dump -U postgres -d myfit --schema-only > src/db/schema.sql

# Check migration status
psql -U postgres -d myfit -c "\dt"  # List tables
psql -U postgres -d myfit -c "\di"  # List indexes
psql -U postgres -d myfit -c "\dv"  # List views
psql -U postgres -d myfit -c "\dm"  # List materialized views

# Backup database
pg_dump -U postgres -d myfit > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U postgres -d myfit < backup_20260425.sql
```

---

**Last Updated:** 2026-04-25  
**Current Migration:** 004  
**Workflow Version:** 1.0
