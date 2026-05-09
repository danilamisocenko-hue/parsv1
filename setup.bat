@echo off
title PARSER SETUP
color 0b
echo ########################################
echo #                                      #
echo #         PARSER PROJECT SETUP         #
echo #                                      #
echo ########################################
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install it from https://nodejs.org/
    pause
    exit /b
)

if not exist node_modules (
    echo [INFO] Installing dependencies, please wait...
    call npm install
)

echo [INFO] Installing Playwright browsers...
npx playwright install chromium

echo [INFO] Building components...
call npm run build

echo.
echo ########################################
echo # SUCCESS! Setup complete.             #
echo #                                      #
echo # To build EXE: npm run dist           #
echo # To start DEV: npm run dev            #
echo ########################################
echo.
pause

