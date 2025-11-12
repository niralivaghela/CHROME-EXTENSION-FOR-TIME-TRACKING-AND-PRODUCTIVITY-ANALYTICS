@echo off
echo ========================================
echo    TIME TRACKER PRODUCTIVITY SETUP
echo ========================================
echo.

echo 1. Installing backend dependencies...
cd backend
call npm install
echo.

echo 2. Starting MongoDB (make sure it's running)...
echo    If MongoDB is not installed, install it first!
echo.

echo 3. Starting backend server...
start "Backend Server" cmd /k "npm start"
echo    Backend started on http://localhost:3000
echo.

echo 4. Opening dashboard...
cd ..\dashboard
start dashboard.html
echo.

echo 5. Opening debug test...
cd ..
start debug-test.html
echo.

echo ========================================
echo    SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Load Chrome extension from chrome-extension folder
echo 2. Visit websites to start tracking
echo 3. Check dashboard for real-time data
echo.
echo Test the system:
echo - Open debug-test.html
echo - Click "Check Database" 
echo - Click "Insert Test Data"
echo - Click "Check Recent Activity"
echo.
pause