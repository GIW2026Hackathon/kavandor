# KAVANDOR — Code Standards & Engineering Conventions

## 1. Core Engineering Principles
1. **Honest State Machine:** Never use arbitrary strings like `"status: ok"`. Use strict union types and Zod schemas for all domain states.
2. **Deterministic Fallbacks:** AI should assist, explain, and extract, but core business logic (capacity checks, price calculations, state transitions) must run deterministically.
3. **No Phantom Transitions:** Do not advance a status unless the prerequisite condition and data are verified.
4. **Zero Client Secret Leaks:** Never reference server secrets in client components. All AI calls must pass through `/api/ai/*` route handlers.

---

## 2. TypeScript & Linting Standards
- `strict: true` in `tsconfig.json`.
- No `any` types; use `unknown` with type guards or Zod schema parsing.
- Explicit return types on all exported service functions and API routes.
- Prefer interfaces for domain contracts and type aliases for unions/tuples.

```typescript
// Good: Strict state machine union
export type HarvestStatus = 
  | 'SUBMITTED' 
  | 'ASSESSED' 
  | 'RESERVATION_PENDING' 
  | 'CONFIRMED' 
  | 'DISPATCHED' 
  | 'COLLECTED' 
  | 'RECEIVED' 
  | 'STORED' 
  | 'CLOSED' 
  | 'CANCELLED';

// Bad: Loose string
export interface Harvest {
  status: string; // Forbidden!
}
```

---

## 3. Component Architecture & React Standards
- Favor React Server Components (RSC) for initial page layouts and metadata.
- Mark interactive client components with `'use client';` at the top of the file.
- Keep components focused and modular (< 250 lines). Extract complex forms into dedicated sub-components.
- Use controlled inputs with accessible labels and semantic HTML (`<main>`, `<section>`, `<article>`, `<nav>`).
- Always support keyboard accessibility and readable focus states (`focus-visible:ring-2 focus-visible:ring-[#FF5A1F]`).

---

## 4. Currency, Units & Regional Conventions
- **Currency:** Always format monetary values in Kenyan Shillings using a unified helper:
  ```typescript
  export function formatKES(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  ```
- **Weights:** Express produce quantities in kilograms (`kg`). Convert metric tonnes to kg internally.
- **Distances:** Express distances in kilometers (`km`).
- **Timestamps:** ISO 8601 strings (`2026-10-26T14:30:00+03:00`) rendered in East Africa Time (`EAT`).

---

## 5. Error & Exception Handling
- Service methods must return structured result objects or throw domain-specific errors:
  ```typescript
  export type Result<T, E = string> = 
    | { success: true; data: T } 
    | { success: false; error: E };
  ```
- Every unexpected exception in the logistics pipeline must create an observable `ExceptionRecord` in the shared store, enabling human remediation via `/ops/exceptions`.
