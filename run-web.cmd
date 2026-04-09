@echo off
setlocal

cd /d "%~dp0"

set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"

if not exist "%NODE_EXE%" (
  echo Fant ikke node.exe i "%ProgramFiles%\nodejs".
  exit /b 1
)

if not exist "apps\web\.env" (
  if exist "apps\web\.env.example" (
    copy /Y "apps\web\.env.example" "apps\web\.env" >nul
  )
)

echo Starting Pump web on http://localhost:3000
start "" /b powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; $url='http://localhost:3000'; for($i=0; $i -lt 120; $i++){ try { $res=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2; if($res.StatusCode -ge 200){ Start-Process $url; break } } catch {} Start-Sleep -Milliseconds 500 }"
cd /d "%~dp0apps\web"
"%NODE_EXE%" "%~dp0node_modules\next\dist\bin\next" dev -p 3000

endlocal
