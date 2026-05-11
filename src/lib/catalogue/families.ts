export interface FamilyVariantOption {
  value: string
  label: string
}

export interface FamilyMeta {
  slug: string
  name: string
  familyCodes: string[]
  variantDropdownLabel: string
  variantOptions: FamilyVariantOption[]
}

export const FAMILY_CONFIG: FamilyMeta[] = [
  {
    slug: 'wall-art',
    name: 'Wall art',
    familyCodes: ['can', 'fap'],
    variantDropdownLabel: 'Print type',
    variantOptions: [
      { value: 'can', label: 'Canvas' },
      { value: 'fap', label: 'Framed Print' },
    ],
  },
  {
    slug: 'prints-posters',
    name: 'Prints & posters',
    familyCodes: ['hpr', 'hge', 'ema', 'clp'],
    variantDropdownLabel: 'Paper',
    variantOptions: [
      { value: 'hpr', label: 'Hahnemühle Photo Rag' },
      { value: 'hge', label: 'Hahnemühle German Etching' },
      { value: 'ema', label: 'Enhanced Matte Art' },
      { value: 'clp', label: 'Lustre Photo Paper' },
    ],
  },
  {
    slug: 'cards-stationery',
    name: 'Cards & stationery',
    familyCodes: ['gre', 'pos'],
    variantDropdownLabel: 'Type',
    variantOptions: [
      { value: 'gre', label: 'Greeting cards' },
      { value: 'pos', label: 'Postcards' },
    ],
  },
]

export const SLUG_TO_FAMILY: Record<string, FamilyMeta> = Object.fromEntries(
  FAMILY_CONFIG.map((f) => [f.slug, f])
)

export const FAMILY_SLUGS = new Set(FAMILY_CONFIG.map((f) => f.slug))
