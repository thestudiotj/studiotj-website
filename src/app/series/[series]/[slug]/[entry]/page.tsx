import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import {
  getAllSeries,
  getSeriesBySlug,
  getSeriesShape,
  getGroupsForSeries,
  getSubSeriesForSeries,
  getEntryByPath,
  resolvePhoto,
  resolvePhotos,
  DEFAULT_OG,
} from '@/lib/series'
import Gallery from '@/components/Gallery'

export const dynamicParams = false

interface PageProps {
  params: { series: string; slug: string; entry: string }
}

export async function generateStaticParams() {
  const params: { series: string; slug: string; entry: string }[] = []

  for (const series of getAllSeries()) {
    const shape = getSeriesShape(series)

    if (shape === 'grouped') {
      for (const group of getGroupsForSeries(series)) {
        for (const entry of group.entries) {
          params.push({ series: series.slug, slug: group.slug, entry: entry.entry_slug })
        }
      }
    } else if (shape === 'sub_series') {
      for (const ss of getSubSeriesForSeries(series)) {
        for (const entry of ss.entries) {
          params.push({ series: series.slug, slug: ss.slug, entry: entry.entry_slug })
        }
      }
    }
  }

  return params
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const series = getSeriesBySlug(params.series)
  if (!series) return {}
  const shape = getSeriesShape(series)

  let containerDisplayName = params.slug

  if (shape === 'grouped') {
    const group = getGroupsForSeries(series).find(g => g.slug === params.slug)
    if (group) containerDisplayName = group.display_name
  } else if (shape === 'sub_series') {
    const ss = getSubSeriesForSeries(series).find(s => s.slug === params.slug)
    if (ss) containerDisplayName = ss.display_name
  }

  const entry = getEntryByPath(params.series, params.entry)
  if (!entry) return {}

  const heroPhoto = resolvePhoto(entry.hero_photo_id)
  const ogImage = heroPhoto ? (heroPhoto.og_url ?? heroPhoto.url) : DEFAULT_OG
  const firstPara = entry.notes?.split('\n\n')[0] ?? series.description

  return {
    title: `${entry.display_name} — ${containerDisplayName}`,
    description: firstPara,
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

const proseClasses =
  'prose prose-lg prose-stone max-w-none ' +
  'prose-headings:font-display prose-headings:font-normal ' +
  'prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline'

export default async function SeriesEntryPage({ params }: PageProps) {
  const series = getSeriesBySlug(params.series)
  if (!series) notFound()

  const shape = getSeriesShape(series)

  // Only grouped and sub_series have a level-4 entry page.
  // flat_filter entries are handled at level 3 ([series]/[slug]/page.tsx).
  if (shape === 'flat_filter') notFound()

  let containerDisplayName = params.slug
  let containerHref = `/series/${params.series}/${params.slug}`

  if (shape === 'grouped') {
    const group = getGroupsForSeries(series).find(g => g.slug === params.slug)
    if (!group) notFound()
    containerDisplayName = group.display_name
  } else {
    const ss = getSubSeriesForSeries(series).find(s => s.slug === params.slug)
    if (!ss) notFound()
    containerDisplayName = ss.display_name
  }

  const entry = getEntryByPath(params.series, params.entry)
  if (!entry) notFound()

  const photos = resolvePhotos(entry.photo_ids)

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
          <Link href={containerHref} className="hover:text-ink transition-colors">
            {containerDisplayName}
          </Link>
          <span className="text-dust">/</span>
          <span>{entry.display_name}</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-3">
          {entry.display_name}
        </h1>
        <p className="text-sm tracking-wide text-muted">{formatShootDateLong(entry.shoot_date)}</p>
      </div>

      {entry.notes && (
        <div className="px-6 md:px-12 mb-12">
          <div className="max-w-2xl mx-auto">
            <article className={proseClasses}>
              <MDXRemote source={entry.notes} />
            </article>
          </div>
        </div>
      )}

      <div className="px-6 md:px-12">
        <Gallery photos={photos} galleryId={entry.entry_slug} />
      </div>
    </div>
  )
}
