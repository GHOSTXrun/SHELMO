@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel% equ 0 (
  node --env-file-if-exists=.env work/server.mjs
) else (
  if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" --env-file-if-exists=.env work/server.mjs
  ) else (
    echo Please install Node.js 22 or newer, then run this file again.
  )
)
pause
