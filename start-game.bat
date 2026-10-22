@echo off
cd /d "%~dp0"
set "GAME=%~dp0game\Degrees of Lewdity.html"
set "PF=%ProgramFiles%"
set "PF86=%ProgramFiles(x86)%"

if exist "%PF%\Google\Chrome\Application\chrome.exe" goto CHROME_PF
if exist "%PF86%\Google\Chrome\Application\chrome.exe" goto CHROME_PF86
if exist "%PF86%\Microsoft\Edge\Application\msedge.exe" goto EDGE_PF86
if exist "%PF%\Microsoft\Edge\Application\msedge.exe" goto EDGE_PF
start "" "%GAME%"
exit /b 0

:CHROME_PF
start "" "%PF%\Google\Chrome\Application\chrome.exe" "%GAME%"
exit /b 0

:CHROME_PF86
start "" "%PF86%\Google\Chrome\Application\chrome.exe" "%GAME%"
exit /b 0

:EDGE_PF86
start "" "%PF86%\Microsoft\Edge\Application\msedge.exe" "%GAME%"
exit /b 0

:EDGE_PF
start "" "%PF%\Microsoft\Edge\Application\msedge.exe" "%GAME%"
exit /b 0
