@echo off
REM Start all AISAC services
REM This script launches Convex, Vite, and the SIA receiver in separate windows

echo.
echo ====================================
echo    AISAC Startup
echo ====================================
echo.
echo Starting services:
echo   1. Convex Backend (http://127.0.0.1:3210)
echo   2. Web UI (http://localhost:5173)
echo   3. SIA Receiver (TCP/UDP port 4000)
echo.

REM Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting Convex Backend...
start "Convex Backend" cmd /k "npm run convex:dev"

REM Wait 3 seconds for Convex to initialize
timeout /t 3 /nobreak >nul

echo Starting Web UI...
start "Web UI" cmd /k "npm run dev"

REM Wait 1 second
timeout /t 1 /nobreak >nul

echo Starting SIA Receiver...
start "SIA Receiver" cmd /k "npm run server"

echo.
echo ====================================
echo All services started successfully!
echo ====================================
echo.
echo Press any key to close this window...
echo The services will continue running in their own windows.
pause >nul
