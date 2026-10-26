# Architecture

KAVANDOR is organized as a modular monolith using the Next.js App Router. The primary product domain is farmer-facing harvest decision support, with a later extension into buyer, facility, and transport coordination.

## Modules

- `src/app`: route handlers and page-level UI
- `src/components`: reusable UI building blocks
- `src/features`: product feature packages
- `src/lib`: environment and shared server utilities
- `src/validations`: Zod request and response contracts
- `src/calculations`: deterministic decision logic
- `src/types`: shared domain types

## Data flow

1. A farmer creates a harvest record in the intake flow.
2. The system optionally validates and assesses the harvest with a server-side AI adapter.
3. Recommendation logic ranks feasible next actions using cost assumptions and operational constraints.
4. Buyer, facility, or transport flows use the same shared contract layer.

## Security boundaries

- Service-role and provider credentials stay server-side.
- Browser clients use anon keys only.
- Shared validation prevents invalid payloads and rejects missing required data.

## AI integration

The current implementation uses an explicit adapter interface pattern so a later provider can be swapped without changing domain logic.
