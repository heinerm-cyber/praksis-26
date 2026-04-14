---
applyTo: "{apps/api/src/**/*.ts,README.md,.github/copilot-instructions.md}"
---

# Azure Auth and Data Rules

## Auth Baseline
- Target Azure AD B2C for email/password and social providers (Google/Facebook).
- API endpoints handling user data must require user identity context.

## Data Baseline
- Cosmos DB is primary storage.
- Collections must remain user-scoped for profile, calories, diets, and training plans.
- Keep userId as first-class field in all persisted entities.

## Fallback Baseline
- On API startup, try Cosmos connectivity first.
- If Cosmos is unavailable, switch to in-memory storage mode.
- In-memory mode in v1 is non-durable and resets on process restart.

## Decision and Skill Sync Rule
- For every decision taken together with the user, update both instruction files and skill files.
- Minimum sync targets are .github/instructions/azure-auth-data.instructions.md and .github/skills/pump-workflows/SKILL.md.
- If a decision changes process or release checks, update relevant files in .github/skills/pump-workflows/templates/.

## Decision Log
- 2026-04-07: Frontend stack locked to Next.js + TypeScript.
- 2026-04-07: Backend stack locked to Node.js + TypeScript API.
- 2026-04-07: Auth target locked to Azure AD B2C.
- 2026-04-07: Database target locked to Azure Cosmos DB.
- 2026-04-07: Fallback implemented in backend/API only.
- 2026-04-07: Fallback data in v1 is temporary and not persisted after restart.
- 2026-04-07: Governance rule added: every shared decision must update both instructions and skills.
- 2026-04-07: Initial MVP auth context uses x-user-id request header until Azure AD B2C token validation is integrated.
- 2026-04-07: Initial MVP frontend is delivered as one Next.js dashboard page covering profile, calories, diets, and training.
- 2026-04-07: API domain test baseline uses Vitest for calorie and suggestion logic.
- 2026-04-07: Frontend must show fallback/degraded storage state from /health when memory mode is active.
- 2026-04-07: Windows Command Prompt run files added: run-api.cmd, run-web.cmd, and run-all.cmd.
- 2026-04-07: Web UI copy must use Norwegian language with proper characters ae/oe/aa replaced by æ/ø/å.
- 2026-04-07: run-web.cmd and run-all.cmd now auto-open browser on startup page after web server is reachable.
- 2026-04-07: Added macOS/Linux shell run files run-api.sh, run-web.sh, and run-all.sh with env bootstrap and browser auto-open for web startup scripts.
- 2026-04-07: macOS/Linux shell run files now auto-detect cross-platform node_modules binary mismatch (esbuild) and run clean npm ci reinstall before startup.
- 2026-04-09: Added VS Code tasks.json with policy-safe startup tasks that run API/web via Program Files node.exe for AppLocker-restricted Windows environments.
- 2026-04-09: Web now uses login-first flow with Google OAuth and cookie-based sessions; profile management moved to a dedicated profile page while dashboard focuses on calorie/diet/training.
- 2026-04-09: Added local e-post/passord registrering og login via NextAuth Credentials with in-memory auth-store for development, while Google OAuth remains optional when configured.
- 2026-04-09: Windows run scripts run-api.cmd and run-web.cmd now start API/web via Program Files node.exe and direct CLI paths to avoid AppLocker blocking npm-based startup.
- 2026-04-09: Treningsplanleggeren støtter nå manuell ukeplan per dag med klikkbare øvelsesvalg, egendefinerte øvelser og daglige notater i lagrede planer.
- 2026-04-09: Treningsplanleggeren bruker nå muskelgrupper som valg i stedet for generelle treningstyper, og viser øvelser som passer valgt muskelgruppe.
- 2026-04-09: Treningsplanleggeren har nå reset-knapp som nullstiller planfelter og ukeplan for rask ny planlegging.
- 2026-04-09: Reset i treningsplanleggeren nullstiller også ukeplanutkast og rydder treningsplan-visningen i UI for ny planstart.
- 2026-04-09: Etter reset i treningsplanleggeren erstatter neste lagring planlisten i UI slik at bare den nye planen vises.
- 2026-04-14: Web UI color palette switched to Nordisk Ren theme (clean blue/neutral tones) across global styles.
- 2026-04-14: Hero heading pump.no updated to a styled wordmark with badge and improved typography for better visual identity.
- 2026-04-14: Treningsplanleggeren har nå ferdige programmaler (nybegynner, styrke, hypertrofi, fettforbrenning) som kan velges og tilpasses manuelt før lagring.
- 2026-04-14: Startsiden er nå kategoribasert med egne undersider for kalorier, kosthold, trening og en separat oversiktsside.
- 2026-04-14: Kalori og kosthold er slått sammen til én kategori med forbedret kostholdsverdi gjennom daglige makromål, væske/fiber-mål, måltidsfordeling og handlelisteforslag.
- 2026-04-14: Oversiktssiden er fjernet for enklere navigasjon; startside og toppmeny viser nå kun kjernekategoriene kalori/kosthold og trening.
- 2026-04-14: Web UI has a built-in training-themed SVG background illustration to strengthen visual identity while preserving readability.
- 2026-04-14: Startsiden viser nå kun brukerens lagrede treningsplaner (eller tom-tilstand) i stedet for kategorikort.
- 2026-04-14: UI feedback improved with loading states, success messages, and refresh action for homepage plans plus action-state buttons in dashboard.
- 2026-04-14: Startsiden viser nå skeleton-kort under lasting av planer for bedre opplevd ytelse og mer profesjonell feedback.
- 2026-04-14: Startsiden viser nå kun siste lagrede plan (ikke flere planer samtidig) for en enklere visning etter lagring.
- 2026-04-14: Kostholdplan kan nå lagres eksplisitt i API som enten manuell plan eller plan opprettet fra kostholdforslag, fortsatt brukerbundet og kompatibelt med memory/cosmos adaptere.
- 2026-04-14: Startsiden viser nå siste treningsplan øverst og flere lagrede kostholdplaner under treningsdelen.
- 2026-04-14: Gamification runde 1 er implementert som frontend-beregnet streak + XP/level + personlig leaderboard, vist på dashboard og startside uten ny backend-persistens.
- 2026-04-14: Lokal login/register-flyt er gjenopprettet i web med in-memory brukerstore, egne /login og /register sider, samt brukerspesifikk datalasting i dashboard/startside.
- 2026-04-14: Toppnavigasjon er delt i hovedfaner og separat auth-seksjon; login/register er flyttet bort fra hovedfanene.
- 2026-04-14: Egen profilfane (/profil) og egen leaderboard-fane (/leaderboard) er lagt til i web.
