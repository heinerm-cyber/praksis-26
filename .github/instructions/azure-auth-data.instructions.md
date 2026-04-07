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
