---
name: pump-workflows
description: "Use when: implementing pump.no features, changing auth/storage/fallback behavior, or preparing release checks for web+api architecture."
---

# Pump Workflows Skill

## Use This Skill For
- New feature slices across web and api.
- Changes to Azure AD B2C, Cosmos DB, or fallback behavior.
- Verification before merging release candidates.

## Workflow
1. Confirm scope and affected modules.
2. Update decision log in .github/instructions/azure-auth-data.instructions.md for any clarified requirement.
3. Mirror the same decision in .github/skills/pump-workflows/SKILL.md.
4. If process checks changed, update related templates in .github/skills/pump-workflows/templates/.
5. Implement domain and API changes first, then frontend integration.
6. Validate fallback behavior (cosmos available vs unavailable).
7. Run lint, typecheck, and key tests.
8. Update README if setup or runtime behavior changed.

## Required Checks
- User-bound data never leaks across userIds.
- Health endpoint reports active storage mode.
- UI clearly signals fallback/degraded mode.
- New features include minimal test coverage for domain behavior.
- No task is complete before instructions and skills are updated together for all new decisions.

## Decision Mirror
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
