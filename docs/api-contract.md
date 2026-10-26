# API contract

The project includes a minimal set of working route placeholder APIs to support the core harvest workflow.

## Implemented endpoints

### POST /api/harvests
- Request: crop, quantity, unit, harvestDate, location, handlingNotes, photoUrl
- Response: created harvest object with demo status
- Auth: pending
- Notes: development-only mock API

### POST /api/harvests/[id]/assess
- Request: imageUrl or notes
- Response: assessment object with confidence, observations, defects, and recommendations
- Auth: pending
- Notes: demo assessment fallback when no AI key is configured

### GET /api/harvests/[id]/options
- Response: feasible next actions
- Auth: pending

### GET /api/facilities
- Response: facility list with demo capacity

### POST /api/reservations
- Request: facilityId and quantityKg
- Response: reservation record

### POST /api/transport-jobs
- Response: scheduled job record

### POST /api/offers
- Response: created offer object

### POST /api/inventory-batches
- Response: inventory batch record

### GET /api/marketplace/listings
- Response: demo listings

## Error conventions

- 400: invalid request or bad payload
- 401: not authenticated
- 403: forbidden access
- 404: not found
- 500: unexpected server error
