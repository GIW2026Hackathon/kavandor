# Backend API contract

The API is backed by Supabase PostgreSQL, Supabase Auth, and private Supabase Storage. Protected routes accept either a valid Supabase bearer access token (`Authorization: Bearer …`) or the Supabase SSR session cookie. The API derives the user and role from the verified Supabase session and `profiles`; caller-supplied user IDs and role headers are not trusted.

All request bodies are JSON unless marked multipart. Successful responses use the resource key shown below. Errors use `{ "error": { "code": "...", "message": "...", "issues?": ... } }`. Invalid input returns 400, unauthenticated requests 401, unauthorized access 403, missing records 404, invalid state or conflicts 409, and unavailable services 502/503.

## Readiness

| Method and path | Access | Contract |
|---|---|---|
| `GET /api/health` | Public | Probes the public facilities table. Returns 200 only if the Supabase database is reachable; returns 503 when configuration or the dependency is unavailable. |

## Harvest workflow

| Method and path | Access | Request / response |
|---|---|---|
| `POST /api/harvests` | Farmer | JSON: `crop`, `quantity`, `unit`, ISO `harvestDate`, `location`; optional `county`, `variety`, `availability`, `handlingNotes`, UUID `idempotencyKey`. Returns `{ harvest }` (201). Photos are not accepted as URLs. |
| `GET /api/harvests` | Farmer, admin | Returns `{ harvests }`; farmers see their own records. |
| `GET /api/harvests/{id}` | Authenticated roles | Returns `{ harvest }` where RLS permits access. |
| `PATCH /api/harvests/{id}` | Farmer owner | Editable harvest fields: `crop`, `quantity`, `unit`, `harvestDate`, `location`, `handlingNotes`; or `{ "status": "submitted" \| "cancelled" }`. |
| `POST /api/harvests/{id}/photos` | Farmer owner | Multipart form-data with 1–5 `photos` files; JPEG, PNG, or WebP, maximum 10 MiB each. Returns private signed URLs and metadata. |
| `GET /api/harvests/{id}/photos` | Farmer owner, admin | Returns short-lived signed URLs for stored photos. |
| `POST /api/harvests/{id}/assess` | Farmer owner, admin | No body. Saves a structured visible-condition assessment. Without `AI_PROVIDER_API_KEY`, the response is explicitly marked `manual_fallback`, with confidence 0; no condition is inferred. |
| `GET /api/harvests/{id}/options` | Farmer, admin | Returns commodity-compatible facilities, configured future capacity slots, feasibility, and assumptions. `estimatedNet` remains null unless reliable price and cost inputs exist. |
| `GET /api/harvests/{id}/timeline` | Authenticated participants | Returns traceable activity events allowed by RLS. |

## Marketplace and offers

| Method and path | Access | Contract |
|---|---|---|
| `GET /api/marketplace/listings` | Public | Optional `search`, `crop`, `county`, `page`, `pageSize`; returns `{ items, page, pageSize, total }`. |
| `POST /api/marketplace/listings` | Farmer owner | JSON `{ harvestId, unitPrice, source? }`; source is `provider_confirmed`, `provider_reported`, or `manually_entered`. |
| `POST /api/offers` | Approved buyer | JSON `{ harvestId, pricePerKg, quantityKg, idempotencyKey? }`; quantity is checked against the listing. |
| `GET /api/offers` | Farmer, buyer, admin | RLS returns only participant offers (or admin records). |
| `PATCH /api/offers/{id}` | Offer participant | JSON `{ status: "accepted" \| "rejected" \| "withdrawn" \| "expired" }`. Acceptance atomically closes the listing, rejects competing offers, and creates the transaction. Expired offers cannot be accepted. |

## Facilities, reservations, transport, and intake

| Method and path | Access | Contract |
|---|---|---|
| `GET /api/facilities` | Public | Optional `crop`/`commodity`, `county`, and `limit`; results come from database facility records and retain verification/demo markers. |
| `POST /api/facilities` | Admin | Creates a facility and assigns an existing facility-operator profile. New records start unverified. |
| `PATCH /api/facilities/{id}` | Assigned operator, admin | Updates facility details, commodity compatibility, and pricing. Only admins can set verification status. |
| `GET /api/facilities/{id}/capacity-slots` | Authenticated roles | Returns configured windows and calculated available kg. |
| `POST /api/facilities/{id}/capacity-slots` | Assigned operator, admin | JSON `{ capacityKg, windowStart, windowEnd }`; records an explicit capacity window. |
| `POST /api/reservations` | Farmer | JSON `{ harvestId, facilityId, requestedQuantity? \| quantityKg?, requestedStartAt, expectedEndAt, storageRequirements?, transportPreference?, idempotencyKey? }`. Reservation and slot capacity updates are atomic. |
| `GET /api/reservations` | Farmer, assigned operator, admin | Participant reservations. |
| `PATCH /api/reservations/{id}` | Farmer, assigned operator, admin | `{ status: "confirmed" \| "released" \| "completed" }`; role and valid transitions are enforced in the database. |
| `POST /api/transport-jobs` | Farmer | JSON includes `harvestId`, `origin`, `destination`; optionally `storageRequestId`, `requestedQuantity`, `requestedPickupAt`, `loadingInstructions`, `idempotencyKey`. Created as `quote_pending` with manual integration mode. |
| `GET /api/transport-jobs` | Farmer, assigned provider, admin | Participant transport records. |
| `PATCH /api/transport-jobs/{id}` | Farmer participant, assigned provider, admin | `{ status, actualReceivedKg?, discrepancyNotes?, location? }`; delivered status requires actual quantity and provider assignment. |
| `PATCH /api/admin/transport-jobs/{id}` | Admin | `{ providerId }`; assigns a verified transport-provider profile to an unconfirmed request. |
| `POST /api/inventory-batches` | Assigned facility operator, admin | `{ harvestId, facilityId, actualReceivedKg, reservationId?, status?, discrepancyNotes?, idempotencyKey? }`. Stores actual received kg separately from declared harvest quantity and completes the linked confirmed reservation atomically. |
| `GET /api/inventory-batches` | Farmer, assigned operator, admin | Participant inventory receipts. |

## Transactions, costs, notifications, and administration

| Method and path | Access | Contract |
|---|---|---|
| `GET /api/transactions` | Farmer, buyer, admin | Returns participant transactions, cost records, and server-computed gross proceeds/net proceeds when actual received quantity is known. |
| `POST /api/transactions/{id}/costs` | Admin | Manual cost record: `{ costType, description, amount, currency? }`. Currency must match the transaction. |
| `GET /api/payments` | Farmer, buyer, admin | Participant payment ledger; response identifies `manual_records_only`. |
| `POST /api/payments` | Admin | Manually records `{ transactionId, amount, currency?, status? }`. This is a ledger entry, not a payment-provider confirmation. |
| `PATCH /api/payments/{id}` | Admin | Manually updates `{ status }` (`pending`, `paid`, `failed`, `reversed`). |
| `GET /api/notifications` | Authenticated user | Returns the caller's notifications. |
| `PATCH /api/notifications` | Authenticated user | `{ ids: UUID[], read: boolean }`; only the caller's notifications can be changed. |
| `GET /api/profile` | Authenticated user | Returns the caller's profile and role request. |
| `PATCH /api/profile` | Non-admin user | Updates `fullName`, `phone`, or `requestedRole`; does not grant the requested role. |
| `PATCH /api/admin/profiles/{id}/role` | Admin | Assigns an approved role; buyer assignments require `companyName` and `location`. |

## Operational integrations and limits

- Google and Facebook sign-in use Supabase Auth OAuth. Configure client IDs/secrets and provider callback URLs in the Supabase Auth dashboard. App public IDs only enable corresponding UI buttons; provider secrets do not belong in frontend environment variables.
- AI assessment uses the configured OpenAI-compatible vision endpoint only when server-side `AI_PROVIDER_API_KEY` is set. The provider result is schema-validated; provider/network/invalid-response errors fail explicitly.
- Payments and transport are manual workflows only. No live payment, transport quote, facility verification, or third-party confirmation is fabricated.
- Apply migrations in order (`001`, `002`, `003`) before enabling protected API routes. See [database-schema.md](./database-schema.md).
