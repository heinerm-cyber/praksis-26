# pump.no platform

Web-first MVP for pump.no with API-first architecture, ready for future iOS/Android clients.

## Implemented in this iteration
- Next.js + TypeScript frontend in apps/web.
- Node.js + TypeScript API in apps/api.
- Domain logic for calorie calculation, diet suggestions, and training suggestions.
- User-scoped endpoints for profile, calories, diets, and training plans.
- Startup storage resolver:
	- Try Cosmos DB first.
	- If Cosmos is unavailable, switch to in-memory storage automatically.
- Health endpoint exposes active storage mode.
- Initial domain tests for calorie logic.

## Architecture
- Frontend: React (Next.js app router), TypeScript.
- Backend: Express API, TypeScript.
- Primary data store: Azure Cosmos DB.
- Fallback mode: in-memory repositories (non-durable in v1).

## Project structure
- apps/web: React frontend.
- apps/api: API, domain logic, storage adapters.
- .github/instructions: repository instructions and decision log.
- .github/skills/pump-workflows: reusable workflow skill + templates.

## Run locally
1. Install dependencies from repo root.
2. Configure environment files.
3. Start API and web together.

Windows Command Prompt:

```bash
npm install
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env
npm run dev
```

macOS/Linux shell:

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm run dev
```

Default URLs:
- Web: http://localhost:3000
- API: http://localhost:4000
- Health: http://localhost:4000/health

## Scripts
At repo root:

```bash
npm run dev
npm run test
npm run typecheck
```

## Azure deployment (SWA + separate API)
- Azure Static Web Apps deployer kun frontend fra `apps/web` i denne repoen.
- `apps/api` deployes separat som Node.js API (for eksempel Azure App Service eller Azure Container Apps).
- Sett `NEXT_PUBLIC_API_BASE_URL` i `apps/web/.env` (og i Azure SWA application settings) til den publiserte API-URL-en.
- Frontend bruker denne variabelen for kall til `/api/*`-endepunkter mot separat backend.

API deploy workflow (`.github/workflows/deploy-api-appservice.yml`) krever disse GitHub secrets:
- `AZURE_API_WEBAPP_NAME` (påkrevd)
- `AZURE_API_WEBAPP_PUBLISH_PROFILE` (anbefalt)
- `AZURE_CREDENTIALS` (alternativ hvis publish profile ikke brukes)

## iOS (Xcode + TestFlight)
Denne repoen er satt opp med Capacitor for iOS-wrapper av webappen.

1. Sørg for at webappen er deployet på en offentlig HTTPS-URL.
2. Sett `PUMP_MOBILE_WEB_URL` til produksjons-URL i `apps/web/.env`.
3. Sync iOS-prosjektet fra repo root:

```bash
npm run cap:sync:ios --workspace @pump/web
```

4. For å opprette iOS-prosjekt første gang:

```bash
npm run cap:add:ios --workspace @pump/web
```

5. Åpne prosjektet i Xcode:

```bash
npm run cap:open:ios --workspace @pump/web
```

TestFlight flyt (på macOS):
- Sett korrekt Team, Bundle Identifier og Signing i Xcode.
- Velg `Any iOS Device (arm64)` og kjør `Product -> Archive`.
- Last opp arkivet via Organizer til App Store Connect.
- Opprett intern/ekstern testgruppe i TestFlight og inviter testere.

Merk:
- iOS-build og opplasting til TestFlight krever macOS + Xcode.
- Uten `PUMP_MOBILE_WEB_URL` viser wrapperen en lokal fallback-side med konfigurasjonsinfo.

## Command Prompt run files
From repo root in Windows Command Prompt:

```cmd
run-api.cmd
run-web.cmd
run-all.cmd
```

- run-api.cmd: starts backend API on port 4000.
- run-web.cmd: starts Next.js web app on port 3000 and opens browser when the web server is ready.
- run-all.cmd: starts both web and API together and opens browser when the web server is ready.

## Shell run files (macOS/Linux)
From repo root in Terminal:

```bash
chmod +x run-api.sh run-web.sh run-all.sh
./run-api.sh
./run-web.sh
./run-all.sh
```

- run-api.sh: starts backend API on port 4000.
- run-web.sh: starts Next.js web app on port 3000 and opens browser when the web server is ready.
- run-all.sh: starts both web and API together and opens browser when the web server is ready.

If you move the repository between operating systems (for example Windows to Ubuntu/WSL), the shell run files automatically detect incompatible node_modules binaries (such as esbuild) and run a clean npm ci reinstall for the current platform.

## Current auth note
- API autentisering bruker bearer access token i `Authorization`-header.
- Web er migrert til client-side SPA-auth: login/register kaller API-endepunkter direkte.
- API tilbyr auth-endepunkter: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google`, `GET /api/auth/me`.
- Google-innlogging i SPA bruker Google ID-token fra browser og verifiseres i API før eget bearer-token utstedes.
- Sett `GOOGLE_CLIENT_ID` i `apps/api/.env` og `NEXT_PUBLIC_GOOGLE_CLIENT_ID` i `apps/web/.env` for å aktivere Google-knappen.
- Azure AD B2C er fortsatt målarkitektur for produksjon og kan kobles på samme bearer-kontrakt.

## Fallback behavior details
- If COSMOS_ENDPOINT or COSMOS_KEY is missing, API starts in memory mode.
- If Cosmos connectivity check fails at startup, API falls back to memory mode.
- In memory mode, profile and other user data are temporary and reset on restart.