# KAVANDOR — Design Tokens & Styling Specs

## 1. Color Palette

| Token Name | Hex Code | Purpose & Semantic Role |
| :--- | :--- | :--- |
| **Electric Orange** | `#FF5A1F` | Distinctive brand signal; primary CTAs, active states, key milestones |
| **Premium Charcoal** | `#17191D` | Authority and depth; hero sections, ops command headers, footer |
| **Elevated Charcoal**| `#22252A` | Secondary dark surface; dark card backgrounds, command console tiles |
| **Warm Paper** | `#F6F3EC` | Natural human warmth; primary background for farmer & marketplace views |
| **Clean White** | `#FFFFFF` | Card containers, modals, table rows, form inputs |
| **Main Dark Text** | `#212329` | High-contrast body text and section titles |
| **Secondary Text** | `#74767B` | Subheadings, metadata, helper text, timestamps |
| **Subtle Borders** | `#E2DED6` | Clean hairline dividers and card borders |
| **Warm Amber** | `#F0B34D` | Warning flags, pending status, medium urgency, reservations |
| **Critical Error** | `#C74636` | Exceptions, spoilage hazard, validation errors, cancellations |
| **Information Blue**| `#426E8C` | Cold-chain indicators, telemetry notes, transporter en-route |

---

## 2. Typography Hierarchy

- **Font Family:** `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif`
- **Headings:**
  - `Display 1`: `text-4xl md:text-5xl font-bold tracking-tight text-[#17191D]` (Hero headline)
  - `H1`: `text-2xl md:text-3xl font-bold tracking-tight text-[#17191D]` (Page headers)
  - `H2`: `text-xl md:text-2xl font-semibold text-[#17191D]` (Section headers)
  - `H3`: `text-lg font-medium text-[#212329]` (Card titles)
- **Body & Data:**
  - `Body Regular`: `text-base text-[#212329] leading-relaxed`
  - `Body Small`: `text-sm text-[#74767B]`
  - `Caption / Monospace`: `text-xs font-mono uppercase tracking-wider text-[#74767B]` (IDs, timestamps, telemetry)

---

## 3. Spacing & Elevation

- **Border Radius:**
  - `Small`: `rounded-md` (4px - 6px) - Badges, small inputs
  - `Medium`: `rounded-lg` (8px - 10px) - Buttons, regular form inputs
  - `Large`: `rounded-xl` (12px - 16px) - Cards, panels, modals
  - `Pill`: `rounded-full` - Status tags, role switcher tabs
- **Shadows:**
  - `Subtle`: `box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)`
  - `Card`: `box-shadow: 0 4px 12px rgba(23,25,29,0.04), 0 1px 3px rgba(23,25,29,0.02)`
  - `Floating`: `box-shadow: 0 12px 32px rgba(23,25,29,0.12), 0 4px 8px rgba(23,25,29,0.06)`
