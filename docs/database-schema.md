# Supabase database and deployment

The backend uses ordered migrations in `supabase/migrations/`:

1. `001_initial_schema.sql` creates the core farmer, harvest, marketplace, facility, and transaction tables.
2. `002_storage_and_mobility.sql` adds facility metadata, capacity windows, storage monitoring, reservations, and transport events.
3. `003_production_backend.sql` adds marketplace listings, notification/cost records, idempotency keys, constraints, secure RPC workflows, activity triggers, strict row-level security, and the private harvest photo bucket.

The migrations are additive and do not drop business data. Migration 003 adds a capacity-window exclusion constraint; existing overlapping windows must be reviewed and corrected before applying it. Apply and inspect migrations against a non-production project first.

## Identity and authorization

- Supabase Auth access tokens/cookies establish identity. API code does not trust caller-supplied `x-user-id` or role headers.
- A database trigger creates a farmer profile on auth signup; OAuth profile names are read from provider metadata.
- Role changes are restricted to a trusted SQL administrator or the admin-only `kavandor_admin_assign_role` RPC. Self-service `requested_role` is a request only.
- To bootstrap the first `operations_admin`, first create/sign in the account, then run this statement in the trusted Supabase SQL editor, replacing the email:

  ```sql
  update public.profiles
  set role = 'operations_admin', updated_at = now()
  where email = 'admin@example.com';
  ```

  Thereafter, use the admin API/RPC to assign farmer, buyer, facility-operator, or transport-provider roles. The app intentionally does not permit self-assignment of an admin role.
- RLS is enabled across business tables. Multi-write workflows use narrowly granted `SECURITY DEFINER` RPCs with a fixed search path; direct writes to protected business tables are not exposed to regular clients.

## Atomic workflows and integrity

- Harvest creation, offer creation/acceptance, capacity reservation, transport assignment, assessment persistence, and facility intake validate roles and ownership in SQL.
- Reservations lock the facility and covering capacity slot before reserving configured kg. Overlapping windows are prohibited; reservation status release/completion decrements reserved capacity.
- Offer acceptance atomically accepts one pending offer, rejects competing offers, closes the listing, marks the harvest sold, and creates a transaction.
- Intake records actual quantity in `inventory_batches`, independently of farmer-declared harvest quantity. Matching confirmed reservations are completed in the same transaction. Transaction completion records actual quantity; the API calculates proceeds from actual kg and accepted price/kg.
- Harvest and transport status triggers reject invalid transitions and persist activity/transport events in the same transaction. Photo metadata is owner-scoped and limited to five photos per harvest; files are stored in a private bucket.
- Payment entries and transaction costs are manual administrative records. They do not represent an external provider confirmation.

## Configuration

Copy `.env.example` to `.env.local`.

- Required for persistent APIs: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Optional AI: server-only `AI_PROVIDER_API_URL`, `AI_PROVIDER_MODEL`, `AI_PROVIDER_API_KEY`. Without a key, assessment returns a clearly labelled manual fallback with confidence 0.
- OAuth: configure Google/Facebook credentials and allowed callback URLs in Supabase Auth. Do not put OAuth client secrets or a Supabase service-role key in browser environment variables.
- `NEXT_PUBLIC_SITE_URL` must match the deployed application origin and be allowlisted for Supabase redirects.

`supabase/config.toml` configures the local Supabase stack, migration discovery, and `seed.sql`. The seed contains fixed demo-only farmer/buyer/facility/harvest/listing/offer records; these profiles are not Supabase Auth login accounts and the seed contains no default credentials. The seed marks simulated values as demo data and is designed for repeatable local setup.

Apply migrations using the Supabase CLI or SQL editor in migration order. Verify that the private `harvest-photos` bucket and policies exist. Provision actual operator/provider/facility records before using partner workflows. Capacity options are available only for explicitly configured future slots.

## Local validation

`npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` validate application code. After applying the migrations to a disposable local or hosted Supabase database, run the rollback-only database workflow and RLS test with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/production_backend.sql`. The test creates temporary fixture records inside a transaction and rolls them back. Credentials and a live database are not included in the repository.
