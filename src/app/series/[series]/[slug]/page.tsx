import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getAllSeries,
  getSeriesBySlug,
  getSeriesPhotosBySubPool,
  getPhotosForRoute,
  getRouteEntries,
  getDerivedHero,
  getDisplayNameForTag,
  seriesPhotoToGalleryPhoto,
  DEFAULT_OG,
} from '@/lib/series'
import { routeSlugToTitle } from '@/lib/utils'
import Gallery from '@/components/Gallery'
import PoolGallery from '@/components/PoolGallery'

export const dynamicParams = false

interface PageProps {
  params: { series: string; slug: string }
}

export async function generateStaticParams() {
  const params: { series: string; slug: string }[] = []

  for (const series of getAllSeries()) {
    if (series.routing === 'manual_only') {
      for (const route of getRouteEntries()) {
        params.push({ series: series.slug, slug: route.route_slug })
      }
    } else {
      for (const sp of series.sub_pools ?? []) {
        params.push({ series: series.slug, slug: sp.slug })
      }
    }
  }

  return params
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const series = getSeriesBySlug(params.series)
  if (!series) return {}

  if (series.routing === 'manual_only') {
    const photos = getPhotosForRoute(params.slug)
    if (photos.length === 0) return {}
    const hero = getDerivedHero(photos)
    const ogImage = hero?.hero_url ?? DEFAULT_OG
    const displayName = photos[0].route_display_name ?? routeSlugToTitle(params.slug)
    return {
      title: `${displayName} — Routes`,
      description: series.description,
      openGraph: { images: [ogImage] },
    }
  }

  const subPool = (series.sub_pools ?? []).find(sp => sp.slug === params.slug)
  if (!subPool) return {}
  const photos = getSeriesPhotosBySubPool(params.series, params.slug)
  const hero = getDerivedHero(photos)
  const ogImage = hero?.hero_url ?? DEFAULT_OG
  return {
    title: `${getDisplayNameForTag(subPool.slug)} — ${series.display_name}`,
    description: series.description,
    openGraph: { images: [ogImage] },
  }
}

function formatShootDateLong(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export default function SeriesSlugPage({ params }: PageProps) {
  const series = getSeriesBySlug(params.series)
  if (!series) notFound()

  // ── Routes: chronological entry gallery ───────────────────────────────────

  if (series.routing === 'manual_only') {
    const photos = getPhotosForRoute(params.slug)
    if (photos.length === 0) notFound()

    const displayName = photos[0].route_display_name ?? routeSlugToTitle(params.slug)
    const shootDate = photos[0].shoot_date
    const galleryPhotos = photos.map(seriesPhotoToGalleryPhoto)

    return (
      <div className="pt-24 pb-20">
        <div className="px-6 md:px-12 mb-8">
          <nav className="flex items-center gap-2 text-muted text-xs tracking-widest uppercase mb-6">
            <Link href="/series" className="hover:text-ink transition-colors">Series</Link>
            <span className="text-dust">/</span>
            <Link href="/series/routes" className="hover:text-ink transition-colors">
              {series.display_name}
            </Link>
            <span className="text-dust">/</span>
            <span>{displayName}</span>
          </nav>

          <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-3">
            {displayName}
          </h1>
          <p className="text-sm tracking-wide text-muted">{formatShootDateLong(shootDate)}</p>
        </div>

        <div className="px-6 md:px-12">
          <Gallery photos={galleryPhotos} galleryId={params.slug} />
        </div>
      </div>
    )
  }

  // ── Sub-pool: pool gallery ─────────────────────────────────────────────────

  const subPool = (series.sub_pools ?? []).find(sp => sp.slug === params.slug)
  if (!subPool) notFound()

  const subPoolDisplayName = getDisplayNameForTag(subPool.slug)
  const photos = getSeriesPhotosBySubPool(params.series, params.slug)

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="pt-32 pb-16 px-6 md:px-12">
          <nav className="flex items-center gap-2 text-muted text-xs tracking-widest uppercase mb-6">
            <Link href="/series" className="hover:text-ink transition-colors">Series</Link>
            <span className="text-dust">/</span>
            <Link
              href={`/series/${series.slug}`}
              className="hover:text-ink transition-colors"
            >
              {series.display_name}
            </Link>
            <span className="text-dust">/</span>
            <span>{subPoolDisplayName}</span>
          </nav>
          <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-6 mt-4">
            {subPoolDisplayName}
          </h1>
          <p className="text-muted text-lg max-w-xl leading-relaxed mb-8">{series.description}</p>
          <div className="max-w-xl space-y-3">
            <p className="text-muted/70 text-sm leading-relaxed">{series.evergreen_note}</p>
            <p className="text-muted/70 text-sm leading-relaxed">{series.refill_note}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-20">
      <div className="px-6 md:px-12 mb-8">
        <nav className="flex items-center gap-2 text-muted text-xs tracking-widest uppercase mb-6">
          <Link href="/series" className="hover:text-ink transition-colors">Series</Link>
          <span className="text-dust">/</span>
          <Link
            href={`/series/${series.slug}`}
            className="hover:text-ink transition-colors"
          >
            {series.display_name}
          </Link>
          <span className="text-dust">/</span>
          <span>{subPoolDisplayName}</span>
        </nav>
        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-3">
          {subPoolDisplayName}
        </h1>
      </div>

      <div className="px-6 md:px-12">
        {/* Pool rotation: when this pool exceeds 50 photos, pass a 50-photo
            weekly-seeded window via getRotatedPhotoIds — see lib/series.ts. */}
        <PoolGallery photos={photos} />
      </div>
    </div>
  )
}
