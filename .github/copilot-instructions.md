# Pump.no Copilot Instructions

## Product Scope
- Build for web first, but keep architecture API-first so iOS/Android clients can reuse backend contracts.
- v1 includes: profile creation, authentication entry points, calorie calculation to target date in months, diet/food suggestions, and training plans.
- All profile, calorie, diet, and training data must be bound to a single userId.

## Mandatory Technical Baseline
- Frontend stack: Next.js + TypeScript.
- Backend stack: Node.js + TypeScript.
- Primary persistence: Azure Cosmos DB.
- Startup fallback requirement: API must test Cosmos connectivity on startup and switch to in-memory repositories if unavailable.
- Fallback behavior in v1: in-memory data is temporary and can be lost on restart.

## Architecture Rules
- Keep strict module boundaries: domain, application, infrastructure, presentation.
- All new business logic must be testable without HTTP transport.
- Use repository interfaces with adapters (cosmos + memory) to avoid coupling business logic to storage.
- Health endpoint must expose current storage mode (cosmos or memory).

## Decision Logging Rule
- Every new clarification or scope decision must be recorded in repository instruction files.
- Add/update the decision list in .github/instructions/azure-auth-data.instructions.md whenever requirements change.
- Every new clarification or scope decision must also be reflected in .github/skills/pump-workflows/SKILL.md.
- If a decision changes process checks, update relevant templates in .github/skills/pump-workflows/templates/.
- A task is only complete when instructions and skills are updated together.
