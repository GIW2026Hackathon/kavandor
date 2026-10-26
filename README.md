# KAVANDOR

KAVANDOR is an AI-assisted harvest intelligence and perishable-produce marketplace for Kenyan farmers. The backend uses Next.js route handlers, Supabase PostgreSQL/Auth/Storage, and Zod request validation.

## Local development

1. Install Node.js dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set the Supabase project URL and anon key. Apply `supabase/migrations/001_initial_schema.sql`, `002_storage_and_mobility.sql`, and `003_production_backend.sql` in order.
4. Run `npm run dev`.

The frontend can start without Supabase credentials, but protected backend operations correctly return service-unavailable responses. The `/api/health` endpoint reports the actual public database probe rather than a demo-ready state.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Authentication and external services

Email/password and Google/Facebook OAuth use Supabase Auth. Set the application origin in `NEXT_PUBLIC_SITE_URL`; configure provider credentials and redirect URLs in the Supabase Auth dashboard. Do not store provider secrets or Supabase service-role credentials in the browser.

AI visual assessment requires server-only `AI_PROVIDER_API_KEY` (plus optional endpoint/model overrides). With no key, the API stores an explicit manual-review fallback; it does not claim to assess the image. Payments and transport-provider integrations currently support manual records only and do not claim external confirmation.

See [the API contract](./docs/api-contract.md) and [database/deployment documentation](./docs/database-schema.md) for requests, authorization, migrations, bootstrap administration, and integration limitations.
