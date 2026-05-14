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
  type MergedGroup,
  type MergedVariant,
  type MergeFamily,
  type DisplayGroup,
} from "./types"

const PRODUCTS_DIR = path.join(process.cwd(), "content", "products")

// ─── Merge umbrellas ──────────────────────────────────────────────────────────
// Maps each source family code to the umbrella it merges into, plus the URL
// suffix used to synthesize merged group IDs.
// Add a new umbrella by registering its family codes here.

const MERGE_FAMILY_CONFIG: Record<MergeFamily, { codes: string[]; suffix: string }> = {
  "paper-prints":     { codes: ["hpr", "hge", "ema", "clp"], suffix: "prints" },
  "wall-art-merged":  { codes: ["can", "fap"],               suffix: "wall-art" },
}

const SOURCE_FAMILY_TO_MERGE: Record<string, MergeFamily> = (() => {
  const map: Record<string, MergeFamily> = {}
  for (const [umbrella, { codes }] of Object.entries(MERGE_FAMILY_CONFIG)) {
    for (const code of codes) map[code] = umbrella as MergeFamily
  }
  return map
})()

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CatalogueCache {
  groups: GroupedProduct[]
  byId: Map<string, GroupedProduct>
  variantById: Map<string, { group: GroupedProduct; variant: ProductVariant; idx: number }>
  /** Merged + standalone groups, what the shop UI consumes. */
  displayGroups: DisplayGroup[]
  displayById: Map<string, DisplayGroup>
  /** Source group ID → merged group ID (for 301 redirects from old paper/wall-art URLs). */
  redirectSourceToMerged: Map<string, string>
}

let cache: CatalogueCache | null = null

function buildCache(): CatalogueCache {
  if (cache) return cache

  const groups: GroupedProduct[] = []
  const byId = new Map<string, GroupedProduct>()
  const variantById = new Map<string, { group: GroupedProduct; variant: ProductVariant; idx: number }>()

  if (!fs.existsSync(PRODUCTS_DIR)) {
    cache = {
      groups, byId, variantById,
      displayGroups: [], displayById: new Map(), redirectSourceToMerged: new Map(),
    }
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

  const { displayGroups, displayById, redirectSourceToMerged } = buildDisplayLayer(groups)

  cache = { groups, byId, variantById, displayGroups, displayById, redirectSourceToMerged }
  return cache
}

// ─── Merge layer ─────────────────────────────────────────────────────────────

interface DisplayLayer {
  displayGroups: DisplayGroup[]
  displayById: Map<string, DisplayGroup>
  redirectSourceToMerged: Map<string, string>
}

function buildDisplayLayer(groups: GroupedProduct[]): DisplayLayer {
  const displayGroups: DisplayGroup[] = []
  const displayById = new Map<string, DisplayGroup>()
  const redirectSourceToMerged = new Map<string, string>()

  // Bucket mergeable groups by (photo_id + umbrella). Standalone (non-mergeable
  // or no photo_id) groups pass through.
  const buckets = new Map<string, { umbrella: MergeFamily; sources: GroupedProduct[] }>()

  for (const g of groups) {
    const umbrella = SOURCE_FAMILY_TO_MERGE[g.family]
    if (!umbrella || !g.photo_id) {
      displayGroups.push(g)
      displayById.set(g.id, g)
      continue
    }
    const bucketKey = `${g.photo_id}__${umbrella}`
    const existing = buckets.get(bucketKey)
    if (existing) existing.sources.push(g)
    else buckets.set(bucketKey, { umbrella, sources: [g] })
  }

  for (const { umbrella, sources } of Array.from(buckets.values())) {
    // Single-source bucket: nothing to merge, pass through the lone group.
    if (sources.length === 1) {
      const g = sources[0]
      displayGroups.push(g)
      displayById.set(g.id, g)
      continue
    }

    const merged = mergeSources(sources, umbrella)
    displayGroups.push(merged)
    displayById.set(merged.id, merged)
    for (const src of sources) {
      redirectSourceToMerged.set(src.id, merged.id)
    }
  }

  return { displayGroups, displayById, redirectSourceToMerged }
}

function mergeSources(sources: GroupedProduct[], umbrella: MergeFamily): MergedGroup {
  // Stable family-code ordering: configured order, then any unknown codes alphabetically.
  const configuredOrder = MERGE_FAMILY_CONFIG[umbrella].codes
  const sortedSources = [...sources].sort((a, b) => {
    const ai = configuredOrder.indexOf(a.family)
    const bi = configuredOrder.indexOf(b.family)
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi)
  })

  // Cheapest source drives the merged group's "primary" identity (image, base prices).
  const cheapestSource = sortedSources.reduce((cheapest, g) => {
    const cMin = Math.min(...g.variants.map((v) => v.price_cents))
    const bestMin = Math.min(...cheapest.variants.map((v) => v.price_cents))
    return cMin < bestMin ? g : cheapest
  })

  const suffix = MERGE_FAMILY_CONFIG[umbrella].suffix
  const idStem = stripFamilySuffix(cheapestSource.id, cheapestSource.family) ?? cheapestSource.id
  const mergedId = `${idStem}-${suffix}`

  // Title: drop the per-paper/per-format trailing clause (after the last comma).
  const title = stripTitleVariantClause(cheapestSource.title)

  const variants: MergedVariant[] = sortedSources.flatMap((g) =>
    g.variants.map((v) => ({
      ...v,
      source_family: g.family,
      source_group_id: g.id,
    })),
  )

  return {
    kind: "merged",
    id: mergedId,
    title,
    description: cheapestSource.description,
    photo_url: cheapestSource.photo_url,
    example_image: cheapestSource.example_image,
    available: sortedSources.some((g) => g.available),
    collection: cheapestSource.collection,
    photo_id: cheapestSource.photo_id,
    orientation: cheapestSource.orientation,
    merge_family: umbrella,
    sources: sortedSources,
    variants,
    source_family_codes: sortedSources.map((g) => g.family),
  }
}

/** Strip the `-<family>` suffix from a group id if present. */
function stripFamilySuffix(id: string, family: string): string | null {
  const suffix = `-${family}`
  return id.endsWith(suffix) ? id.slice(0, -suffix.length) : null
}

/** "Title — Location, Paper Name" → "Title — Location". */
function stripTitleVariantClause(title: string): string {
  const lastComma = title.lastIndexOf(",")
  return lastComma > 0 ? title.slice(0, lastComma).trim() : title
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
export function groupMinPriceCents(group: GroupedProduct | MergedGroup): number {
  return Math.min(...group.variants.map((v) => v.price_cents))
}

/** Default variant for a group (for ShopGrid card image). For merged groups this
 *  is the cheapest variant across all sources; for standalone groups it's the
 *  MDX `default_variant` index (clamped). */
export function groupDefaultVariant(group: GroupedProduct | MergedGroup): ProductVariant {
  if ((group as MergedGroup).kind === "merged") {
    return group.variants.reduce(
      (cheapest, v) => (v.price_cents < cheapest.price_cents ? v : cheapest),
      group.variants[0],
    )
  }
  const g = group as GroupedProduct
  const idx = Math.min(g.default_variant, g.variants.length - 1)
  return g.variants[idx]
}

// ─── Display API (merged + standalone) ────────────────────────────────────────

/** All groups visible in the shop UI — merged where applicable. */
export function getDisplayGroups(): DisplayGroup[] {
  return buildCache().displayGroups
}

/** Available-only counterpart for the shop UI. */
export function getAvailableDisplayGroups(): DisplayGroup[] {
  return getDisplayGroups().filter((g) => g.available)
}

/** Look up a display group by its (possibly synthesized) ID. */
export function getDisplayGroupById(id: string): DisplayGroup | null {
  return buildCache().displayById.get(id) ?? null
}

/** Available DisplayGroups whose photo_id matches `photoId`, sorted ascending by
 *  cheapest variant price. Returns [] when no matches — callers render nothing. */
export function getProductsByPhotoId(photoId: string): DisplayGroup[] {
  return getDisplayGroups()
    .filter((g) => g.available && g.photo_id === photoId)
    .sort((a, b) => groupMinPriceCents(a) - groupMinPriceCents(b))
}

/** If `id` is an old source ID that has been merged into another, returns the
 *  merged group's ID. Used for 301 redirects on the product page. */
export function getMergedRedirectTarget(id: string): string | null {
  return buildCache().redirectSourceToMerged.get(id) ?? null
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
