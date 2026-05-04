import type { Metadata } from 'next'
import { getAllSeries, getPhotoCountForSeries, getSeriesHero } from '@/lib/series'
import PhotoCard from '@/components/PhotoCard'

export const metadata: Metadata = {
  title: 'Series',
  description:
    'Ongoing photo series by StudioTJ — routes, visits, studies, essays, and places.',
}

export default function SeriesPage() {
  const allSeries = getAllSeries()
  const visibleSeries = allSeries.filter(s => getPhotoCountForSeries(s.slug) > 0)

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="pt-32 pb-16 px-6 md:px-12">
        <p className="text-muted text-xs tracking-[0.3em] uppercase mb-4">StudioTJ</p>
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-6">
          Series
        </h1>
        <p className="text-muted text-lg max-w-xl leading-relaxed">
          Ongoing sequences of photographs — walks, visits, recurring subjects, and places.
        </p>
      </div>

      {/* Divider */}
      <div className="px-6 md:px-12 mb-12">
        <div className="h-px bg-dust/40" />
      </div>

      {/* Body block */}
      <div className="px-6 md:px-12 mb-16">
        <div className="max-w-3xl mx-auto space-y-5 text-muted leading-relaxed">
          <p>Five series, two structures. Two are shoot-bound — one shoot becomes one entry, published in sequence, the order doing as much work as the individual frames. Three are curatorial — photographs gathered from many shoots, assembled by subject, theme, or place.</p>
          <p><strong className="font-semibold text-ink">Routes</strong> is a single walk, photographed in order. A city quarter, a park, a stretch of canal — one shoot, kept whole. The sequence is the thing.</p>
          <p><strong className="font-semibold text-ink">Visits</strong> is the same logic indoors — a museum, a concert, a festival. One event, one sequence, first frame to last.</p>
          <p><strong className="font-semibold text-ink">Studies</strong> is a recurring subject revisited — a tree, a bridge, a stretch of water — across many shoots and seasons. The subject accumulates.</p>
          <p><strong className="font-semibold text-ink">Essays</strong> is a theme, not a place. An idea cut across many shoots and assembled editorially — not one walk but one argument.</p>
          <p><strong className="font-semibold text-ink">Places</strong> is a city or region as subject — Amsterdam, Maastricht, the North Sea coast — drawn from any shoot there. Discovery by geography.</p>
        </div>
      </div>

      {/* Series grid — only series with at least one photo */}
      <div className="px-6 md:px-12 pb-24">
        <div className="max-w-3xl mx-auto">
          {visibleSeries.length === 0 ? (
            <p className="text-muted text-lg leading-relaxed">
              Series in progress — first entries coming soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {visibleSeries.map((series, i) => {
                const hero = getSeriesHero(series.slug)
                return (
                  <PhotoCard
                    key={series.slug}
                    href={`/series/${series.slug}`}
                    heroUrl={hero?.thumb_url ?? null}
                    title={series.display_name}
                    subtitle={series.description}
                    index={i}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
