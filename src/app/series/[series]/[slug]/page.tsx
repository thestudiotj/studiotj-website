import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import {
  getAllSeries,
  getSeriesBySlug,
  getSeriesShape,
  getEntriesForSeries,
  getGroupsForSeries,
  getSubSeriesForSeries,
  getEntryByPath,
  resolvePhoto,
  resolvePhotos,
  DEFAULT_OG,
} from '@/lib/series'
import Gallery from '@/components/Gallery'
import PhotoCard from '@/components/PhotoCard'
import ExpandList from '@/components/ExpandList'

export const dynamicParams = false

interface PageProps {
  params: { series: string; slug: string }
}

export async function generateStaticParams() {
  const params: { series: string; slug: string }[] = []

  for (const series of getAllSeries()) {
    const shape = getSeriesShape(series)

    if (shape === 'flat_filter') {
      // [slug] = entry_slug
      for (const entry of getEntriesForSeries(series.slug)) {
        params.push({ series: series.slug, slug: entry.entry_slug })
      }
    } else if (shape === 'grouped') {
      // [slug] = group slug derived from entries
      for (const group of getGroupsForSeries(series)) {
        params.push({ series: series.slug, slug: group.slug })
      }
    } else {
      // sub_series — [slug] = sub-series slug, always valid from series.json
      for (const ss of getSubSeriesForSeries(series)) {
        params.push({ series: series.slug, slug: ss.slug })
      }
    }
  }

  return params
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const series = getSeriesBySlug(params.series)
  if (!series) return {}
  const shape = getSeriesShape(series)

  if (shape === 'flat_filter') {
    // This slug is an entry
    const entry = getEntryByPath(params.series, params.slug)
    if (!entry) return {}
    const heroPhoto = resolvePhoto(entry.hero_photo_id)
    const ogImage = heroPhoto ? (heroPhoto.og_url ?? heroPhoto.url) : DEFAULT_OG
    const firstPara = entry.notes?.split('\n\n')[0] ?? series.description
    return {
      title: `${entry.display_name} — ${series.display_name}`,
      description: firstPara,
      openGraph: { images: [ogImage] },
    }
  }

  if (shape === 'grouped') {
    const group = getGroupsForSeries(series).find(g => g.slug === params.slug)
    if (!group) return {}
    const heroPhoto = group.heroEntry ? resolvePhoto(group.heroEntry.hero_photo_id) : null
    const ogImage = heroPhoto ? (heroPhoto.og_url ?? heroPhoto.url) : DEFAULT_OG
    return {
      title: `${group.display_name} — ${series.display_name}`,
      description: series.description,
      openGraph: { images: [ogImage] },
    }
  }

  // sub_series
  const ss = getSubSeriesForSeries(series).find(s => s.slug === params.slug)
  if (!ss) return {}
  const heroPhoto = ss.heroEntry ? resolvePhoto(ss.heroEntry.hero_photo_id) : null
  const ogImage = heroPhoto ? (heroPhoto.og_url ?? heroPhoto.url) : DEFAULT_OG
  return {
    title: `${ss.display_name} — ${series.display_name}`,
    description: series.description,
    openGraph: { images: [ogImage] },
  }
}

function formatShootDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
    new Date(dateStr)
  )
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

export default async function SeriesSlugPage({ params }: PageProps) {
  const series = getSeriesBySlug(params.series)
  if (!series) notFound()

  const shape = getSeriesShape(series)

  // ── flat_filter: this slug is an entry → render entry page ───────────────

  if (shape === 'flat_filter') {
    const entry = getEntryByPath(params.series, params.slug)
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

  // ── grouped: this slug is a group → render entry listing ─────────────────

  if (shape === 'grouped') {
    const groups = getGroupsForSeries(series)
    const group = groups.find(g => g.slug === params.slug)
    if (!group) notFound()

    return (
      <div className="min-h-screen bg-paper">
        <div className="pt-32 pb-16 px-6 md:px-12">
          <nav className="flex items-center gap-2 text-muted text-xs tracking-widest uppercase mb-6">
            <Link href="/series" className="hover:text-ink transition-colors">Series</Link>
            <span className="text-dust">/</span>
            <Link href={`/series/${series.slug}`} className="hover:text-ink transition-colors">
              {series.display_name}
            </Link>
            <span className="text-dust">/</span>
            <span>{group.display_name}</span>
          </nav>

          <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-6 mt-4">
            {group.display_name}
          </h1>
        </div>

        <div className="px-6 md:px-12 mb-12">
          <div className="h-px bg-dust/40" />
        </div>

        <div className="px-6 md:px-12 pb-24">
          <div className="max-w-3xl mx-auto">
            <ExpandList
              gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8"
            >
              {group.entries.map((entry, i) => {
                const heroPhoto = resolvePhoto(entry.hero_photo_id)
                return (
                  <PhotoCard
                    key={entry.entry_slug}
                    href={`/series/${series.slug}/${group.slug}/${entry.entry_slug}`}
                    heroUrl={heroPhoto?.thumbnail_url ?? null}
                    title={entry.display_name}
                    subtitle={formatShootDate(entry.shoot_date)}
                    index={i}
                  />
                )
              })}
            </ExpandList>
          </div>
        </div>
      </div>
    )
  }

  // ── sub_series: this slug is a sub-series → render entry listing or empty ─

  const subSeriesList = getSubSeriesForSeries(series)
  const ss = subSeriesList.find(s => s.slug === params.slug)
  if (!ss) notFound()

  if (ss.entries.length === 0) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="pt-32 pb-16 px-6 md:px-12">
          <nav className="flex items-center gap-2 text-muted text-xs tracking-widest uppercase mb-6">
            <Link href="/series" className="hover:text-ink transition-colors">Series</Link>
            <span className="text-dust">/</span>
            <Link href={`/series/${series.slug}`} className="hover:text-ink transition-colors">
              {series.display_name}
            </Link>
            <span className="text-dust">/</span>
            <span>{ss.display_name}</span>
          </nav>
          <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-6 mt-4">
            {ss.display_name}
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
    <div className="min-h-screen bg-paper">
      <div className="pt-32 pb-16 px-6 md:px-12">
        <nav className="flex items-center gap-2 text-muted text-xs tracking-widest uppercase mb-6">
          <Link href="/series" className="hover:text-ink transition-colors">Series</Link>
          <span className="text-dust">/</span>
          <Link href={`/series/${series.slug}`} className="hover:text-ink transition-colors">
            {series.display_name}
          </Link>
          <span className="text-dust">/</span>
          <span>{ss.display_name}</span>
        </nav>
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-6 mt-4">
          {ss.display_name}
        </h1>
      </div>

      <div className="px-6 md:px-12 mb-12">
        <div className="h-px bg-dust/40" />
      </div>

      <div className="px-6 md:px-12 pb-24">
        <div className="max-w-3xl mx-auto">
          <ExpandList
            gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8"
          >
            {ss.entries.map((entry, i) => {
              const heroPhoto = resolvePhoto(entry.hero_photo_id)
              return (
                <PhotoCard
                  key={entry.entry_slug}
                  href={`/series/${series.slug}/${ss.slug}/${entry.entry_slug}`}
                  heroUrl={heroPhoto?.thumbnail_url ?? null}
                  title={entry.display_name}
                  subtitle={formatShootDate(entry.shoot_date)}
                  index={i}
                />
              )
            })}
          </ExpandList>
        </div>
      </div>
    </div>
  )
}
