import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getAllSeries,
  getSeriesBySlug,
  getShootBoundEntries,
  getPhotosForEntry,
  getDerivedHero,
  entryPhotoToGalleryPhoto,
  DEFAULT_OG,
} from '@/lib/series'
import Gallery from '@/components/Gallery'

export const dynamicParams = false

interface PageProps {
  params: { series: string; slug: string }
}

export async function generateStaticParams() {
  const params: { series: string; slug: string }[] = []

  for (const series of getAllSeries()) {
    if (series.mechanism === 'shoot_bound') {
      for (const entry of getShootBoundEntries(series.slug)) {
        params.push({ series: series.slug, slug: entry.entry_slug })
      }
    }
  }

  return params
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const series = getSeriesBySlug(params.series)
  if (!series) return {}

  const photos = getPhotosForEntry(params.series, params.slug)
  if (photos.length === 0) return {}

  const hero = getDerivedHero(photos)
  const ogImage = hero?.hero_url ?? DEFAULT_OG

  const entries = getShootBoundEntries(params.series)
  const entry = entries.find(e => e.entry_slug === params.slug)
  const displayName = entry?.display_name ?? params.slug

  return {
    title: `${displayName} — ${series.display_name}`,
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

export default function SeriesEntryPage({ params }: PageProps) {
  const series = getSeriesBySlug(params.series)
  if (!series) notFound()

  if (series.mechanism !== 'shoot_bound') notFound()

  const photos = getPhotosForEntry(params.series, params.slug)
  if (photos.length === 0) notFound()

  const entries = getShootBoundEntries(params.series)
  const entry = entries.find(e => e.entry_slug === params.slug)
  const displayName = entry?.display_name ?? params.slug
  const shootDate = photos[0].datetime_original ?? entry?.shoot_date ?? ''

  const galleryPhotos = photos.map(p => entryPhotoToGalleryPhoto(p, entry?.shoot_date ?? ''))

  return (
    <div className="pt-24 pb-20">
      <div className="px-6 md:px-12 mb-8">
        <nav className="flex items-center gap-2 text-muted text-xs tracking-widest uppercase mb-6">
          <Link href="/series" className="hover:text-ink transition-colors">Series</Link>
          <span className="text-dust">/</span>
          <Link href={`/series/${series.slug}`} className="hover:text-ink transition-colors">
            {series.display_name}
          </Link>
          <span className="text-dust">/</span>
          <span>{displayName}</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-3">
          {displayName}
        </h1>
        {shootDate && (
          <p className="text-sm tracking-wide text-muted">{formatShootDateLong(shootDate)}</p>
        )}
      </div>

      <div className="px-6 md:px-12">
        <Gallery photos={galleryPhotos} galleryId={params.slug} />
      </div>
    </div>
  )
}
