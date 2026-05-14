// Single source of truth for collection slugs ↔ MDX collection keys.

export interface CollectionMeta {
  slug: string
  key: string
  name: string        // short — sidebar, breadcrumbs, card labels
  displayName: string // full — page h1 and metadata title
}

// Order: Atmospheric, Halcyon, Signature, Monochrome Moods
export const COLLECTION_CONFIG: CollectionMeta[] = [
  { slug: 'atmospheric', key: 'the-atmospheric-collection', name: 'Atmospheric', displayName: 'The Atmospheric Collection' },
  { slug: 'halcyon',     key: 'the-halcyon-collection',     name: 'Halcyon',     displayName: 'The Halcyon Collection'     },
  { slug: 'signature',   key: 'the-signature-collection',   name: 'Signature',   displayName: 'The Signature Collection'   },
  { slug: 'mono',        key: 'monochrome-moods',            name: 'Mono',        displayName: 'Monochrome Moods'           },
]

/** MDX collection key → URL slug (e.g. "the-atmospheric-collection" → "atmospheric") */
export const COLLECTION_TO_SLUG: Record<string, string> = Object.fromEntries(
  COLLECTION_CONFIG.map(({ slug, key }) => [key, slug])
)

/** URL slug → MDX collection key (e.g. "atmospheric" → "the-atmospheric-collection") */
export const SLUG_TO_COLLECTION: Record<string, string> = Object.fromEntries(
  COLLECTION_CONFIG.map(({ slug, key }) => [slug, key])
)

export function collectionSlug(collectionKey: string): string {
  return COLLECTION_TO_SLUG[collectionKey] ?? collectionKey
}

export type CollectionSlug = 'atmospheric' | 'halcyon' | 'signature' | 'mono'

interface CollectionCopy {
  /** Short single-line copy for /shop landing tiles. */
  tile: string
  /** Longer paragraph rendered under the H1 on collection browse pages. */
  page: string
}

export const COLLECTION_COPY: Record<CollectionSlug, CollectionCopy> = {
  atmospheric: {
    tile: 'Moody landscape photography where the weather is the subject.',
    page: 'Moody landscape photography where the weather is the subject and the place is the setting. Fog, low cloud, water-heavy air, the particular grey that carries its own colour — never warm, never softened. Not only a photograph of somewhere, but the conditions that decided what the photograph could be.',
  },
  halcyon: {
    tile: 'Warm-toned landscape photography — pink, peach, coral, gold.',
    page: 'Warm-toned landscape photography — pink, peach, coral, warm gold, dusty lilac washing the whole frame. A grade the whole image lives inside, not a tint laid on top. Not only pretty light, but the kind of pretty that earns the second look because the composition holds underneath.',
  },
  signature: {
    tile: 'Architecture photography with the building given the frame to itself.',
    page: 'Architecture photography at full attention — palette-agnostic, mood-agnostic, the building given the frame to itself. Not only a record of what\'s there, but the angle and the light that make the structure look like it could not have stood any other way.',
  },
  mono: {
    tile: 'Black and white photography — contrast pushed to its edges.',
    page: 'Black and white photography at its best — it plays between the contrasts of light and dark, finds the farthest edges between them, and puts them in one image. Not only stripping a photo to its essence, but finding a new truth.',
  },
}
