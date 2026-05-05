# Prodigi Migration Audit
**Date:** 2026-05-05  
**Scope:** Static code read of the existing Stripe → Printify pipeline. No code was modified.

---

## 1. Current pipeline overview

```
Browser cart (localStorage)
        │
        │ POST /api/checkout  { items: [{productId, variantId, quantity}] }
        ▼
src/app/api/checkout/route.ts
  • Calls getProductById() (Printify API) for each item → resolves title, price, image
  • Builds Stripe price_data line items
  • Attaches per-line metadata: printify_product_id, printify_variant_id
  • Encodes session-level metadata: order_items = "pid:vid:qty|pid:vid:qty"
  • Creates Stripe Checkout Session (mode: 'payment', shipping_address_collection enabled)
  • Returns { url } → browser redirects to Stripe-hosted checkout
        │
        │ Stripe processes payment
        ▼
Stripe sends POST to /api/webhook  (checkout.session.completed)
        │
src/app/api/webhook/route.ts
  • Verifies stripe-signature via constructEvent()
  • Checks payment_status === 'paid'
  • Parses session.metadata.order_items → [{product_id, variant_id, quantity}]
  • Reads shipping from session.collected_information.shipping_details
  • Calls submitOrderToPrintify() → POST https://api.printify.com/v1/shops/{shopId}/orders.json
  • Returns 200 (always — even on Printify failure)
        │
        │ Printify fulfils order; sends its own native shipping email to customer
        ▼
Browser redirected to /shop/order-confirmed?session_id={id}
  • Server component retrieves Stripe session (expand: line_items)
  • Displays receipt from Stripe data only — no Printify order ID surfaced
```

Auxiliary Printify routes (catalogue management, not order flow):
- `src/app/api/printify-publish/route.ts` — admin-triggered product publish
- `src/app/api/printify-webhook/route.ts` — receives Printify publish/delete events

---

## 2. Cart state shape

**`CartItem` type** (`src/lib/cart.tsx:14`):

```ts
interface CartItem {
  productId: string       // Printify MongoDB ObjectID (24 hex chars)
  variantId: number       // Printify integer variant ID
  productTitle: string    // display — resolved from Printify API at add-to-cart time
  variantLabel: string    // display — e.g. "Black / L"
  price: number           // retail price in cents
  imageUrl: string | null
  quantity: number
}
```

**Persistence:** `useReducer` state in `CartProvider`, serialised to `localStorage` under key `studiotj_cart` on every change (`src/lib/cart.tsx:107`, `129–135`). Loaded back via `useEffect` after hydration to avoid SSR mismatch. **Cart survives page reloads.**

**Sent to `/api/checkout`** (`src/components/CartDrawer.tsx:22–27`):  
Only `{ productId, variantId, quantity }` — display fields (`productTitle`, `variantLabel`, `price`, `imageUrl`) are not sent to the server. The checkout route re-resolves price and name from the Printify API live.

**Stripe Checkout serialisation** (`src/app/api/checkout/route.ts:91`):  
Session-level metadata value `order_items` = `"productId:variantId:qty|productId:variantId:qty|..."`.  
No per-line-item metadata survives past checkout; the session metadata string is the only source of product identity in the webhook.

---

## 3. Stripe Checkout creation

**File:** `src/app/api/checkout/route.ts`  
**Function:** default `POST` export.

**Input:** `body.items: CartItemInput[]` where `CartItemInput = { productId: string, variantId: number, quantity: number }`.

**What the function does:**
1. For each item calls `getProductById(productId)` — live Printify API call.
2. Verifies variant exists and `is_enabled === true`.
3. Selects first variant-matched or default image for line item thumbnail.
4. Builds `price_data` (not a saved Stripe Price object) with `currency: 'eur'`, `unit_amount: variant.price` (Printify's retail price in cents), and:
   ```ts
   product_data: {
     name: `${product.title} — ${variant.title}`,
     description: product.description stripped of HTML, capped at 500 chars,
     images: [image.src],          // Printify CDN URL
     metadata: {
       printify_product_id: productId,
       printify_variant_id: String(variantId),
     }
   }
   ```
5. Builds session-level `metadata.order_items` string.
6. Calls `stripe.checkout.sessions.create()` with:
   - `mode: 'payment'`
   - `shipping_address_collection.allowed_countries`: 21 countries (NL, BE, DE, FR, GB, IT, ES, AT, CH, DK, SE, NO, FI, PL, PT, IE, US, CA, AU, NZ, JP)
   - Two `shipping_options`: standard at €4.99 (5–10 bd), free at €0 (7–14 bd — labelled "orders over €75" but unenforced programmatically)
   - `success_url`: `${SITE_URL}/shop/order-confirmed?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url`: `${SITE_URL}/shop`

**Stripe SDK version:** `stripe@^21.0.1` (package.json). No `apiVersion` is passed to the `Stripe()` constructor, so the SDK's bundled API version applies.

**Env vars consumed here:** `STRIPE_SECRET_KEY`, `SITE_URL` (falls back to `req.headers.origin` then `http://localhost:3000`), `PRINTIFY_API_TOKEN`, `PRINTIFY_SHOP_ID` (via `getProductById`).

---

## 4. Webhook handler

**File:** `src/app/api/webhook/route.ts`  
**Route:** `POST /api/webhook`

Step by step:

1. **Env guard:** checks `STRIPE_WEBHOOK_SECRET` is set; returns 500 if not.
2. **Raw body:** reads `req.text()` — App Router does not auto-parse, so raw bytes are preserved for HMAC.
3. **Signature verification:** `stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)`. Returns 400 on failure.
4. **Event filter:** only processes `checkout.session.completed`; all other events return `{ received: true }` immediately.
5. **Payment guard:** skips if `session.payment_status !== 'paid'`.
6. **Metadata extraction:** reads `session.metadata.order_items`, splits on `|`, then on `:` to produce `[{ product_id, variant_id: Number, quantity: Number }]`.
7. **Shipping extraction:** reads `session.collected_information.shipping_details` (Stripe SDK v21 shape). Returns 400 if address or name is absent.
8. **Name split:** `splitName(full)` — splits on whitespace; last_name falls back to first_name for single-word names.
9. **Printify call:** `await submitOrderToPrintify({ external_id: session.id, label: "Order {last8}", line_items, shipping_method: 1, send_shipping_notification: true, address_to: {...} })`.
10. **Error handling:** Printify errors are caught, logged via `console.error`, and **silently swallowed** — the handler still returns `{ received: true }` with HTTP 200. Stripe will not retry. There is no email, no admin notification, no Stripe metadata update, no refund trigger.
11. **Response:** always `{ received: true }` 200 for all handled events.

**Error paths today:**
- Missing `STRIPE_WEBHOOK_SECRET` → 500 (but this would be a config error)
- Bad signature → 400 (expected — replay attacks, misconfigured endpoint)
- Missing `order_items` metadata → 400 (should not happen if checkout route is correct)
- Missing shipping address → 400
- Printify failure → **200 + log only** — order is lost silently

---

## 5. Printify integration surface

**File:** `src/lib/printify.ts`

**Env vars consumed:** `PRINTIFY_API_TOKEN`, `PRINTIFY_SHOP_ID` (read inside `printifyFetch` and repeated inside each exported function that builds paths — `getProducts`, `getProductById`, `submitOrderToPrintify`).

**Ghost product workaround** (`src/lib/printify.ts:8–10`):  
```ts
const PRINTIFY_IGNORE_PRODUCT_IDS = new Set<string>([
  '69caabaebd3379c82a0f43ed', // Azure Ascent The Hague Unisex Tee — ghosted in list endpoint
])
```
Applied in `getProducts()` at step 2 before detail fetching. Comment explains: these products appear in the list endpoint but 404 on detail/delete; Printify's server-side state is corrupt. Filtering is purely defensive.

**Exported functions:**

| Function | Signature | Purpose |
|---|---|---|
| `getProducts()` | `() => Promise<PrintifyProduct[]>` | List + detail (10-concurrent batches) + filter: `external.id` present AND ≥1 enabled variant |
| `getProductById(id)` | `(string) => Promise<PrintifyProduct \| null>` | Single product detail; returns null on any error |
| `submitOrderToPrintify(order)` | see below | POSTs to `/shops/${shopId}/orders.json` |
| `getEnabledVariants(product)` | helper | filters `is_enabled && is_available` |
| `getPriceRange(product)` | helper | min/max price across enabled variants |
| `formatPrice(cents, currency?)` | helper | cents → `"€24,99"` (nl-NL locale) |
| `getDefaultImage(product)` | helper | first default or first image |

**`submitOrderToPrintify` input shape:**
```ts
{
  external_id: string           // Stripe session ID
  label: string                 // "Order {last8}"
  line_items: {
    product_id: string          // Printify product ID
    variant_id: number          // Printify variant ID
    quantity: number
  }[]
  shipping_method: 1            // hard-coded standard
  send_shipping_notification: true
  address_to: {
    first_name, last_name, email, phone,
    country, region, address1, address2?,
    city, zip
  }
}
```
The function calls `printifyFetch` which sets `Authorization: Bearer {token}` and throws on non-2xx.

**`printifyFetch` note:** throws `Error("Printify ${status}: ${body}")` on non-2xx. This propagates to the webhook handler's `catch` block where it is swallowed.

---

## 6. Failure handling state

**Current behaviour when Printify returns 4xx or 5xx:**

```ts
// src/app/api/webhook/route.ts:112–116
} catch (err: any) {
  console.error('Failed to submit order to Printify:', err.message)
}
```

- **No email** sent to T.J. or customer.
- **No Stripe metadata update** — no `printify_status` or equivalent written to session.
- **No auto-refund** triggered.
- **No retry** — handler returns 200, telling Stripe the event was received successfully. Stripe will not redeliver.
- **Visibility:** error appears only in Vercel function logs / log drain. If no log drain is configured, the error is invisible after the log retention window.
- There is no admin notification path anywhere in the current codebase.

---

## 7. Resend usage

**Package:** Resend is **not in `package.json`**. No `resend` npm package is installed. Resend is called via raw `fetch()` to the Resend REST API.

**Current Resend surfaces:**

| File | Surface | What it does |
|---|---|---|
| `src/app/api/subscribe/route.ts:46–65` | Newsletter signup | Adds contact to `RESEND_AUDIENCE_ID` via `POST https://api.resend.com/audiences/{id}/contacts` |

**Env vars:** `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`.

**Order confirmation emails:** Do not exist. There is no transactional email for order receipt, order shipped, or order failure anywhere in the current codebase. Shipping notifications are currently handled by Printify's own `send_shipping_notification: true` flag — Printify sends directly to the customer's email from the Stripe session.

**What must be built for Prodigi:** Three new Resend transactional call sites (described in Section 9).

---

## 8. Stripe metadata size analysis

**Today's format:**  
Session metadata key `order_items` = `"productId:variantId:qty|productId:variantId:qty|..."` (a single string value).

**Character budget per item:**
- Printify product ID: 24 chars (MongoDB ObjectID hex)
- Separator `:` — 2 chars
- Variant ID: Printify integers observed as up to ~8 digits — assume 8
- Separator `:` — 1 char
- Quantity: 1–2 digits — assume 2
- Pipe separator between items: 1 char

Per item (except last): `24 + 1 + 8 + 1 + 2 + 1 = 37 chars`. Last item: 36 chars.

**Budget:**
| Cart size | Approx chars | Fits in 500? |
|---|---|---|
| 1 item | 36 | ✓ |
| 5 items | 184 | ✓ |
| 10 items | 369 | ✓ |
| 12 items | 443 | ✓ |
| 13 items | 480 | ✓ |
| 14 items | **517** | ✗ |

**Stripe limits:** 500 chars per metadata value, 50 keys per metadata object. The session metadata object currently has exactly one key (`order_items`), well within the 50-key limit.

**Risk today:** A cart with 14+ distinct line items would exceed the 500-char limit and crash the checkout route with a Stripe API error. In practice this is unlikely given the current single-product storefront, but the constraint exists.

**Prodigi impact:** The target architecture resolves Prodigi order details (SKU, assets, print areas, regional routing) from the static local catalogue by product slug at webhook time — not from Stripe metadata. The `order_items` format does **not** need to change for Prodigi. The metadata budget concern is therefore not a blocker for the migration, but remains a latent limitation for large carts regardless of fulfilment provider.

---

## 9. Per-component delta — replacement plan

| Component | Today (Printify) | Tomorrow (Prodigi) | Change type |
|---|---|---|---|
| **Webhook handler** `src/app/api/webhook/route.ts` | Parses `order_items` → `submitOrderToPrintify()` → swallows errors → returns 200 | Parse same metadata → catalogue lookup by product slug → `resolveLab(country)` + `resolveSku()` → optional `/Quotes` call for lab-dependent assets → POST Prodigi `/Orders` with `idempotencyKey = event.id` → write Prodigi order ID to Stripe metadata → trigger Resend "order received" email → return non-200 on transient failure | **Rewrite** |
| **Order POST** `src/lib/printify.ts` → `submitOrderToPrintify` | POST `https://api.printify.com/v1/shops/${shopId}/orders.json` with Printify-shaped payload | New file `src/lib/prodigi/client.ts` — POST Prodigi `https://api.prodigi.com/v4.0/Orders` with Prodigi-shaped payload (`assets[]`, `printArea`, `pageCount`, `idempotencyKey` header) | **New file** (old function deleted at cutover) |
| **Region routing** (does not exist today) | Printify's `shipping_method: 1` and fulfilment are fully delegated; no region awareness | New file `src/lib/prodigi/routing.ts` — `COUNTRY_TO_LAB`, `resolveLab(country)`, `resolveSku(product, country)` | **New file** |
| **Cart item shape** `src/lib/cart.tsx` | `productId` = Printify MongoDB ObjectID; `variantId` = Printify integer | `productId` = new catalogue slug/ID; `variantId` concept changes — Prodigi SKU resolution happens in webhook, not cart. Cart display fields unchanged | **Extend / rename** (storage key may need bumping to invalidate stale localStorage) |
| **Checkout route** `src/app/api/checkout/route.ts` | Calls `getProductById()` from Printify API live to resolve price, title, image | Replace Printify fetch with static catalogue loader call; price derived from `margin_pct` + Prodigi base cost | **Rewrite** (function signatures change; Stripe session structure identical) |
| **Env vars — Printify** | `PRINTIFY_API_TOKEN`, `PRINTIFY_SHOP_ID`, `PRINTIFY_WEBHOOK_SECRET`, `PRINTIFY_PUBLISH_SECRET` | Delete all four from Vercel and codebase | **Delete** |
| **Env vars — Prodigi** (new) | None | `PRODIGI_API_KEY` (sandbox → live at cutover); optionally `PRODIGI_SANDBOX=true` for sandbox URL routing | **New** |
| **Order-confirmed page** `src/app/shop/order-confirmed/page.tsx` | Reads Stripe session only (`line_items`, `customer_details`, `shipping_cost`, `amount_total`) — no Printify data referenced | No functional change required. Prodigi order ID written to Stripe metadata is not displayed here | **No change** |
| **Shipping email** | Does not exist — delegated to Printify via `send_shipping_notification: true` | New `src/app/api/prodigi-callback/route.ts` receives Prodigi shipment webhook; triggers Resend shipping email template | **New file** |
| **Order-received email** | Does not exist | Add Resend call inside webhook handler after successful Prodigi order creation | **Extend** (webhook handler) |
| **Failure-handling email** | Does not exist | Add Resend "needs attention" email + write `prodigi_status: "needs_attention"` to Stripe metadata on hard rejection; return non-200 on transient failure so Stripe retries | **Extend** (webhook handler) |
| **Ghost-product workaround** `src/lib/printify.ts:8–10` | `PRINTIFY_IGNORE_PRODUCT_IDS` Set filtering `'69caabaebd3379c82a0f43ed'` from list endpoint | Delete entirely — Printify-specific artefact | **Delete** |
| **Printify-webhook route** `src/app/api/printify-webhook/route.ts` | Handles `product:publish:started` (calls `publishing_succeeded`) and `product:deleted` (calls `unpublish`, revalidates Next.js cache) | Delete route — Prodigi has no equivalent publish lifecycle | **Delete** |
| **Printify-publish route** `src/app/api/printify-publish/route.ts` | Admin endpoint `POST /api/printify-publish` — manually triggers Printify product publish with `x-admin-token` auth | Delete route — Prodigi catalogue management does not use a publish step | **Delete** |
| **Product data loader** `src/lib/printify.ts` | `getProducts()`, `getProductById()` — live API calls to Printify for storefront display | Replace with static catalogue loader from `content/products/` JSON files; Prodigi API called only at order time | **New file** (replaces) |
| **User-facing copy** `src/app/shop/[id]/ProductDetail.tsx:368` | `"Printed on demand via Printify. Delivery 5–10 business days. Ships from the nearest fulfilment partner to your address."` | Update copy to remove "via Printify" mention | **Rename / copy edit** |
| **JSON-LD description fallback** `src/app/shop/[id]/page.tsx:12` | `"...shipped worldwide via Printify partners."` | Update copy | **Rename / copy edit** |

---

## 10. Open questions surfaced by the audit

1. **Cart localStorage invalidation at cutover.** Items in customers' active carts use Printify product IDs and variant IDs as keys. When the catalogue switches to Prodigi product slugs, any stale localStorage cart will silently break at checkout (product not found in new catalogue). Is this acceptable given the "restocking" empty state, or should the storage key `studiotj_cart` be bumped to force a clean slate on next visit?

2. **Free-shipping threshold enforcement.** The "Free shipping (orders over €75)" option in the checkout route is a display label only — Stripe does not enforce the threshold programmatically (both options are offered to every customer). Is this intentional? Does the Prodigi migration change anything here, or should a coupon-code or conditional shipping option be added?

3. **Prodigi sandbox keys.** Are sandbox API credentials from Prodigi already available? The sandbox URL differs from production. Before any webhook testing can happen in a staging environment, a `PRODIGI_API_KEY` (sandbox) must exist in Vercel.

4. **Currency.** Checkout is hard-coded EUR throughout (`currency: 'eur'`). Prodigi supports multi-currency and geo-localised pricing. Does the Prodigi migration keep EUR-only, or introduce currency switching at checkout?

5. **Resend transactional templates.** The three new emails (order received, shipped, needs attention) do not exist. Does T.J. want to author HTML templates in Resend's dashboard, or will they be inline React Email / raw HTML in code? This decision affects how the Resend call sites are structured.

6. **Quote-then-Order flow detail.** The architecture specifies calling Prodigi `/Quotes` only when an item carries lab-dependent assets (spine dimensions for photo books, etc.). For the initial launch catalogue (fine art prints, possibly framed prints), does every product type require a Quote call, or can flat-price items skip it? This affects webhook latency.

7. **`product:deleted` cache revalidation replacement.** The Printify webhook handler calls `revalidatePath('/shop')` and `revalidatePath('/shop/{id}')` when a product is deleted. With a static catalogue, what is the new invalidation trigger when a product is set `available: false`? A deploy? A manual revalidation endpoint?

8. **Admin UI dependency.** No frontend admin UI was found in the codebase — `printify-publish/route.ts` is a raw API endpoint called externally (e.g. from a script or curl). Confirm there is no external admin tool (dashboard, script, Notion integration, etc.) that hits these Printify routes and would need updating at cutover.

9. **Prodigi callback authentication.** Prodigi delivers shipment callbacks via webhook. What authentication mechanism does Prodigi use (HMAC signature, shared secret query param, IP allowlist)? The new `/api/prodigi-callback` route needs to verify authenticity. Not determinable from code — flag for T.J.

10. **`shipping_method: 1` equivalent.** Printify's `shipping_method: 1` means standard. Prodigi's equivalent is a `shippingMethod` field on the order. The correct Prodigi shipping method code for standard fulfilment must be confirmed with Prodigi docs before the webhook rewrite.

---

## 11. Recommended sequencing

Work must not touch the live pipeline until cutover is ready. Sessions are scoped as isolated Code sessions.

**Session A — Prodigi environment setup** *(pre-requisite for all sandbox testing)*  
Add `PRODIGI_API_KEY` (sandbox) and `PRODIGI_SANDBOX=true` to Vercel environment variables (preview + development). No code change. Confirm sandbox base URL in Prodigi docs. Unblocks all subsequent testing.

**Session B — `src/lib/prodigi/` module** *(can run in parallel with C)*  
Create `src/lib/prodigi/client.ts` (Prodigi API wrapper: `createOrder()`, `createQuote()`, typed request/response shapes) and `src/lib/prodigi/routing.ts` (`COUNTRY_TO_LAB`, `resolveLab`, `resolveSku`). Pure new files — no existing code modified. Can be validated without touching checkout or webhook.

**Session C — Static catalogue schema + loader** *(can run in parallel with B)*  
Define the `Product` discriminated-union type (photo/typography branches per locked schema). Write `src/lib/catalogue.ts` loader from `content/products/` JSON. Seed one photo-print product to validate schema. This unlocks Sessions D and E which both depend on the loader.

**Session D — Checkout route rewrite** *(serialises after C)*  
Replace `getProductById()` Printify API call with catalogue loader. Update line item price assembly (margin-based). Validate end-to-end in Stripe test mode against a seeded product. `src/lib/printify.ts` is left untouched — the old loader is simply no longer called from checkout.

**Session F — Resend email templates** *(can start immediately, in parallel with B/C/D)*  
Install `resend` npm package. Author and register three transactional templates: order received, order shipped, order needs attention. Wire up helper send functions but do not connect them to webhook yet. Can be done without any pipeline code.

**Session E — Webhook rewrite** *(serialises after B, C, D)*  
Replace `submitOrderToPrintify()` with full Prodigi order assembly: catalogue lookup → `resolveLab` → `resolveSku` → conditional `createQuote()` → `createOrder()` with idempotency key → write Prodigi order ID to Stripe metadata → call Resend "order received" (from Session F). Rewrite error handling: transient failures return non-200 (Stripe retries); hard rejections write `prodigi_status: "needs_attention"` to metadata and send Resend admin alert.

**Session G — `/api/prodigi-callback` route** *(serialises after E and F)*  
New endpoint receiving Prodigi shipment webhook. Verify Prodigi signature/secret (confirm auth mechanism with Prodigi docs first — see open question 9). Look up Stripe session by Prodigi order ID. Trigger Resend shipping email to customer.

**Session H — Cutover + cleanup** *(serialises after E, G; must be the final step)*  
Atomic switch:
- Remove `src/lib/printify.ts`
- Delete `src/app/api/printify-webhook/route.ts`
- Delete `src/app/api/printify-publish/route.ts`
- Remove `PRINTIFY_API_TOKEN`, `PRINTIFY_SHOP_ID`, `PRINTIFY_WEBHOOK_SECRET`, `PRINTIFY_PUBLISH_SECRET` from Vercel
- Update `ProductDetail.tsx:368` and `shop/[id]/page.tsx:12` copy
- Bump `localStorage` storage key if stale-cart invalidation is desired (see open question 1)
- Re-register Stripe webhook endpoint if URL changes (it should not — `/api/webhook` route is unchanged)
- Register Prodigi callback URL in Prodigi dashboard pointing to `/api/prodigi-callback`
- Run smoke-test purchase in Stripe test mode against Prodigi sandbox

**Parallelisation summary:**
- A is a pure env/config step — can happen now.
- B and C are independent — run in parallel.
- F (email templates) is independent of all pipeline code — run in parallel with B/C/D.
- D depends on C only.
- E depends on B + C + D (all of them).
- G depends on E + F.
- H is the final gating step — depends on everything.
