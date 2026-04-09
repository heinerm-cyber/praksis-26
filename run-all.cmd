@echo off
setlocal

cd /d "%~dp0"

if not exist "apps\api\.env" (
  if exist "apps\api\.env.example" (
    copy /Y "apps\api\.env.example" "apps\api\.env" >nul
  )
)

if not exist "apps\web\.env" (
  if exist "apps\web\.env.example" (
    copy /Y "apps\web\.env.example" "apps\web\.env" >nul
  )
)

echo Starting Pump web and API
start "Pump API" cmd /k "call \"%~dp0run-api.cmd\""
start "Pump Web" cmd /k "call \"%~dp0run-web.cmd\""

endlocal
