# Session 12a Summary — Catalogue Population

**Date:** 2026-05-10  
**Status:** Complete

---

## What was done

- Added `AU` lab to all Lab enums/types:
  - `src/lib/catalogue/types.ts`
  - `src/lib/prodigi/types.ts`
  - `src/lib/prodigi/routing.ts` (AU→AU lab, NZ→AU lab)
  - `src/lib/checkout/pricing.ts` (ALL_LABS array + `getLabBasePrice` stub)
- Added optional `base_prices` (EU/UK/US/AU number) and `size` string to product Zod schema
- Wired `/shop` to live products (`src/app/shop/page.tsx`) with collection filter buttons (`src/components/ShopGrid.tsx`)
- Wrote `scripts/generate-products.py` and ran it in 5 batches

---

## Generated file counts

| Batch | Files |
|---|---|
| Signature collection (5 photos) | 251 |
| Monochrome Moods (4 photos) | 256 |
| Atmospheric (7 photos) | 448 |
| Halcyon (11 photos) | 704 |
| Collection stubs — books/calendars (all `available: false`) | 36 |
| **Total** | **1,695** |

---

## CRITICAL: All pricing is placeholder

`base_prices` and `price_cents` in every generated file are estimates. Real values must come from the Prodigi CSVs at `/mnt/user-data/uploads/prodigi-*.csv` (38 files) on the Hetzner server. Not accessible from the Windows dev machine — must verify before launch.

Pricing formula: `price_cents = round(base_prices["UK"] × (1 + margin_pct/100) × 100)`

---

## Lab-native currency note

`base_prices` keys hold prices in the **serving lab's native currency**:

| Key | Lab | Currency |
|---|---|---|
| EU | UK lab | GBP |
| UK | UK lab | GBP |
| US | US lab | USD (some products use DE lab EUR) |
| AU | AU lab | AUD (exception: hardcover books use DE lab EUR) |

---

## Subtractive overrides applied

- **Canvas / framed canvas** excluded for: tight crop, edge subject, centered subject
- **Greeting cards / postcards** excluded if mood lacks: warm, serene, contemplative, atmospheric, quiet, golden hour
- Signature photos TheHague-187/194/218 had no-cards flag → 41 SKUs each; all others got full 64 SKUs

---

## Acceptance criteria results

- `tsc --noEmit` — clean ✓
- `next build` — clean, 556 static pages ✓
- `/shop` statically rendered, collection filter working ✓
- Pricing arithmetic spot-checked for 5 products ✓
- No orphan or duplicate files ✓

---

## Next sessions

| Session | Work |
|---|---|
| **12b** | Mockup generation via Prodigi endpoint; R2 uploads; replace `/placeholder/*.webp` hero_image URLs |
| **12c** | 12-photo book sequences per collection; calendar curation; set book/calendar stubs to `available: true` |
| **Session H** | Printify removal, cart localStorage version bump, Prodigi callback URL |

---

## Performance note

~1,659 available products currently render all at once in ShopGrid. Pagination or virtual scrolling needed before public launch.
