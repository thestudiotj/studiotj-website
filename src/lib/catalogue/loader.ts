import fs from "fs"
import path from "path"
import matter from "gray-matter"
import {
  groupedProductSchema,
  type GroupedProduct,
  type ProductVariant,
  type CheckoutProduct,
  type PrintArea,
  type ProductBasePrices,
} from "./types"

const PRODUCTS_DIR = path.join(process.cwd(), "content", "products")

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CatalogueCache {
  groups: GroupedProduct[]
  byId: Map<string, GroupedProduct>
  variantById: Map<string, { group: GroupedProduct; variant: ProductVariant; idx: number }>
}

let cache: CatalogueCache | null = null

function buildCache(): CatalogueCache {
  if (cache) return cache

  const groups: GroupedProduct[] = []
  const byId = new Map<string, GroupedProduct>()
  const variantById = new Map<string, { group: GroupedProduct; variant: ProductVariant; idx: number }>()

  if (!fs.existsSync(PRODUCTS_DIR)) {
    cache = { groups, byId, variantById }
    return cache
  }

  const files = fs.readdirSync(PRODUCTS_DIR).filter((f) => f.endsWith(".mdx") && f !== "README.md")

  for (const file of files) {
    const fullPath = path.join(PRODUCTS_DIR, file)
    const raw = fs.readFileSync(fullPath, "utf-8")
    const { data } = matter(raw)

    const parsed = groupedProductSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(`Invalid grouped product frontmatter in ${file}:\n${parsed.error.toString()}`)
    }

    const group = parsed.data
    groups.push(group)
    byId.set(group.id, group)

    for (let idx = 0; idx < group.variants.length; idx++) {
      const variant = group.variants[idx]
      variantById.set(variant.variantId, { group, variant, idx })
    }
  }

  cache = { groups, byId, variantById }
  return cache
}

// ─── Public catalogue API ─────────────────────────────────────────────────────

export function getAllGroups(): GroupedProduct[] {
  return buildCache().groups
}

export function getGroupById(id: string): GroupedProduct | null {
  return buildCache().byId.get(id) ?? null
}

export function getAvailableGroups(): GroupedProduct[] {
  return getAllGroups().filter((g) => g.available)
}

export function getGroupsByCollection(collection: string): GroupedProduct[] {
  return getAllGroups().filter((g) => g.collection === collection)
}

/** Look up a specific variant by its original flat product ID.
 *  Used by the checkout route for price verification and line item building. */
export function getVariantForCheckout(variantId: string): CheckoutProduct | null {
  const entry = buildCache().variantById.get(variantId)
  if (!entry) return null
  const { group, variant } = entry

  const variantSuffix = buildVariantSuffix(group, variant)
  const title = variantSuffix ? `${group.title}, ${variantSuffix}` : group.title

  const prodigi_attributes = resolveProdigiAttributes(group.format, variant.color)

  return {
    id: variantId,
    type: "photo",
    available: group.available,
    title,
    description: group.description,
    print_areas: group.print_areas as PrintArea[],
    base_prices: variant.base_prices as ProductBasePrices | undefined,
    margin_pct: group.margin_pct,
    prodigi_sku: variant.sku,
    ...(prodigi_attributes ? { prodigi_attributes } : {}),
  }
}

/** Minimum price across all variants (for ShopGrid "from €X" display). */
export function groupMinPriceCents(group: GroupedProduct): number {
  return Math.min(...group.variants.map((v) => v.price_cents))
}

/** Default variant for a group (for ShopGrid card image). */
export function groupDefaultVariant(group: GroupedProduct): ProductVariant {
  const idx = Math.min(group.default_variant, group.variants.length - 1)
  return group.variants[idx]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// MDX color → Prodigi attribute color name mapping for framed prints.
const FRAME_COLOR_MAP: Record<string, string> = {
  black: "black",
  "natural-oak": "natural",
  white: "white",
}

/**
 * Returns the Prodigi `attributes` map required for the given product format and
 * variant color.  Returns null when no attributes are needed (most formats).
 *
 * Determined from the Prodigi sandbox products endpoint:
 *   - canvas: requires `wrap` (ImageWrap per product description)
 *   - framed: requires `color` (mapped from MDX color field)
 */
function resolveProdigiAttributes(
  format: string,
  color: string | undefined,
): Record<string, string> | null {
  if (format === "canvas") return { wrap: "ImageWrap" }
  if (format === "framed" && color) {
    const mapped = FRAME_COLOR_MAP[color]
    if (mapped) return { color: mapped }
  }
  return null
}

function buildVariantSuffix(group: GroupedProduct, variant: ProductVariant): string {
  const parts: string[] = []
  if (variant.size_label) parts.push(variant.size_label)
  if (variant.color) parts.push(colorLabel(variant.color))
  if (variant.pack) parts.push(`${variant.pack}-pack`)
  return parts.join(", ")
}

function colorLabel(color: string): string {
  const map: Record<string, string> = {
    black: "Black Frame",
    "natural-oak": "Natural Oak Frame",
    white: "White Frame",
  }
  return map[color] ?? color
}

// ─── Legacy aliases ───────────────────────────────────────────────────────────
// These kept for checkout/shipping code that still calls getProductBySlug / getAllProducts.

/** @deprecated Use getGroupById or getVariantForCheckout. */
export function getProductBySlug(slug: string): CheckoutProduct | null {
  // Try group first, then variant
  const group = getGroupById(slug)
  if (group) {
    const v = groupDefaultVariant(group)
    return getVariantForCheckout(v.variantId)
  }
  return getVariantForCheckout(slug)
}

/** @deprecated Use getAvailableGroups. */
export function getAvailableProducts(): GroupedProduct[] {
  return getAvailableGroups()
}

/** @deprecated Use getAllGroups. */
export function getAllProducts(): GroupedProduct[] {
  return getAllGroups()
}

export function getProductsByCollection(collection: string): GroupedProduct[] {
  return getGroupsByCollection(collection)
}
