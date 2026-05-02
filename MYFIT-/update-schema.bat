@echo off
echo ====================================
echo MYFIT Schema Update Workflow
echo ====================================
echo.
echo This script will:
echo   1. Run migration 004 on local database
echo   2. Test key features
echo   3. Export updated schema.sql
echo   4. Prepare git commit
echo.
pause

set PGPASSWORD=postgres

echo.
echo [Step 1/4] Running migration 004...
echo ====================================
psql -U postgres -d myfit -f src\db\migrations\004_add_auto_session_decrement_and_optimizations.sql
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Migration failed! Please fix errors first.
    pause
    exit /b 1
)
echo ✅ Migration 004 completed successfully
echo.

echo [Step 2/4] Running verification tests...
echo ====================================
echo.

echo Test 1: Check triggers exist...
psql -U postgres -d myfit -c "SELECT COUNT(*) as trigger_count FROM information_schema.triggers WHERE trigger_name LIKE 'trg_%%';"
echo.

echo Test 2: Check materialized views exist...
psql -U postgres -d myfit -c "SELECT matviewname FROM pg_matviews WHERE schemaname = 'public';"
echo.

echo Test 3: Check session_price_at_registration column...
psql -U postgres -d myfit -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'course_enrollments' AND column_name = 'session_price_at_registration';"
echo.

echo Test 4: Check coach capacity constraint...
psql -U postgres -d myfit -c "SELECT conname FROM pg_constraint WHERE conrelid = 'shifts'::regclass AND contype = 'c';"
echo.

echo [Step 3/4] Exporting updated schema.sql...
echo ====================================
pg_dump -U postgres -d myfit --schema-only --no-owner --no-privileges > src\db\schema.sql
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Schema export failed!
    pause
    exit /b 1
)
echo ✅ Schema exported to src/db/schema.sql
echo.

echo [Step 4/4] Preparing git commit...
echo ====================================
git add src/db/migrations/004_add_auto_session_decrement_and_optimizations.sql
git add src/db/schema.sql
git status
echo.

echo ====================================
echo ✅ All steps completed!
echo ====================================
echo.
echo Next steps:
echo   1. Review the changes with: git diff --cached
echo   2. Commit with: git commit -m "feat: add auto-decrement trigger + update schema"
echo   3. Push to remote: git push
echo.
echo Documentation files to review:
echo   - MIGRATION_004_GUIDE.md
echo   - AUTO_SESSION_DECREMENT_COMPLETE.md
echo   - MIGRATIONS_README.md
echo.
pause
