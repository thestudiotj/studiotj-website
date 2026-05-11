# Order Pipeline — StudioTJ Shop

**Last updated:** 2026-05-11 (Session 12 — Prodigi Verification Audit)

---

## Pipeline overview

```
Customer selects variant → adds to cart (localStorage)
            │
            │  POST /api/checkout  { items: [{productId, price, quantity}] }
            ▼
src/app/api/checkout/route.ts
  • Resolves each productId → variant via getVariantForCheckout()
  • Server-side price validation via verifyPrice() (± 10c tolerance)
  • Calls Prodigi /quotes for shipping cost (falls back to flat rate)
  • Creates Stripe Checkout Session with price_data (inline, no saved Price objects)
  • Encodes order_items = "variantId:qty|variantId:qty" in session metadata
  • Returns { url } → browser redirects to Stripe-hosted checkout
            │
            │  Customer pays (test card 4242 4242 4242 4242)
            ▼
Stripe sends POST /api/webhook  (checkout.session.completed)
            │
src/app/api/webhook/route.ts
  • Verifies stripe-signature via constructEvent()
  • Checks payment_status === 'paid'
  • Parses session.metadata.order_items → [{variantId, quantity}]
  • Reads shipping details from session.collected_information.shipping_details
  • Calls getProductBySlug(variantId) → CheckoutProduct (SKU + print_areas)
  • Calls resolveSku(product, shipToCountry) → Prodigi SKU (lab-based routing)
  • Constructs Prodigi order with idempotencyKey = Stripe event.id
  • POSTs to Prodigi /v4.0/Orders
  • Writes prodigi_order_id + prodigi_status to Stripe session metadata
  • Sends OrderReceived email via Resend (best-effort)
  • Returns 503 on transient Prodigi failures (triggers Stripe retry)
  • Returns 200 + writes needs_attention + sends admin alert on hard rejections
```

---

## Variant context in the webhook

The webhook receives **variant IDs** (not Stripe Price IDs) via `session.metadata.order_items`.
The checkout route uses inline `price_data` rather than persistent Stripe Price objects, so
there are no Stripe Price IDs to reference. Each variant ID like
`photo-atmospheric-leiden-017-can-16x12` encodes enough information to look up both the
Prodigi SKU and the photo asset.

The webhook calls `getProductBySlug(variantId)` which resolves via `getVariantForCheckout()`,
returning a `CheckoutProduct` with:
- `prodigi_sku` = the variant's Prodigi SKU string
- `print_areas` = the group's print area array (shared across all variants of the same photo/format)

---

## SKU resolution

`resolveSku(product, country)` resolves via:
1. `product.regional_skus[lab]` if present (not used in v1 catalogue — all grouped products use a single global SKU)
2. `product.prodigi_sku` as fallback (the variant's `sku` field from MDX)

Lab routing: EU→EU lab, GB→UK lab, US→US lab, AU+NZ→AU lab, all others→US lab (fallback).

---

## Photo asset URL construction

`imageUrl(area.default_asset_r2)` in `src/lib/checkout/images.ts`:
- If the path starts with `http://` or `https://`: returned as-is
- Otherwise: `https://photos.studiotj.com/{r2path}` (strips leading slashes)

All v1 catalogue products use paths like `print/photography/{collection}/{photo-id}/master.jpg`.
These must exist at `https://photos.studiotj.com/print/photography/…` before the shop can
process real orders. **As of 2026-05-11 these paths are 404 — upload to R2 is pending.**

---

## Quantity, address, and email

| Field | Source |
|---|---|
| Quantity | `order_items` metadata, encoded as `variantId:qty` |
| Shipping name | `session.collected_information.shipping_details.name` |
| Shipping address | `session.collected_information.shipping_details.address` |
| Customer email | `session.customer_details.email` |

---

## Error handling

| Condition | Behaviour |
|---|---|
| Prodigi 5xx / 429 (transient) | Return 503 → Stripe retries up to 3× with backoff |
| Prodigi 4xx (hard rejection) | Return 200 + write `needs_attention` + send admin email |
| Prodigi `OnHold` / `Failed` outcome | Same as hard rejection |
| Stripe metadata write fails | Return 503 → Stripe retries; Prodigi returns `AlreadyExists`; metadata self-heals |
| Duplicate delivery (`AlreadyExists`) | Skip OrderReceived email if already `prodigi_status: created` |
| Unknown Prodigi outcome | Return 503 (treated as transient) |

---

## Prodigi SKU catalogue (v1)

38 unique SKUs used across 798 variants. All 38 confirmed active in Prodigi sandbox (2026-05-11).

| Family | Format | SKU pattern | Notes |
|---|---|---|---|
| can | Stretched canvas | `CAN-38MM-SC-{size}`, `CAN-19MM-SC-40x30` | 40×30" uses 19mm bar |
| fap | Classic framed print | `FRA-CLA-HPR-NM-GLA-{size}` | Frame color NOT in SKU — see fragilities |
| hpr | Hahnemühle Photo Rag | `GLOBAL-HPR-{size}` | Global SKU (same lab everywhere) |
| hge | Hahnemühle German Etching | `GLOBAL-HGE-{size}` | Global SKU |
| ema | Enhanced Matte Art | `GLOBAL-FAP-{size}` | "FAP" = Fine Art Paper in Prodigi's taxonomy |
| clp | C-type Lustre Pro | `ART-PAP-LPP-{size}` | Portrait orientation only (16×20, 24×36) |
| gre | Greeting cards | `GLOBAL-GRE-MOH-{size}-BLA-{pack}` | Pack tiers: 10/20/50/100 |
| pos | Postcards | `GLOBAL-POST-MOH-{size}-BLA-{pack}` | Pack tiers: 10/20/50/100 |

---

## Fragilities and known issues

### 1. Frame color and canvas wrap — FIXED (2026-05-11)
FAP variants require a `color` attribute; canvas variants require a `wrap` attribute.
Both are now computed in `resolveProdigiAttributes()` in `src/lib/catalogue/loader.ts`
and passed through `CheckoutProduct.prodigi_attributes` to both the shipping quote
and the Prodigi order item in the webhook.

| Format | Attribute | Values (MDX → Prodigi) |
|---|---|---|
| canvas | `wrap` | always `"ImageWrap"` |
| framed | `color` | `"black"→"black"`, `"natural-oak"→"natural"`, `"white"→"white"` |

Verified against Prodigi sandbox: all 5 combinations accepted (2026-05-11).

### 2. Print assets not in R2 (LAUNCH BLOCKER)
All 798 variants reference `print/photography/…/master.jpg` paths that return 404 on
`https://photos.studiotj.com`. Prodigi would fail when downloading print assets.
Upload of full-resolution master JPEGs is required before live orders can be fulfilled.

### 3. `getProductBySlug` was deprecated in webhook context — FIXED (2026-05-11)
The webhook previously called `getProductBySlug(productId)` which first tries `getGroupById(slug)`.
If a group ID ever ends up in session metadata (shouldn't happen with current checkout code,
which correctly puts variant IDs), the webhook would use the default variant's SKU instead
of the ordered variant's. Low risk in practice; higher risk if checkout code changes.

Fixed: webhook now calls `getVariantForCheckout` directly.

### 4. `regional_skus` not populated for grouped products
`getVariantForCheckout` doesn't populate `regional_skus` on `CheckoutProduct`, so
`resolveSku` always uses the flat `prodigi_sku`. If any future grouped product needs regional
SKU routing (e.g., different SKU for UK lab), the MDX `regional_skus` field would be
silently ignored. The v1 catalogue doesn't need this, but it's a hidden coupling.

### 5. No validation that print_areas is non-empty in webhook
The checkout route validates `print_areas[0]` before creating the Stripe session, but
the webhook does not re-validate. If a product's MDX is malformed (missing print_areas),
the webhook would produce a Prodigi order with no assets (which Prodigi would reject as
a 4xx). The hard-rejection path handles this, but no admin alert would name the cause.

---

## Verification approach

This pipeline was audited using `scripts/audit-prodigi.mjs` (2026-05-11), which:
1. Parsed all 174 non-book/non-calendar MDX files in `content/products/`
2. Verified prices: `price_cents == round(base_prices.EU × (1 + margin_pct/100) × 100)` ± 10c
3. Verified each unique Prodigi SKU via Prodigi sandbox API
4. Checked photo asset URLs via HEAD request to `https://photos.studiotj.com/…`
5. Would parse JPEG dimensions from Range GET to verify DPI adequacy (blocked by #2 above)

To re-run after photo upload:
```bash
node scripts/audit-prodigi.mjs
```

Output: `_audit/prodigi-verification.csv`

---

## Future catalogue additions — checklist

When adding a new product to `content/products/`:
1. Set `default_asset_r2` to the R2 path where the print-ready master JPEG will live
2. Upload the JPEG to R2 before setting `available: true`
3. Confirm the Prodigi SKU exists in sandbox via the audit script
4. Verify `price_cents` matches `round(base_prices.EU × (1 + margin_pct/100) × 100)`
5. For framed prints: confirm frame color handling with Prodigi (SKU vs attributes)
6. Run `tsc --noEmit && next build` to catch schema errors
