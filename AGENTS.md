<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# KAVANDOR Agent Memory & Context Directives

Before modifying or extending code in this repository, always read the 9 JS Mastery Context Files located in `context/`:
- `context/project-overview.md`
- `context/architecture.md`
- `context/build-plan.md`
- `context/code-standards.md`
- `context/library-docs.md`
- `context/ui-tokens.md`
- `context/ui-rules.md`
- `context/ui-registry.md`
- `context/progress-tracker.md`
- `context/agentic-skillset.md`

## Immutable Domain Rules:
1. **Never alter financial terms or capacity ledgers via raw LLM prompts:** State mutations must pass strictly through typed methods in `src/store/KavandorStore.tsx`.
2. **Separation of Physical and Financial States:** An accepted buyer offer does NOT mean payment has cleared; an escrow payment does NOT mean physical release; release requires cold-room operator sign-off and valid release passcode.
3. **Atomic Capacity Conservation:** Total capacity = Available + Reserved + Occupied.
4. **Color Tokens:** Electric Orange (`#FF5A1F`), Premium Charcoal (`#17191D`), Warm Paper (`#F6F3EC`).
5. **Production Boundary:** Consult `BACKEND_HANDOFF.md` before implementing real external database or API connections.
