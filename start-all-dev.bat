@echo off
echo ========================================
echo Starting All Development Servers
echo ========================================
echo.

echo Starting Vite Dev Server (Frontend)...
start "Vite Dev Server" cmd /k "npm run dev"

echo Starting Convex Dev Server (Backend)...
start "Convex Dev Server" cmd /k "npm run convex:dev"

echo Starting SIA Receiver Server...
start "SIA Receiver Server" cmd /k "npm run server"

echo Starting Admin API Server...
start "Admin API Server" cmd /k "npm run admin-api"

echo.
echo ========================================
echo All servers starting in separate windows
echo ========================================
echo.
echo Close this window or press any key to exit...
pause >nul
