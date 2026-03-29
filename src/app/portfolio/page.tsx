import { getManifest } from '@/lib/manifest'
import PortfolioGallery from '@/components/PortfolioGallery'

export const metadata = {
  title: 'Portfolio',
  description: 'Photography collections by StudioTJ',
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: { collection?: string }
}) {
  const manifest = await getManifest()
  const activeCollection = searchParams.collection ?? null

  const collections = manifest?.collections ?? []
  const allPhotos = manifest?.all_photos ?? []

  const displayPhotos = activeCollection
    ? collections.find((c: any) => c.name === activeCollection)?.photos ?? []
    : allPhotos.filter((p: any) => p.portfolio_section === 'portfolio')

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      <div className="mb-12">
        <h1 className="section-title mb-6">Portfolio</h1>

        {/* Collection filter tabs */}
        <div className="flex flex-wrap gap-3">
          <a
            href="/portfolio"
            className={`text-sm tracking-widest uppercase px-4 py-2 border transition-colors ${
              !activeCollection
                ? 'bg-ink text-paper border-ink'
                : 'border-dust text-muted hover:border-ink hover:text-ink'
            }`}
          >
            All
          </a>
          {collections.map((c: any) => (
            <a
              key={c.name}
              href={`/portfolio?collection=${encodeURIComponent(c.name)}`}
              className={`text-sm tracking-widest uppercase px-4 py-2 border transition-colors ${
                activeCollection === c.name
                  ? 'bg-ink text-paper border-ink'
                  : 'border-dust text-muted hover:border-ink hover:text-ink'
              }`}
            >
              {c.name} <span className="opacity-50">({c.photo_count})</span>
            </a>
          ))}
        </div>
      </div>

      <PortfolioGallery photos={displayPhotos} />
    </div>
  )
}
