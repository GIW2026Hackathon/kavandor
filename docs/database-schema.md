# Database schema

This project is prepared for a Supabase PostgreSQL schema, but the actual database is not yet connected to a live project. The following is the intended starting model.

## Core tables

- `profiles`
- `farms`
- `harvests`
- `harvest_photos`
- `assessments`
- `facilities`
- `capacity_slots`
- `reservations`
- `transport_jobs`
- `buyers`
- `offers`
- `inventory_batches`
- `transactions`
- `payment_records`
- `activity_events`

## Constraints

- Primary and foreign keys should be UUID-based.
- Quantity and date columns should be explicit and validated.
- Status values must use a constrained enum for consistency.
- RLS policies should enforce ownership on farmer and partner records.

## Demo data strategy

- All values are labelled as demonstration data.
- Seed rows should be re-runnable without duplicates.
- No real personal or transaction data should be loaded.
