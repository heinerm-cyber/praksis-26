@echo off
setlocal

cd /d "%~dp0"

set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"

if exist "package-lock.json" (
	if not exist "node_modules" (
		echo Installing dependencies with npm ci...
		call npm ci
		if errorlevel 1 exit /b 1
	) else (
		if exist "%NODE_EXE%" (
			"%NODE_EXE%" -e "const fs=require('node:fs');const path=require('node:path');const packagePath=path.join(process.cwd(),'node_modules','@esbuild',process.platform+'-'+process.arch,'package.json');process.exit(fs.existsSync(packagePath)?0:1);"
			if errorlevel 1 (
				echo Detected node_modules from another platform. Reinstalling dependencies...
				call npm ci
				if errorlevel 1 exit /b 1
			)
		)
	)
)

echo Starting Pump web and API
start "" /b cmd /c ""%~dp0run-api.cmd""
call "%~dp0run-web.cmd"

endlocal
