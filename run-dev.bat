@echo off
title Discord Summarizer Launcher
cd /d "%~dp0"
echo ===================================================
echo   Starting Discord Timeline Summarizer (Dev Mode)  
echo ===================================================
echo.
echo Running "npm run tauri dev" in %CD%...
echo.
call npm run tauri dev
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Application exited with error code %ERRORLEVEL%.
    pause
)
