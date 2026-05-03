import type { Metadata } from 'next'
import { getAllSeries, getAllSeriesPhotos, getDerivedHero, getPhotoCountForSeries } from '@/lib/series'
import PhotoCard from '@/components/PhotoCard'

export const metadata: Metadata = {
  title: 'Series',
  description:
    'Ongoing photo series by StudioTJ — botanical subjects, weather, seasons, and routes.',
}

export default function SeriesPage() {
  const allSeries = getAllSeries()
  const allPhotos = getAllSeriesPhotos()
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
          Ongoing sequences of photographs, organized by subject, weather, and season.
        </p>
      </div>

      {/* Divider */}
      <div className="px-6 md:px-12 mb-12">
        <div className="h-px bg-dust/40" />
      </div>

      {/* Body block */}
      <div className="px-6 md:px-12 mb-16">
        <div className="max-w-3xl mx-auto space-y-5 text-muted leading-relaxed">
          <p>A series is an organizing axis kept open. Photographs are gathered from across many shoots, and the series fills as the work goes on. Three of the four are pools — photographs that share an inherent quality, regardless of which shoot brought them in. The fourth is structured differently.</p>
          <p><strong className="font-semibold text-ink">Flowers and Trees</strong> is subject-led — flowers, blossom, trees through their seasons, individual specimens or whole stands. The work happens at low canal-side trees, in town parks and dune scrub, on long avenues that line Dutch suburbs and country roads. A subject this common in the landscape rewards careful attention rather than novelty.</p>
          <p><strong className="font-semibold text-ink">Weather</strong> is the photograph reading as the weather as much as the place. Mist over polder, snow rare enough that it changes the whole register when it lands, the long golden hour that holds across flat country, blue hour stretching well past sunset in summer, dramatic North Sea fronts. A country with this much sky and this little vertical relief makes weather visible where more dramatic terrain hides it.</p>
          <p><strong className="font-semibold text-ink">Seasons</strong> is the year as the subject — spring as it actually arrives in the Low Countries, summer green and long evenings, autumn through wet leaf and turning trees, winter short days and bare structure. Each season carries its own light and its own palette. The series is what the year looks like when watched closely from one country.</p>
          <p><strong className="font-semibold text-ink">Routes</strong> runs on a different logic. A Route is a single walk, photographed in order. One shoot, one place, the sequence as it unfolded — a city quarter, a museum, a building, a park. Where the other three are pools that fill from many shoots, a Route is one shoot kept whole, the order doing as much of the work as the individual frames.</p>
          <p>Four series, two structures. Pools for what recurs; sequences for what was walked through once.</p>
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
                const seriesPhotos = allPhotos.filter(p => p.series_slug === series.slug)
                const hero = getDerivedHero(seriesPhotos)
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
