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
