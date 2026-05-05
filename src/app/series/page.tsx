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
          Ongoing sequences of photographs — walks, events, and subjects revisited over time.
        </p>
      </div>

      {/* Divider */}
      <div className="px-6 md:px-12 mb-12">
        <div className="h-px bg-dust/40" />
      </div>

      {/* Series grid — only series with at least one photo */}
      <div className="px-6 md:px-12 pb-16">
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

      {/* Body block */}
      <div className="px-6 md:px-12 pb-24">
        <div className="max-w-3xl mx-auto space-y-5 text-muted leading-relaxed">
          <p>Series is photography organised around staying with the subject long enough for the order to mean something. A walk in the rhythm it was actually walked, an event in the arc it actually had, kept in sequence so the order itself does part of the work. The sequence is what makes it a series.</p>
          <p><strong className="font-semibold text-ink">Routes</strong> is a photo walk outside — city quarters, canals, parks, neighbourhoods, country lanes, polder edges — kept in the order it was walked, first step to last. <strong className="font-semibold text-ink">Visits</strong> does the same with events: a concert, a museum, a festival, captured across every space the event uses. A museum garden between exhibitions, a venue forecourt before the doors open, a festival ground at the change of acts; the boundary is always the event itself, indoor and outdoor alike.</p>
          <p>What sits underneath the work is sequence. A walk shows its rhythm. An event shows its arc. The sequence carries the time the photographs were made across.</p>
          <p>Because sequence does the heavy lifting, the work is open to whatever's at hand. What matters is the run staying intact, every frame in the order it happened. The Netherlands gives this kind of work plenty to play with: cities and countryside sit close, weather can change hourly, and the day's conditions become part of the record rather than something to work around.</p>
          <p>Photography that stays with its subject long enough for the order to matter.</p>
        </div>
      </div>
    </div>
  )
}
