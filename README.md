# KAVANDOR — Intelligent Post-Harvest & Cold Chain Network

KAVANDOR helps farmers make informed post-harvest decisions by connecting harvest assessment with suitable storage, preservation, transport, and buyer opportunities. Storage and preservation are strategic priorities, ensuring smallholder and commercial farmers in Kisii and Nyamira, Kenya can preserve produce quality, avoid distress liquidation at the farmgate, and aggregate for institutional buyers.

---

## Core Product Promise & Primary Farmer Journey

1. **Harvest Registration**: The farmer registers a harvest lot with crop, quantity, unit, harvest date, location, handling notes, and optional photos (`/harvests/new`). The record is persisted to Supabase PostgreSQL, returning its permanent record ID.
2. **AI & Agronomic Assessment**: The farmer views the visual assessment (`/harvests/[id]`), showing visible produce condition, maturity tier, and defect analysis, with explicit disclosures of appraisal limitations.
3. **Transparent Pathways Comparison**: The farmer compares feasible next moves (`/harvests/[id]/compare`):
   - **Sell Now**: Immediate farmgate or wholesale liquidation.
   - **Cold Storage Buffer**: Holding in certified cold storage (11–13°C) with full disclosure of storage tariffs (KSh 3.20/kg/day), handling fees, transpiration shrinkage (2–4%), and the required break-even price.
   - **Solar Dehydration / Preservation**: Solar drying to extend shelf life for shelf-stable aggregation.
4. **Storage Discovery & Dynamic Reservation**: The farmer discovers certified regional facilities (`/storage?harvestId=...`), compares verified telemetry, commodity suitability, and available headroom, and requests a capacity reservation (`/storage/[facilityId]/request`). Real UUIDs are persisted to `/api/reservations`.
5. **Transport Dispatch**: When collection is requested, a transport job is dispatched (`/api/transport-jobs`) linking the farmgate location to the cold room hub.
6. **Intake Weighbridge & Tare Discrepancy Gate**: Upon cold room arrival, the facility operator records the intake gross and tare scale weights (`/storage/inventory`). A variance greater than 5% triggers an audit reconciliation flag before admission.
7. **Stored Inventory & Settlement Separation**: The admitted batch enters the cold room inventory ledger. Farmers can review buyer offers (`/offers?harvestId=...`). When an offer is accepted, funds are escrowed; physical produce release requires cold-room operator sign-off and a valid release passcode.

---

## Workspaces & Role Navigation Model

Workspaces are server-enforced and derived directly from the authenticated user's approved profile in Supabase PostgreSQL:

- **Public Website**: Landing, How It Works, For Farmers, For Buyers, Sign In.
- **Farmer Workspace**: Home (`/dashboard`), My Harvests (`/harvests`), Register Harvest (`/harvests/new`), Pathways Comparison (`/harvests/[id]/compare`), Certified Storage (`/storage`), Reservations (`/storage/requests`), Offers & Marketplace (`/offers`), Profile (`/profile`).
- **Buyer Workspace**: Overview (`/marketplace`), Produce Lots, Offers & Purchases (`/offers`), Logistics Tracking (`/transport`), Account (`/profile`).
- **Facility Operator Workspace**: Operations (`/partners`), Stored Inventory & Weighbridge (`/storage/inventory`), Incoming Requests (`/storage/requests`), Storage Telemetry & Alerts (`/storage/alerts`), Account (`/profile`).
- **Transport Provider Workspace**: Collections & Deliveries (`/transport`), Tracking (`/transport/requests/[requestId]`), Account (`/profile`).

Role spoofing is prohibited: `AppShell` verifies the session on the server via `resolveAuthContext()` and checks `allowedRoles`.

---

## Authoritative Demo Personas

The application includes 4 pre-seeded demo accounts in Supabase Auth and the `profiles` table:

| Persona | Email | Password | Role | Geography |
| :--- | :--- | :--- | :--- | :--- |
| **Farmer** | `farmer@kavandor.ag` | `Password123!` | `farmer` | Nyakundi Farm, Kisii |
| **Buyer** | `buyer@kavandor.ag` | `Password123!` | `buyer` | FreshLink Supermarkets, Kisii |
| **Facility Operator** | `operator@kavandor.ag` | `Password123!` | `facility_operator` | Kisii Central Cold Store Hub |
| **Transport Provider** | `transporter@kavandor.ag` | `Password123!` | `transport_provider` | Kisii Ag Fleet |

A quick session switcher is embedded in the navigation bar to allow instant switching between all four authentic roles during demonstrations.

---

## Immutable Domain Rules

1. **Atomic Capacity Conservation**: Total Capacity = Available + Reserved + Occupied. Storage allocation ledgers mutate strictly through validated server transactions and PostgreSQL constraints.
2. **Separation of Physical and Financial States**: Accepting a buyer offer locks capacity in escrow; buyer payment clearance funds escrow; physical release strictly requires facility operator weighbridge verification and release passcode.
3. **Honest Storage Economics**: Storage is never presented as an automatic windfall. Cost breakdowns disclose daily refrigeration tariffs, packhouse handling, moisture shrinkage, and calculated break-even selling prices.
4. **AI Boundaries**: Google Gemini 2.5 Flash analyzes visible produce condition and defects. AI never fabricates market prices, facility capacity, or guaranteed shelf life.
5. **Color System & Design Tokens**: Electric Orange (`#FF5A1F`), Premium Charcoal (`#17191D`), Warm Paper (`#F6F3EC`).

---

## Quality & Verification Commands

```bash
# ESLint (0 errors, 0 warnings enforced)
npm run lint

# TypeScript strict typechecking (0 errors)
npm run typecheck

# Vitest test suite (All unit, calculation, validation, AI, and Supabase integration tests)
npm test

# Production Next.js Turbopack build
npm run build
```

---

## Local Development & Setup

1. Install Node.js dependencies: `npm install`
2. Configure `.env.local` with Supabase and Gemini credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_PROVIDER_API_KEY` (Google Gemini API key)
3. Apply database migrations:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage_and_mobility.sql`
   - `supabase/migrations/003_production_backend.sql`
4. Start development server: `npm run dev` (runs on `http://localhost:3000`).
