import type { Metadata } from 'next'
import { getAllSeries, getAllSeriesPhotos, getDerivedHero } from '@/lib/series'
import PhotoCard from '@/components/PhotoCard'

export const metadata: Metadata = {
  title: 'Series',
  description:
    'Ongoing photo series by StudioTJ — botanical subjects, weather, seasons, and routes.',
}

export default function SeriesPage() {
  const allSeries = getAllSeries()
  const allPhotos = getAllSeriesPhotos()

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

      {/* 2×2 grid — always shows all four series, sort_order */}
      <div className="px-6 md:px-12 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {allSeries.map((series, i) => {
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
        </div>
      </div>
    </div>
  )
}
