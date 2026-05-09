@echo off
title PARSER CLEAN INSTALL
color 0c
echo ########################################
echo #                                      #
echo #   WARNING: FULL CLEAN INSTALL        #
echo #                                      #
echo ########################################
echo.
echo [1/4] Closing node processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1

echo [2/4] Deleting node_modules and locks...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json

echo [3/4] Cleaning NPM cache...
call npm cache clean --force

echo [4/4] Installing dependencies...
call npm install

echo.
echo ########################################
echo # DONE! Try running: npm run dev       #
echo ########################################
pause
