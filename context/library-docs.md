# KAVANDOR — Library Usage & Conventions

## 1. Next.js 15 App Router Conventions
- **Routing:** File-system based routing inside `src/app/`.
- **Dynamic Routes:** `src/app/farmer/harvest/[id]/page.tsx`, `src/app/transporter/jobs/[id]/page.tsx`.
- **Route Handlers:** Located in `src/app/api/*` returning `NextResponse.json(...)`.
- **Metadata:** Export `metadata` objects in server layouts with descriptive OpenGraph and title tags.

---

## 2. Tailwind CSS Styling & Custom Utilities
- Tailwind CSS v3/v4 utility-first classes configured to reference our design tokens:
  - `bg-kavandor-orange` (`#FF5A1F`)
  - `bg-kavandor-charcoal` (`#17191D`)
  - `bg-kavandor-elevated` (`#22252A`)
  - `bg-kavandor-paper` (`#F6F3EC`)
  - `text-kavandor-dark` (`#212329`)
  - `text-kavandor-muted` (`#74767B`)
  - `border-kavandor-border` (`#E2DED6`)
- Avoid arbitrary Tailwind values when a predefined token exists.
- Responsive breakpoints: Mobile (`sm: 640px`), Tablet (`md: 768px`), Desktop (`lg: 1024px`, `xl: 1280px`).

---

## 3. Zod Schema Validation
Use Zod for runtime validation of user forms and AI inference responses:
```typescript
import { z } from 'zod';

export const CropAssessmentSchema = z.object({
  cropName: z.string().min(2),
  cropVariety: z.string().optional(),
  conditionGrade: z.enum(['A_PRIME', 'B_STANDARD', 'C_PROCESSING', 'REJECT']),
  visibleDamagePercentage: z.number().min(0).max(100),
  urgencyLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  storageRecommendation: z.string(),
  reasoning: z.string(),
  isLiveInference: z.boolean(),
});
```

---

## 4. State Management: Reactive Context & Storage
- Instead of heavyweight Redux or Zustand setups that complicate Next.js SSR hydration, use a typed React Context provider (`KavandorStoreContext`) with a clean custom hook (`useKavandorStore()`).
- The store automatically synchronizes with browser `localStorage` on mutation.
- Includes a canonical seed reset function:
  ```typescript
  const { state, dispatch, resetToCanonical } = useKavandorStore();
  ```
- Ensures seamless state propagation across multiple open tabs and role switches.
