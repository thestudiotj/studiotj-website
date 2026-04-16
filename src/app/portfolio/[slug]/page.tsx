import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPortfolio, getCollection, getMoodTheme, getPhoto } from '@/lib/portfolio'
import type { Photo } from '@/lib/portfolio'
import { getWeeklyGallery } from '@/lib/rotation'
import Gallery from '@/components/Gallery'

// Revalidate every hour so the Monday rotation propagates without a manual deploy.
export const revalidate = 3600

interface PageProps {
  params: { slug: string }
  // searchParams is only read in development (see weekOverride below).
  searchParams?: { week?: string }
}

export async function generateStaticParams() {
  const data = getPortfolio()
  return (data?.collections ?? []).map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const collection = getCollection(params.slug)
  if (!collection) return {}
  const description = collection.meta_description || collection.tagline
  const heroPhoto = getPhoto(collection.hero_photo_id)
  return {
    title: collection.name,
    description,
    openGraph: {
      description,
      ...(heroPhoto ? { images: [heroPhoto.url] } : {}),
    },
  }
}

export default function CollectionPage({ params, searchParams }: PageProps) {
  const collection = getCollection(params.slug)
  if (!collection) notFound()

  const data = getPortfolio()
  if (!data) notFound()

  // ?week=N override: dev-only for rotation testing — ignored in production.
  const weekOverride =
    process.env.NODE_ENV === 'development' && searchParams?.week
      ? parseInt(searchParams.week, 10)
      : undefined

  // Weekly rotation — returns up to 50 photo IDs for the current week.
  const weeklyIds = getWeeklyGallery(
    collection.photo_ids,
    params.slug,
    new Date(),
    weekOverride
  )

  const photoMap = new Map(data.photos.map(p => [p.id, p]))
  const photos: Photo[] = weeklyIds
    .map(id => photoMap.get(id))
    .filter((p): p is Photo => p !== undefined)

  const theme = getMoodTheme(collection.mood, collection.style_intensity, collection.palette)
  const accentHex = theme.accent

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        '--col-accent': theme.accent,
        '--col-muted': theme.textMuted,
        '--col-border': theme.border,
        '--col-surface': theme.surface,
      } as React.CSSProperties}
      className="min-h-screen"
    >
      {/* Header section */}
      <div className="pt-28 pb-12 px-6 md:px-12">
        {/* Back link */}
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase mb-10 transition-opacity opacity-50 hover:opacity-100"
          style={{ color: theme.text }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="19 12 5 12" />
            <polyline points="12 5 5 12 12 19" />
          </svg>
          Portfolio
        </Link>

        {/* Collection header */}
        <div className="max-w-3xl">
          <div
            className="w-8 h-0.5 mb-6"
            style={{ backgroundColor: accentHex }}
          />

          <h1
            className="font-display text-5xl md:text-7xl leading-tight mb-4"
            style={{ color: theme.text }}
          >
            {collection.name}
          </h1>

          <p
            className="text-xl md:text-2xl font-display italic leading-relaxed mb-6"
            style={{ color: theme.textMuted }}
          >
            {collection.tagline}
          </p>

          {/* Description — renders markdown if present */}
          {collection.description && (
            <div
              className="collection-description mt-6"
              style={{ color: theme.textMuted }}
            >
              <MDXRemote source={collection.description} />
            </div>
          )}

          {/* Meta row */}
          <div
            className="flex flex-wrap items-center gap-6 mt-8 pt-6 text-xs tracking-[0.15em] uppercase"
            style={{ borderTop: `1px solid ${theme.border}`, color: theme.textMuted }}
          >
            <span>{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>
            <span style={{ color: theme.border }}>·</span>
            <span style={{ color: accentHex, textTransform: 'capitalize' }}>{collection.mood}</span>
          </div>
        </div>
      </div>

      {/* Palette bar */}
      <div className="flex h-0.5 mx-6 md:mx-12 mb-10 rounded-full overflow-hidden opacity-60">
        {collection.palette.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      {/* Gallery */}
      <div className="px-6 md:px-12 pb-24">
        <Gallery
          photos={photos}
          collectionName={collection.name}
        />
      </div>

      {/* Footer nav */}
      <div
        className="border-t px-6 md:px-12 py-10"
        style={{ borderColor: theme.border }}
      >
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-3 text-sm tracking-widest uppercase transition-opacity opacity-50 hover:opacity-100"
          style={{ color: theme.text }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="19 12 5 12" />
            <polyline points="12 5 5 12 12 19" />
          </svg>
          All collections
        </Link>
      </div>
    </div>
  )
}
