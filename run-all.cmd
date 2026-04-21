@echo off
setlocal

cd /d "%~dp0"

set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
set "NPM_CLI=%ProgramFiles%\nodejs\node_modules\npm\bin\npm-cli.js"

if not exist "%NODE_EXE%" (
	echo Fant ikke node.exe i "%ProgramFiles%\nodejs".
	exit /b 1
)

if not exist "%NPM_CLI%" (
	echo Fant ikke npm-cli.js i "%ProgramFiles%\nodejs\node_modules\npm\bin".
	exit /b 1
)

call :EnsureDependencies
if errorlevel 1 exit /b 1

if not exist "node_modules\next\dist\bin\next" (
	echo Mangler Next.js CLI etter dependency-oppsett. Stopper oppstart.
	exit /b 1
)

if not exist "node_modules\tsx\dist\cli.mjs" (
	echo Mangler tsx CLI etter dependency-oppsett. Stopper oppstart.
	exit /b 1
)

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
start "" /b /d "%~dp0apps\api" "%NODE_EXE%" "%~dp0node_modules\tsx\dist\cli.mjs" watch src/index.ts
start "" /b powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; $url='http://localhost:3000'; for($i=0; $i -lt 120; $i++){ try { $res=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2; if($res.StatusCode -ge 200){ Start-Process $url; break } } catch {} Start-Sleep -Milliseconds 500 }"
cd /d "%~dp0apps\web"
"%NODE_EXE%" "%~dp0node_modules\next\dist\bin\next" dev -p 3000

endlocal
exit /b 0

:EnsureDependencies
if not exist "package-lock.json" exit /b 0

if not exist "node_modules" (
	echo Installing dependencies with npm ci...
	call :RunNpmCi
	exit /b %errorlevel%
)

"%NODE_EXE%" -e "const fs=require('node:fs');const path=require('node:path');const packagePath=path.join(process.cwd(),'node_modules','@esbuild',process.platform+'-'+process.arch,'package.json');process.exit(fs.existsSync(packagePath)?0:1);"
if errorlevel 1 (
	echo Detected node_modules from another platform. Reinstalling dependencies for current platform...
	call :CleanNodeModules
	if errorlevel 1 exit /b 1
	call :RunNpmCi
	if errorlevel 1 exit /b 1
)

if not exist "node_modules\next\dist\bin\next" (
	echo Dependency install ser ufullstendig ut. Kjoerer clean reinstall...
	call :CleanNodeModules
	if errorlevel 1 exit /b 1
	call :RunNpmCi
	if errorlevel 1 exit /b 1
)

if not exist "node_modules\tsx\dist\cli.mjs" (
	echo Dependency install ser ufullstendig ut. Kjoerer clean reinstall...
	call :CleanNodeModules
	if errorlevel 1 exit /b 1
	call :RunNpmCi
	if errorlevel 1 exit /b 1
)

exit /b 0

:RunNpmCi
"%NODE_EXE%" "%NPM_CLI%" ci
if not errorlevel 1 exit /b 0

echo npm ci feilet. Proever en gang til etter opprydding av node_modules...
call :CleanNodeModules
if errorlevel 1 exit /b 1
"%NODE_EXE%" "%NPM_CLI%" ci
if not errorlevel 1 exit /b 0

echo npm ci feilet igjen. Avslutter uten aa starte web/API.
echo Lukk eventuelle Node-prosesser som bruker dette repoet, og proev paanytt.
exit /b 1

:CleanNodeModules
if not exist "node_modules" exit /b 0

echo Rydder node_modules for aa unngaa fil-lock...
attrib -R "node_modules\*" /S /D >nul 2>nul
rmdir /S /Q "node_modules" >nul 2>nul
if not exist "node_modules" exit /b 0

for /f "delims=" %%F in ('dir /b /s "node_modules\@next\.swc-win32-x64-msvc-*\next-swc.win32-x64-msvc.node*" 2^>nul') do (
	move /Y "%%F" "%TEMP%\next-swc.win32-x64-msvc.%%~nF.%RANDOM%.tmp" >nul 2>nul
)
attrib -R "node_modules\*" /S /D >nul 2>nul
rmdir /S /Q "node_modules" >nul 2>nul
if not exist "node_modules" exit /b 0

echo node_modules er laast. Stopper Node-prosesser som peker til workspace og proever igjen...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$workspace=(Get-Location).Path; Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like \"*$workspace*\" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>nul
for /f "delims=" %%F in ('dir /b /s "node_modules\@next\.swc-win32-x64-msvc-*\next-swc.win32-x64-msvc.node*" 2^>nul') do (
	move /Y "%%F" "%TEMP%\next-swc.win32-x64-msvc.%%~nF.%RANDOM%.tmp" >nul 2>nul
)
attrib -R "node_modules\*" /S /D >nul 2>nul
rmdir /S /Q "node_modules" >nul 2>nul
if exist "node_modules" (
	echo Klarte ikke aa slette node_modules. Sjekk antivirus eller laaste prosesser og proev igjen.
	exit /b 1
)

exit /b 0
