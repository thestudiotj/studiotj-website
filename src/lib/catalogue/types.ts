import { z } from "zod"

// ---------- shared primitives

export const labSchema = z.enum(["EU", "UK", "US"])
export type Lab = z.infer<typeof labSchema>

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

const printAreaSchema = z.object({
  slot: z.string().min(1),
  default_asset_r2: z.string().min(1),
  page_count: z.number().int().positive().optional(),
  regional_assets: regionalAssetsSchema.optional(),
})

// ---------- shared base fields (spread into each branch to avoid .and() on ZodEffects)

const baseFields = {
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  hero_image: z.string().min(1),
  prodigi_sku: z.string().optional(),
  regional_skus: regionalSkusSchema.optional(),
  print_areas: z.array(printAreaSchema).min(1),
  margin_pct: z.number().nonnegative(),
  available: z.boolean(),
  created_at: isoDateSchema,
}

const skuRefine = (data: { prodigi_sku?: string; regional_skus?: Record<string, string | undefined> }) =>
  Boolean(data.prodigi_sku) ||
  Boolean(data.regional_skus && Object.keys(data.regional_skus).length > 0)

const skuRefineMessage = {
  message: "Product must have either prodigi_sku (globally cloned) or regional_skus (regional)",
  path: ["prodigi_sku"],
}

// ---------- photo branch

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
  })
  .refine(skuRefine, skuRefineMessage)

// ---------- typography branch

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

// ---------- the union

export const productSchema = z.union([photoProductSchema, typographyProductSchema])

export type Product = z.infer<typeof productSchema>
export type PhotoProduct = Extract<Product, { type: "photo" }>
export type TypographyProduct = Extract<Product, { type: "typography" }>
