@echo off
setlocal

cd /d "%~dp0"

set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"

if not exist "%NODE_EXE%" (
  echo Fant ikke node.exe i "%ProgramFiles%\nodejs".
  exit /b 1
)

if not exist "apps\api\.env" (
  if exist "apps\api\.env.example" (
    copy /Y "apps\api\.env.example" "apps\api\.env" >nul
  )
)

echo Starting Pump API on http://localhost:4000
cd /d "%~dp0apps\api"
"%NODE_EXE%" "%~dp0node_modules\tsx\dist\cli.mjs" watch src/index.ts

endlocal
