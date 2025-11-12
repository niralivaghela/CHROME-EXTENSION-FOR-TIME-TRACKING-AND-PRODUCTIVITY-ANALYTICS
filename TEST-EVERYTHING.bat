@echo off
echo ========================================
echo    TESTING TIME TRACKER SYSTEM
echo ========================================
echo.

echo Testing backend connection...
curl -s http://localhost:3000 > nul
if %errorlevel% == 0 (
    echo ✅ Backend is running on port 3000
) else (
    echo ❌ Backend not running - run FINAL-SETUP.bat first
    pause
    exit
)

echo.
echo Testing database endpoints...
curl -s http://localhost:3000/api/activity/user > nul
if %errorlevel% == 0 (
    echo ✅ Database endpoints working
) else (
    echo ❌ Database connection failed
)

echo.
echo Opening test interface...
start debug-test.html

echo.
echo ========================================
echo    TEST INSTRUCTIONS
echo ========================================
echo.
echo In the debug test page:
echo 1. Click "Check Database" - should show user ID
echo 2. Click "Insert Test Data" - should add sample data
echo 3. Click "Check Recent Activity" - should show data
echo.
echo If all tests pass, the system is ready! ✅
echo.
pause