---
applyTo: "apps/api/src/**/*.ts"
---

# API Architecture Rules

## Layering
- Keep domain logic independent of Express.
- Use route handlers as thin adapters.
- Avoid direct storage calls from route handlers; go through repository abstractions.

## Storage
- Implement storage through interfaces with two adapters:
  - Cosmos DB adapter for primary mode.
  - In-memory adapter for startup fallback mode.
- Storage mode must be selected once at startup and exposed through health endpoint.

## Security
- Require authenticated user context for all profile-bound data operations.
- Reject requests if userId is missing.
- Never return data for a different userId than the authenticated user.
