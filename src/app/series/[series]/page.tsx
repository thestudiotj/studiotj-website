import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getAllSeries,
  getSeriesBySlug,
  getSeriesShape,
  getEntriesForSeries,
  getGroupsForSeries,
  getSubSeriesForSeries,
  getLatestEntry,
  resolvePhoto,
  DEFAULT_OG,
} from '@/lib/series'
import PhotoCard from '@/components/PhotoCard'
import ExpandList from '@/components/ExpandList'

export const dynamicParams = false

interface PageProps {
  params: { series: string }
}

export async function generateStaticParams() {
  return getAllSeries().map(s => ({ series: s.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const series = getSeriesBySlug(params.series)
  if (!series) return {}

  const entries = getEntriesForSeries(series.slug)
  const latest = getLatestEntry(entries)
  const heroPhoto = latest ? resolvePhoto(latest.hero_photo_id) : null
  const ogImage = heroPhoto ? (heroPhoto.og_url ?? heroPhoto.url) : DEFAULT_OG

  return {
    title: `${series.display_name} — Series`,
    description: series.description,
    openGraph: { images: [ogImage] },
  }
}

function formatShootDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
    new Date(dateStr)
  )
}

export default function SeriesLevelPage({ params }: PageProps) {
  const series = getSeriesBySlug(params.series)
  if (!series) notFound()

  const shape = getSeriesShape(series)

  // ── sub_series: fixed tile grid (always show all, no expand, fixed order) ──

  if (shape === 'sub_series') {
    const subSeries = getSubSeriesForSeries(series)
    return (
      <div className="min-h-screen bg-paper">
        <div className="pt-32 pb-16 px-6 md:px-12">
          <BreadcrumbLine>
            <Link href="/series" className="hover:text-ink transition-colors">Series</Link>
            <span>{series.display_name}</span>
          </BreadcrumbLine>
          <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-6 mt-4">
            {series.display_name}
          </h1>
          <p className="text-muted text-lg max-w-xl leading-relaxed">{series.description}</p>
        </div>

        <div className="px-6 md:px-12 mb-12">
          <div className="h-px bg-dust/40" />
        </div>

        <div className="px-6 md:px-12 pb-24">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {subSeries.map((ss, i) => {
                const heroPhoto = ss.heroEntry
                  ? resolvePhoto(ss.heroEntry.hero_photo_id)
                  : null
                return (
                  <PhotoCard
                    key={ss.slug}
                    href={`/series/${series.slug}/${ss.slug}`}
                    heroUrl={heroPhoto?.thumbnail_url ?? null}
                    title={ss.display_name}
                    index={i}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── grouped: group cards listing ──────────────────────────────────────────

  if (shape === 'grouped') {
    const groups = getGroupsForSeries(series)

    if (groups.length === 0) {
      return <EmptyStatePage series={series} label={series.display_name} />
    }

    return (
      <div className="min-h-screen bg-paper">
        <div className="pt-32 pb-16 px-6 md:px-12">
          <BreadcrumbLine>
            <Link href="/series" className="hover:text-ink transition-colors">Series</Link>
            <span>{series.display_name}</span>
          </BreadcrumbLine>
          <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-6 mt-4">
            {series.display_name}
          </h1>
          <p className="text-muted text-lg max-w-xl leading-relaxed">{series.description}</p>
        </div>

        <div className="px-6 md:px-12 mb-12">
          <div className="h-px bg-dust/40" />
        </div>

        <div className="px-6 md:px-12 pb-24">
          <div className="max-w-3xl mx-auto">
            <ExpandList
              gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8"
            >
              {groups.map((group, i) => {
                const heroPhoto = group.heroEntry
                  ? resolvePhoto(group.heroEntry.hero_photo_id)
                  : null
                const meta = `${group.entries.length} ${group.entries.length === 1 ? 'entry' : 'entries'}`
                return (
                  <PhotoCard
                    key={group.slug}
                    href={`/series/${series.slug}/${group.slug}`}
                    heroUrl={heroPhoto?.thumbnail_url ?? null}
                    title={group.display_name}
                    subtitle={meta}
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

  // ── flat_filter: entry listing ────────────────────────────────────────────

  const entries = getEntriesForSeries(series.slug)

  if (entries.length === 0) {
    return <EmptyStatePage series={series} label={series.display_name} />
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="pt-32 pb-16 px-6 md:px-12">
        <BreadcrumbLine>
          <Link href="/series" className="hover:text-ink transition-colors">Series</Link>
          <span>{series.display_name}</span>
        </BreadcrumbLine>
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-6 mt-4">
          {series.display_name}
        </h1>
        <p className="text-muted text-lg max-w-xl leading-relaxed">{series.description}</p>
      </div>

      <div className="px-6 md:px-12 mb-12">
        <div className="h-px bg-dust/40" />
      </div>

      <div className="px-6 md:px-12 pb-24">
        <div className="max-w-3xl mx-auto">
          <ExpandList
            gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8"
          >
            {entries.map((entry, i) => {
              const heroPhoto = resolvePhoto(entry.hero_photo_id)
              return (
                <PhotoCard
                  key={entry.entry_slug}
                  href={`/series/${series.slug}/${entry.entry_slug}`}
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

// ─── Shared sub-components ────────────────────────────────────────────────────

function BreadcrumbLine({ children }: { children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children]
  return (
    <nav className="flex items-center gap-2 text-muted text-xs tracking-widest uppercase">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-dust">/</span>}
          {item}
        </span>
      ))}
    </nav>
  )
}

function EmptyStatePage({
  series,
  label,
}: {
  series: { display_name: string; description: string; evergreen_note: string; refill_note: string }
  label: string
}) {
  return (
    <div className="min-h-screen bg-paper">
      <div className="pt-32 pb-16 px-6 md:px-12">
        <BreadcrumbLine>
          <Link href="/series" className="hover:text-ink transition-colors">Series</Link>
          <span>{label}</span>
        </BreadcrumbLine>
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-6 mt-4">
          {label}
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
