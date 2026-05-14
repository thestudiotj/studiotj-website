import { z } from "zod"

// ─── Shared primitives ────────────────────────────────────────────────────────

export const labSchema = z.enum(["EU", "UK", "US", "AU"])
export type Lab = z.infer<typeof labSchema>

// base_prices keys are the customer's shipping region.
const basePricesSchema = z.object({
  EU: z.number().nonnegative().optional(),
  UK: z.number().nonnegative().optional(),
  US: z.number().nonnegative().optional(),
  AU: z.number().nonnegative().optional(),
})
export type ProductBasePrices = z.infer<typeof basePricesSchema>

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expect YYYY-MM-DD")

const regionalSkusSchema = z
  .object({
    EU: z.string().optional(),
    UK: z.string().optional(),
    US: z.string().optional(),
    AU: z.string().optional(),
  })
  .partial()

const regionalAssetsSchema = z
  .object({
    EU: z.string().optional(),
    UK: z.string().optional(),
    US: z.string().optional(),
    AU: z.string().optional(),
  })
  .partial()

export const printAreaSchema = z.object({
  slot: z.string().min(1),
  default_asset_r2: z.string().min(1),
  page_count: z.number().int().positive().optional(),
  regional_assets: regionalAssetsSchema.optional(),
})
export type PrintArea = z.infer<typeof printAreaSchema>

// ─── Grouped product (new canonical format) ───────────────────────────────────

export const productVariantSchema = z.object({
  variantId: z.string().min(1),
  size: z.string().min(1),
  size_label: z.string().min(1),
  color: z.string().optional(),         // fap: "black" | "natural-oak" | "white"
  pack: z.number().int().positive().optional(), // gre/pos: 10 | 20 | 50 | 100
  orientation: z.string().optional(),   // "landscape" | "portrait" | ""
  sku: z.string().min(1),
  price_cents: z.number().int().positive(),
  base_prices: basePricesSchema.optional(),
  hero: z.string().optional(),
  mock1: z.string().optional(),
  mock2: z.string().optional(),
})
export type ProductVariant = z.infer<typeof productVariantSchema>

export const groupedProductSchema = z.object({
  type: z.literal("grouped"),
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  photo_url: z.string().nullable().optional(),
  example_image: z.string().nullable().optional(),
  available: z.boolean(),
  collection: z.string().min(1),
  photo_id: z.string().nullable().optional(),
  format: z.string().min(1),
  family: z.string().min(1),
  orientation: z.enum(["portrait", "landscape", "square"]).optional(),
  margin_pct: z.number().nonnegative(),
  print_areas: z.array(printAreaSchema).min(1),
  variant_axes: z.array(z.enum(["size", "color", "pack"])).default(["size"]),
  default_variant: z.number().int().nonnegative().default(0),
  variants: z.array(productVariantSchema).min(1),
})
export type GroupedProduct = z.infer<typeof groupedProductSchema>

// ─── Merged group (runtime aggregation) ──────────────────────────────────────
// Built at load time by combining multiple GroupedProducts that share the same
// photo_id and fall under a single "merge umbrella" (paper prints, wall art).
// Display-only — never persisted to MDX. Variant identity is preserved by the
// underlying ProductVariant.variantId, so the cart/checkout/Prodigi flow is
// unaffected.

export type MergeFamily = "paper-prints" | "wall-art-merged"

export interface MergedVariant extends ProductVariant {
  /** Source family code — hpr/hge/ema/clp for paper-prints, can/fap for wall-art-merged. */
  source_family: string
  /** Source GroupedProduct.id this variant originally belonged to. */
  source_group_id: string
}

export interface MergedGroup {
  kind: "merged"
  /** Synthesized id, e.g. "photo-signature-thehague-218-prints". */
  id: string
  title: string
  description: string
  photo_url: string | null | undefined
  example_image: string | null | undefined
  available: boolean
  collection: string
  photo_id: string | null | undefined
  orientation: "portrait" | "landscape" | "square" | undefined
  /** Which umbrella merged these. */
  merge_family: MergeFamily
  /** Underlying GroupedProducts (one per source family present for this photo). */
  sources: GroupedProduct[]
  /** All variants from all sources, tagged with their source family. */
  variants: MergedVariant[]
  /** Ordered list of source families that have at least one variant. */
  source_family_codes: string[]
}

/** Type guard. */
export function isMergedGroup(g: GroupedProduct | MergedGroup): g is MergedGroup {
  return (g as MergedGroup).kind === "merged"
}

/** Anything that can be shown on a shop card or detail page. */
export type DisplayGroup = GroupedProduct | MergedGroup

/** Family codes carried by a DisplayGroup — single-element for standalone
 *  GroupedProducts, multi-element for MergedGroups. */
export function displayGroupFamilyCodes(group: DisplayGroup): readonly string[] {
  return isMergedGroup(group) ? group.source_family_codes : [group.family]
}

// ─── Legacy flat product types (kept for type compatibility, no longer loaded) ─

const baseFields = {
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  hero_image: z.string().min(1),
  prodigi_sku: z.string().optional(),
  regional_skus: regionalSkusSchema.optional(),
  print_areas: z.array(printAreaSchema).min(1),
  margin_pct: z.number().nonnegative(),
  price_cents: z.number().int().positive().optional(),
  base_prices: basePricesSchema.optional(),
  available: z.boolean(),
  created_at: isoDateSchema,
}

const skuRefine = (data: { prodigi_sku?: string; regional_skus?: Record<string, string | undefined> }) =>
  Boolean(data.prodigi_sku) ||
  Boolean(data.regional_skus && Object.keys(data.regional_skus).length > 0)

const skuRefineMessage = {
  message: "Product must have either prodigi_sku or regional_skus",
  path: ["prodigi_sku"],
}

export const photoProductSchema = z
  .object({
    ...baseFields,
    type: z.literal("photo"),
    collection: z.string().min(1),
    photo_id: z.string().nullable(),
    format: z.enum(["paper", "framed", "canvas", "book", "card", "postcard", "calendar"]),
    paper_type: z.string().optional(),
    frame_colour: z.enum(["black", "white", "natural-oak"]).optional(),
    canvas_style: z.enum(["stretched", "framed"]).optional(),
    book_format: z.enum(["hardcover", "softcover", "layflat"]).optional(),
    size: z.string().optional(),
  })
  .refine(skuRefine, skuRefineMessage)

export const typographyProductSchema = z
  .object({
    ...baseFields,
    type: z.literal("typography"),
    phrase_id: z.string().min(1),
    identity_variant: z.enum(["studiotj_light", "studiotj_dark", "subtext_lab"]),
    product_type: z.enum([
      "poster", "card", "postcard", "mug", "cushion", "sticker", "notebook", "calendar", "tote",
    ]),
  })
  .refine(skuRefine, skuRefineMessage)

export const flatProductSchema = z.union([photoProductSchema, typographyProductSchema])
export type FlatProduct = z.infer<typeof flatProductSchema>

// Alias kept for any remaining import sites
export type Product = FlatProduct

// ─── Checkout-compatible product view ─────────────────────────────────────────
// Constructed in the catalogue loader from a GroupedProduct + variant.
// Satisfies what verifyPrice, resolveShipping, and the checkout route need.

export interface CheckoutProduct {
  id: string
  type: string
  available: boolean
  title: string
  description: string
  print_areas: PrintArea[]
  base_prices: ProductBasePrices | undefined
  margin_pct: number
  /** Variant's storefront price in cents (EUR). Authoritative — verifyPrice
   *  compares the claimed cart price against this. Base_prices alone can no
   *  longer reproduce it because GBP-cost-basis variants need FX conversion
   *  (Session 2 formula fix). */
  price_cents: number
  prodigi_sku: string           // variant's SKU for Prodigi shipping quote
  regional_skus?: Record<string, string | undefined>
  /** Attributes required by the Prodigi SKU (e.g. wrap, color). Omitted when empty. */
  prodigi_attributes?: Record<string, string>
}
