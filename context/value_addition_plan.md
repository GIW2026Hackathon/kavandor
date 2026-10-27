# KAVANDOR: AI-Assisted Agricultural Value-Addition Platform
## Concise Implementation Plan & Architecture Specification

### Executive Objective
Evolve KAVANDOR from a cold-storage-centric workflow into an **AI-assisted agricultural value-addition platform** for smallholder and commercial farmers in Kenya (Kisii & Nyamira corridor). The platform empowers farmers to evaluate and capture maximum value across multiple realistic pathways:
1. **Direct Wholesale / Retail Liquidation**
2. **Quality Grading & Packhouse Sorting**
3. **Agro-Processing & Transformation** (e.g. tomato paste/puree, avocado oil extraction, banana flour/chips)
4. **Solar Dehydration & Drying Preservation**
5. **Cooperative Aggregation & Collective Bargaining**
6. **Dairy Chilling & Collection Center Intake**
7. **Certified Climate-Controlled Cold Storage**
8. **Inter-County Transport & Farmgate Haulage Dispatch**

---

### Phase 1: Audit & Architectural Foundations
#### What exists and will be preserved:
- Multi-step harvest intake wizard (`src/components/harvest/intake-wizard.tsx`).
- Google Gemini multimodal vision assessment with deterministic fallback (`src/lib/ai.ts`).
- Server-enforced authentication with role-based profiles (`src/lib/auth-server.ts`).
- Supabase PostgreSQL persistence with fallback in-memory database adapter (`src/lib/database-adapter.ts`, `src/lib/server-backend.ts`).
- Net proceeds deterministic calculations (`src/calculations/netProceeds.ts`).

#### Risky Assumptions & Mitigations:
1. **Assumption:** All commodities have cold storage facilities available in Kisii.
   *Correction & Mitigation:* Highly perishable crops like tomatoes have 1-2 cold rooms, but mangoes, avocados, bananas, and dairy often seek processing, drying, or cooperative aggregation. Storage must never be hard-coded as the top recommendation. Recommendation order must be determined strictly by **objective suitability score**.
2. **Assumption:** Farmers provide complete information at initial intake.
   *Correction & Mitigation:* Smallholders often omit crucial variables (exact ripeness stage, post-harvest delay, transport availability, target buyers). The engine must flag critical missing data, ask targeted clarification questions, persist responses, and re-compute pathway feasibility.
3. **Assumption:** Processing fees and market prices are uniform.
   *Correction & Mitigation:* When exact provider rates or live spot market prices are unavailable, the platform must explicitly label pathways as **"Quote Required"** or **"Estimate Subject to Verification"**, never fabricating false certainty.

---

### Phase 2: Harvest Intake & Clarification Engine
1. **Commodity-Specific Intake Context:**
   - Extend the intake wizard with contextual options for horticulture (ripeness stage: green, breaker, turning, ripe), dairy (morning vs evening milking, volume in litres, chilled vs raw), grains (field-dry vs freshly shelled), and root crops.
2. **Missing Information & Clarification Loop:**
   - In `src/lib/ai.ts` and `src/lib/orchestrator.ts`, evaluate if critical parameters are missing.
   - If missing, generate 1–3 structured clarification questions with selectable options (e.g., "What is your target sale window?" or "Has the batch been sorted for mechanical damage?").
   - Persist questions and farmer answers in Supabase / in-memory store.
   - Re-rank pathways dynamically once answers are submitted.
3. **Evidence & Truth Categorization:**
   - Explicitly label data points into 5 distinct categories:
     - *Visual Observations* (from uploaded photo or field photo)
     - *Farmer-Reported Facts* (from intake inputs & clarification answers)
     - *Verified Provider Info* (from certified regional providers)
     - *Estimates & Projections* (calibrated economic formulas)
     - *Unknowns / Needs Verification* (unquoted fees, uninspected internal pulp)

---

### Phase 3: Value-Addition Decision Engine
1. **Universal Value-Addition Evaluator (`src/lib/value-addition-engine.ts`):**
   - Implements deterministic evaluation across all 8 pathways:
     - `direct_sale`
     - `sorting_grading`
     - `processing_transformation`
     - `drying_preservation`
     - `aggregation_coop`
     - `dairy_chilling`
     - `cold_storage`
   - Computes:
     - `feasibility`: Boolean
     - `suitabilityScore`: 0–100 (determines display ranking)
     - `suitabilityTier`: 'highly_recommended' | 'feasible' | 'requires_verification' | 'infeasible'
     - `grossRevenueKES`: Number or null (if price unknown)
     - `deductionsKES`: Number (transport, processing fees, storage tariffs, commission)
     - `estimatedNetKES`: Number or null
     - `yieldRetentionPercent`: Number (e.g., 100% for direct sale, 18% for drying, 45% for paste)
     - `breakEvenTargetPriceKES`: Minimum selling price to outperform immediate farmgate sale
     - `assumptions`: Array of strings
     - `unknowns`: Array of strings
     - `requiredInfo`: Array of strings
2. **AI Interpretation & Narrative:**
   - Uses Gemini (or agronomic fallback) to explain trade-offs and provide agricultural recommendations without altering financial ledger state.

---

### Phase 4: Provider & Service Discovery Network
1. **Generalized Regional Provider Registry (`src/data/providers.ts`):**
   - Support multiple verified and community providers in Kisii & Nyamira:
     - **Kisii Central Cold Store Hub** (Storage & Pre-cooling)
     - **Nyakoe Agro-Processing & Pulping Center** (Processing: Tomato Puree, Avocado Oil)
     - **Manga Horticulture Farmers Cooperative** (Aggregation & Collective Sourcing)
     - **Keumbu Solar Dehydration Facility** (Drying & Dehydration)
     - **Nyamira Dairy Farmers Co-op Chilling Center** (Dairy Collection & Milk Bulk Chilling)
     - **Kisii Town Quality Packhouse & Grading Bay** (Grading & Export Packaging)
     - **FreshLink Kisii Commercial Sourcing** (Direct Commercial Buyer)
     - **Songa Mobility Fleet** (Verified Haulage & Farmgate Pickup)
2. **Multi-Service Offering Model:**
   - Providers declare multiple services with pricing units (`KES/kg`, `KES/kg/day`, `KES/litre`), minimum batch requirements, turnaround hours, and verified capacity.
3. **Location-Aware Filtering:**
   - Filter by commodity, service type, county, distance from farm, and provider verification status.

---

### Phase 5: Actionable Farmer Experience (End-to-End Flow)
1. **Intake** -> **AI Assessment** -> **Clarification Interaction** -> **Ranked Pathways**.
2. From any pathway, farmer clicks **"Find Matching Providers"** or **"Request Quote / Service"**.
3. Direct pre-filled Service Request modal/page:
   - Farmer specifies required volume, target drop-off/pickup date, and special instructions.
   - Request is recorded with status `'pending'`.
4. Provider Workspace (`/facility` or `/services/requests`):
   - Operator views incoming enquiries.
   - Operator can respond with quote price and scheduled slot (`'quoted'` or `'accepted'`).
5. Farmer Workspace updates dynamically with provider response and accepted terms.

---

### Phase 6: Role-Based Permissions & Workspaces
- Farmer: `/harvests`, `/harvests/[id]`, `/harvests/[id]/compare`, `/storage/requests`
- Provider/Operator: `/facility`, `/storage/inventory`, `/storage/requests`, `/storage/alerts`
- Buyer: `/marketplace`, `/offers`
- Transporter: `/transport`, `/transport/requests/[requestId]`
- Operations Admin: `/dashboard`, `/profile`, `/partners`

---

### Phase 7: Verification & Testing
- Vitest suite for:
  - Value-Addition Engine pathway calculations & yield retention
  - Commodity-specific validation & clarification generation
  - Provider matching & filtering
  - Service request status transitions
  - Role authorization boundaries
- Full build validation (`npm run build`).
