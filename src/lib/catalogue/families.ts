export interface FamilyVariantOption {
  value: string
  label: string
}

export interface FamilyMeta {
  slug: string
  name: string
  /** Compact label for product cards and inline contexts. */
  shortLabel: string
  familyCodes: readonly string[]
  variantDropdownLabel: string
  variantOptions: readonly FamilyVariantOption[]
}

// Raw narrow tuple drives the FamilySlug literal union; the public export is
// widened to readonly FamilyMeta[] so callers can pass arbitrary strings into
// helpers like `.familyCodes.includes(code)` without tuple-narrowing pain.
const FAMILY_CONFIG_RAW = [
  {
    slug: 'wall-art',
    name: 'Wall art',
    shortLabel: 'Wall art',
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
    shortLabel: 'Prints',
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
    shortLabel: 'Cards',
    familyCodes: ['gre', 'pos'],
    variantDropdownLabel: 'Type',
    variantOptions: [
      { value: 'gre', label: 'Greeting cards' },
      { value: 'pos', label: 'Postcards' },
    ],
  },
] as const satisfies readonly FamilyMeta[]

export const FAMILY_CONFIG: readonly FamilyMeta[] = FAMILY_CONFIG_RAW
export type FamilySlug = (typeof FAMILY_CONFIG_RAW)[number]['slug']

export const SLUG_TO_FAMILY: Record<string, FamilyMeta> = Object.fromEntries(
  FAMILY_CONFIG.map((f) => [f.slug, f])
)

export const FAMILY_SLUGS = new Set<string>(FAMILY_CONFIG.map((f) => f.slug))

interface FamilyCopy {
  /** Short single-line copy for /shop landing tiles. */
  tile: string
  /** Longer paragraph rendered under the H1 on family browse pages. */
  page: string
}

export const FAMILY_COPY: Record<FamilySlug, FamilyCopy> = {
  'wall-art': {
    tile: 'Framed prints and stretched canvas — the photograph at the size it deserves, finished and ready to hang. Heavy paper or woven canvas, either way it arrives feeling like a real object.',
    page: 'Wall art is the largest format StudioTJ ships — stretched canvas and framed prints, printed at archival quality. The depth of a wrapped canvas edge, the weight of a real frame, photography sized to fill a wall and anchor the room around it.',
  },
  'prints-posters': {
    tile: 'Fine art prints and posters on heavy art paper — substantial in the hand, matte enough to read cleanly on the wall. Frame to taste.',
    page: 'Prints & posters is photography on paper — a range of fine art stock from heavy matte to photographic lustre, printed at archival quality and shipped flat. The unframed register: portable, framable, the photograph at its most direct.',
  },
  'cards-stationery': {
    tile: 'Greeting cards and postcards on heavy uncoated paper — weighty in the hand, soft enough to write on, with the matte finish that lets a photograph carry. Sent or kept.',
    page: 'Cards & stationery is photography on paper, sized to send. Fine art stock, single image per piece, printed at archival quality and packed as sets. The smallest format in the shop, and the one that exchanges hands.',
  },
}
