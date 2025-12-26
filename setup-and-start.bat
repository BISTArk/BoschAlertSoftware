@echo off
REM Full setup and start for AISAC
REM This script installs dependencies, seeds the database, and starts all services

echo.
echo ========================================
echo   AISAC - Full Setup
echo ========================================
echo.

REM Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

REM Step 1: Install dependencies
echo Step 1/3: Installing dependencies...
echo ----------------------------------------
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.
echo Dependencies installed successfully!
echo.

REM Step 2: Start Convex in background to seed
echo Step 2/3: Starting Convex and seeding database...
echo ----------------------------------------
echo Starting Convex backend temporarily...
start "Convex Backend (Seeding)" /MIN cmd /c "npm run convex:dev"

REM Wait for Convex to be ready (adjust time if needed)
echo Waiting for Convex to initialize...
timeout /t 10 /nobreak >nul

echo.
echo Seeding database with users...
call npx convex run seed:default
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Seed command failed. You may need to run it manually.
    echo Run: npx convex run seed:default
) else (
    echo Database seeded successfully!
)
echo.

REM Step 3: Start all services
echo Step 3/3: Starting all services...
echo ----------------------------------------
echo.
echo Starting services:
echo   1. Convex Backend (http://127.0.0.1:3210)
echo   2. Web UI (http://localhost:5173)
echo   3. SIA Receiver (TCP/UDP port 4000)
echo.

REM Convex should already be running, but ensure it's in a proper window
taskkill /FI "WINDOWTITLE eq Convex Backend (Seeding)*" /T /F >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting Convex Backend...
start "Convex Backend" cmd /k "npm run convex:dev"

REM Wait for Convex to initialize
timeout /t 3 /nobreak >nul

echo Starting Web UI...
start "Web UI" cmd /k "npm run dev"

REM Wait 1 second
timeout /t 1 /nobreak >nul

echo Starting SIA Receiver...
start "SIA Receiver" cmd /k "npm run server"

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo All services are now running in separate windows.
echo.
echo Next steps:
echo   1. Open browser to http://localhost:5173
echo   2. Login with:
echo      - Admin: admin@boschalert.com / admin123
echo      - Guard: guard1@boschalert.com / guard123
echo.
echo Press any key to close this window...
pause >nul
