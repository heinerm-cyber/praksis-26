@echo off
setlocal

cd /d "%~dp0"

if not exist "apps\web\.env" (
  if exist "apps\web\.env.example" (
    copy /Y "apps\web\.env.example" "apps\web\.env" >nul
  )
)

echo Starting Pump web on http://localhost:3000
start "" /b powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; $url='http://localhost:3000'; for($i=0; $i -lt 120; $i++){ try { $res=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2; if($res.StatusCode -ge 200){ Start-Process $url; break } } catch {} Start-Sleep -Milliseconds 500 }"
npm run dev:web

endlocal
