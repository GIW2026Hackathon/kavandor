# Database schema

KAVANDOR uses Supabase PostgreSQL. The schema is defined in ordered SQL migrations under `supabase/migrations/`; the demo seed is `supabase/seed.sql`.

## Tables and relationships

The initial migration defines all core tables: `profiles`, `farms`, `harvests`, `harvest_photos`, `assessments`, `facilities`, `capacity_slots`, `reservations`, `transport_jobs`, `buyers`, `offers`, `inventory_batches`, `transactions`, `payment_records`, and `activity_events`.

All primary keys are UUIDs. Profile IDs are expected to match the authenticated Supabase user's `auth.uid()`. The current schema intentionally does not create or seed Auth users: the demo profiles are isolated fixtures, and account provisioning must create a profile using the verified Auth user's UUID. Profile roles cannot be changed by an ordinary authenticated client.

Farmer-owned farms and harvests reference profiles; photos and assessments reference harvests. Buyers reference their own buyer profile, and offers connect buyers to harvests. A reservation references its harvest, facility, and capacity slot. The capacity slot must belong to the same facility. Inventory, transactions, and activity events trace the harvest workflow. Deleting a harvest can cascade to operational data, but transactions and payment records restrict deletion of their financial history; activity events remain if their harvest is deleted.

Quantities and KSh prices use fixed-precision numeric values; workflow timestamps use `timestamptz`. Existing status constraints and API status contracts are retained. Additional constraints prevent negative transaction values, over-capacity counters, duplicate transactions for one offer, and multiple accepted offers for one harvest.

## Capacity and workflow integrity

Reservation inserts, changes, and deletes maintain `capacity_slots.reserved_kg` in a database trigger. The trigger locks the relevant slot row and rejects a reservation that would exceed capacity, so concurrent reservation transactions cannot both consume the same remaining capacity. Only pending and confirmed reservations count against capacity; released and completed reservations do not. New reservations must reference a slot, while pre-existing rows can remain unassigned until reconciled.

Offer acceptance is protected by a partial unique index on accepted offers per harvest. Offer, reservation, and transport-job details cannot be changed after creation, and their status transitions are constrained. Creation and status changes for harvests, reservations, offers, transport jobs, and transactions are written to `activity_events`.

## Row-level security

RLS is enabled on every core table. Farmers can access their own farms, harvests, photos, and assessments. Buyers can create offers only through their own buyer profile and only for listed harvests; they can read their own offers and transactions. Farmers control offer decisions for their harvests. Facility operators can manage their own facility and capacity slots; only the owning operator can update its reservations. Assigned transport providers can update their own jobs. Participants can read relevant inventory, transaction, payment, and activity records. Assessment, inventory, transaction, payment, and audit writes are reserved for trusted server-side operations. Facilities and capacity availability are readable without authentication for marketplace discovery; their writes remain controlled.

The current application APIs are development mocks and do not authenticate users or write to Supabase. Before connecting them, implement server-side Auth checks and use the caller's verified UUID; keep service-role credentials server-only. The demo fixture profiles do not correspond to Auth accounts and cannot be used to authenticate through these RLS policies.

## Local setup and verification

Install the Supabase CLI and PostgreSQL client (`psql`) separately if they are not already available. These commands use the local Supabase database only; do not link a shared project or point them at production:

```powershell
supabase start
supabase migration up
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/seed.sql
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/seed.sql
supabase test db
```

`supabase start` initializes local services if needed. `supabase migration up` applies pending migrations to the local database without resetting it. The two `psql` commands verify the seed can be applied repeatedly; the fixed demo IDs and conflict handling prevent duplicate rows. Database tests are in `supabase/tests/`.

For a configured non-default local database password, replace `postgres` in the connection string with that local password. Do not put service-role keys in these commands or in frontend environment variables.

After applying migrations, regenerate the project's Supabase TypeScript database types before replacing the current mock API contracts. Review generated types and API changes together; no generated types are currently committed.
