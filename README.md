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

```bash
npm install
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env
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

## Current auth note
- API currently uses x-user-id header as temporary user context for MVP development.
- Azure AD B2C token validation is planned next and documented in instructions.

## Fallback behavior details
- If COSMOS_ENDPOINT or COSMOS_KEY is missing, API starts in memory mode.
- If Cosmos connectivity check fails at startup, API falls back to memory mode.
- In memory mode, profile and other user data are temporary and reset on restart.