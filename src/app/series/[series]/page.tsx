import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getAllSeries,
  getSeriesBySlug,
  getShootBoundEntries,
  getSeriesHero,
  DEFAULT_OG,
} from '@/lib/series'
import PhotoCard from '@/components/PhotoCard'

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

  const hero = getSeriesHero(series.slug)
  const ogImage = hero?.hero_url ?? DEFAULT_OG

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

  const isShootBound = series.mechanism === 'shoot_bound'

  // ── Shoot-bound series: list entry cards ───────────────────────────────────

  if (isShootBound) {
    const entries = getShootBoundEntries(series.slug)

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

        <div className="px-6 md:px-12 pb-16">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {entries.map((entry, i) => (
                <PhotoCard
                  key={entry.entry_slug}
                  href={`/series/${series.slug}/${entry.entry_slug}`}
                  heroUrl={entry.hero_thumb_url}
                  title={entry.display_name}
                  subtitle={`${formatShootDate(entry.shoot_date)} · ${entry.photo_count} ${entry.photo_count === 1 ? 'photo' : 'photos'}`}
                  index={i}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Curatorial series: coming-soon state (no sub-pools) ───────────────────

  return <EmptyStatePage series={series} label={series.display_name} />
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
