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

  // Hover: a different angle that still shows the design.
  // Preference order: lifestyle shot > other non-back view > skip plain back view entirely.
  const isPlainBack = (img: PrintifyImage) =>
    /^back$/i.test(img.position.trim())

  const isLifestyle = (img: PrintifyImage) =>
    /lifestyle/i.test(img.position)

  const candidatePool = (variantId: number | null) =>
    variantId
      ? product.images.filter(
          (img) => img.variant_ids.includes(variantId) && img.src !== primary?.src
        )
      : product.images.filter((img) => img.src !== primary?.src)

  const candidates = candidatePool(primaryVariantId).filter((img) => !isPlainBack(img))

  const hover =
    candidates.find(isLifestyle) ?? // 1st choice: lifestyle shot
    candidates[0] ??                // 2nd choice: any non-back candidate
    null                            // no hover if only back views remain

  return { primary, hover }
}
