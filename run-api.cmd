@echo off
setlocal

cd /d "%~dp0"

if not exist "apps\api\.env" (
  if exist "apps\api\.env.example" (
    copy /Y "apps\api\.env.example" "apps\api\.env" >nul
  )
)

echo Starting Pump API on http://localhost:4000
npm run dev:api

endlocal
