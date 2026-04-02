import type { PrintifyProduct, PrintifyImage } from './printify'

// ─── Category mapping ─────────────────────────────────────────────────────────

export function getProductCategory(product: PrintifyProduct): string {
  const text = [product.title, ...product.tags].join(' ').toLowerCase()
  if (/hoodie|t-shirt|\btee\b|shirt|sweatshirt/.test(text)) return 'Clothing'
  if (/tote|bag/.test(text)) return 'Accessories'
  if (/canvas|print|poster|wall\s*art/.test(text)) return 'Wall Art'
  return 'Other'
}

// ─── Black variant image helper ───────────────────────────────────────────────

export function getBlackOrDefaultImages(product: PrintifyProduct): {
  primary: PrintifyImage | null
  hover: PrintifyImage | null
} {
  const colorOption = product.options.find(
    (o) => o.type === 'color' || o.name.toLowerCase().includes('color')
  )

  let primaryVariantId: number | null = null

  if (colorOption) {
    const blackValue = colorOption.values.find((v) => /\bblack\b/i.test(v.title))
    if (blackValue) {
      const blackVariant = product.variants.find(
        (v) => v.is_enabled && v.options.includes(blackValue.id)
      )
      if (blackVariant) primaryVariantId = blackVariant.id
    }
  }

  // Primary: front-facing image for the selected variant, or default
  const primary = primaryVariantId
    ? (product.images.find(
        (img) =>
          img.variant_ids.includes(primaryVariantId!) && /front/i.test(img.position)
      ) ??
      product.images.find((img) => img.variant_ids.includes(primaryVariantId!)) ??
      product.images.find((img) => img.is_default) ??
      product.images[0] ??
      null)
    : (product.images.find((img) => img.is_default) ?? product.images[0] ?? null)

  // Hover: a different angle for the same color variant
  const hover = primaryVariantId
    ? (product.images.find(
        (img) =>
          img.variant_ids.includes(primaryVariantId!) && img.src !== primary?.src
      ) ?? null)
    : (product.images.find((img) => img.src !== primary?.src) ?? null)

  return { primary, hover }
}
