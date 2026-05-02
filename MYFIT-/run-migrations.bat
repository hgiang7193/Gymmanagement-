@echo off
echo ====================================
echo Running MYFIT Database Migrations
echo ====================================
echo.

set PGPASSWORD=postgres

echo [1/4] Running migration 002...
psql -U postgres -d myfit -f src\db\migrations\002_create_shifts_and_trainer_assignments.sql
if %ERRORLEVEL% EQU 0 (
    echo ✅ Migration 002 completed
) else (
    echo ❌ Migration 002 failed
    pause
    exit /b 1
)
echo.

echo [2/4] Running migration 003...
psql -U postgres -d myfit -f src\db\migrations\003_add_course_enrollments_and_locking.sql
if %ERRORLEVEL% EQU 0 (
    echo ✅ Migration 003 completed
) else (
    echo ❌ Migration 003 failed
    pause
    exit /b 1
)
echo.

echo [3/4] Running migration 004 (Auto Session Decrement & Optimizations)...
psql -U postgres -d myfit -f src\db\migrations\004_add_auto_session_decrement_and_optimizations.sql
if %ERRORLEVEL% EQU 0 (
    echo ✅ Migration 004 completed
) else (
    echo ❌ Migration 004 failed
    pause
    exit /b 1
)
echo.

echo [4/4] Seeding course packages...
psql -U postgres -d myfit -f src\db\seed-course-packages.sql
if %ERRORLEVEL% EQU 0 (
    echo ✅ Course packages seeded
) else (
    echo ❌ Seeding failed
    pause
    exit /b 1
)
echo.

echo ====================================
echo ✅ All migrations completed!
echo ====================================
echo.
echo New features in Migration 004:
echo   - Auto-decrement sessions on check-in
echo   - Price snapshot for financial accuracy
echo   - Coach capacity constraints (1-3)
echo   - Real-time dashboard materialized views
echo   - Automatic measurement locking
echo.
echo See MIGRATION_004_GUIDE.md for details
echo ====================================
pause
