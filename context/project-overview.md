# KAVANDOR — Project Overview

> **Product Brand:** KAVANDOR  
> **Product Descriptor:** Intelligent Harvest & Supply Network  
> **Tagline:** Every harvest has a next move.  
> **Initial Geography:** Kisii and Nyamira counties, Kenya  
> **Long-Term Ambition:** A trusted agricultural coordination network spanning Kenya and East Africa  

---

## 1. Executive Summary & Mission
KAVANDOR is an AI-agentic post-harvest intelligence and logistics coordination platform engineered to eliminate agricultural post-harvest loss. In East Africa, smallholder farmers lose 30–50% of perishable produce (tomatoes, avocados, bananas, leafy greens) due to fragmented information, missing cold-storage access, volatile local prices, and disjointed transport logistics.

KAVANDOR solves this not with another static directory or basic chatbot, but through an **active agentic coordination network**:
1. **Intake & Vision Assessment:** Farmer uploads produce photo and basic load info.
2. **Suitability & Economic Optimization:** Crop requirements matched against temperature/humidity capabilities, capacity ledgers, and logistics costs.
3. **Automated Dispatch:** Capacity is reserved atomically; compatible transporters are dispatched.
4. **Physical Tracking & Verification:** Milestones tracked from farmgate pickup to cold facility check-in with condition/weight reconciliation.
5. **Smart Marketplace & Settlement:** Stored inventory matched with commercial buyers, managing offer, escrow-ready payment verification, and authorized release.

---

## 2. Target Users & Operating Roles

| Role | Primary User Persona | Core Value Proposition | Primary Workspaces |
| :--- | :--- | :--- | :--- |
| **Farmer** | Smallholder / Outgrower in Kisii & Nyamira | Instant crop triage, guaranteed cold preservation booking, fair transport, direct buyer visibility. | `/farmer` (Mobile-First) |
| **Facility Operator** | Cold-room / Packhouse Manager | Live capacity ledger, incoming delivery queue, barcode/ID intake verification, inventory batches. | `/facility` (Desktop / Tablet) |
| **Transporter** | Boda-boda, pickup, or refrigerated truck driver | Matched local haulage jobs, route visibility, step-by-step proof-of-pickup & delivery transitions. | `/transporter` (Mobile-First) |
| **Buyer / Coop** | Institutional Buyer, Aggregator, Retailer | Verified-quality produce sourcing, multi-batch order consolidation, transparent offer workflows. | `/buyer` (Desktop) |
| **Ops Admin** | Logistics Controller & Network Supervisor | Real-time system telemetry, agent workflow traces, exception resolution center, audit trail. | `/ops` (Mission-Control Desktop) |

---

## 3. Core Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components + Client interactivity)
- **Language:** Strict TypeScript (Target: ES2022, strict null checks)
- **Styling:** Tailwind CSS + Vanilla CSS variables for bespoke design tokens
- **Component Primitives:** Accessible, bespoke custom UI elements (no generic template clutter)
- **Validation:** Zod schemas for domain models, event payloads, and AI outputs
- **State & Storage:** Persistent shared demo repository (Reactive client storage + localStorage persistence + atomic state transitions)
- **AI Engine:** Pluggable AI Provider Abstraction (Google Gemini Vision/Pro, Anthropic, or OpenAI server-side routes) with reliable deterministic fallback fixtures
- **Local Currency:** Kenyan Shillings (KES)
- **Timezone:** East Africa Time (EAT, UTC+3)

---

## 4. Dual Operating Modes

### Mode A: Demo & Simulation (Default Out-of-the-Box)
- Runs 100% deterministically without requiring external API keys or real payment accounts.
- Seeded with realistic Kisii/Nyamira geography, actual local facilities (e.g., Nyakoe Cold Hub, Manga Solar Packhouse, Nyamira AgriCenter), verified routes, and authentic produce varieties.
- Full agentic event orchestration: state transitions, inventory creation, buyer matching, and exception recovery run through the core service layer.
- Demo state persists across browser reloads, with a visible "Reset Demo" button for judges.

### Mode B: AI-Enhanced (Live API Configured)
- Activates when server-side environment variables (`GEMINI_API_KEY` etc.) are supplied.
- Uses real multimodal vision inference for crop triage, condition grading, and dynamic natural language explanations.
- Strict schema validation guards against model hallucinations; invalid responses safely fallback to deterministic engines without breaking user workflows.
- Strictly separates live inference from simulated data in the UI.

---

## 5. Production Boundary & Antigravity Handoff
This build implements the entire frontend, interactive state machine, service abstractions, and mock persistence repository. All service calls are routed through typed interfaces (`IHarvestService`, `IStorageService`, `ITransportService`, `IInventoryService`, `IBuyerService`, `IWorkflowOrchestrator`). 

The next engineering phase will use **Google Antigravity** to swap the mock storage adapter with production PostgreSQL/Prisma backends, live M-Pesa Daraja APIs, Africa's Talking SMS/WhatsApp gateways, and IoT temperature telemetry without rewriting a single UI component.
