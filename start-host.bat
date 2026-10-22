@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install from https://nodejs.org/ then run again.
  pause
  exit /b 1
)
echo Starting DoL-MP server on port 8787 ...
echo.
echo Your IPv4 addresses (use the Radmin / LAN one for friends):
ipconfig | findstr /i "IPv4"
echo.
start "DoL-MP Server" cmd /k node "%~dp0server\server.js"
timeout /t 1 >nul
call "%~dp0start-game.bat"
exit /b 0
