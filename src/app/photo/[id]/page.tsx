import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPortfolio } from '@/lib/portfolio'
import { getAllJournalPhotos } from '@/lib/journal'
import { getPhotoRecord, getShootPhotos, getShootDisplayName } from '@/lib/photos'

const SITE_URL = 'https://studiotj.com'
const DEFAULT_OG = 'https://photos.studiotj.com/og/studiotj-default.jpg'

interface PageProps {
  params: { id: string }
}

export async function generateStaticParams() {
  const portfolioPhotos = getPortfolio()?.photos ?? []
  const journalPhotos = getAllJournalPhotos()
  return [
    ...portfolioPhotos.map(p => ({ id: p.id })),
    ...journalPhotos.map(p => ({ id: p.id })),
  ]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const record = getPhotoRecord(params.id)
  if (!record) return {}

  const photo = record.photo
  const ogImage = photo.og_url ?? DEFAULT_OG

  let description: string
  if (photo.caption) {
    description = photo.caption
  } else if (record.source === 'portfolio' && record.collection?.meta_description) {
    description = record.collection.meta_description
  } else {
    description = 'Photography by StudioTJ.'
  }

  return {
    title: photo.title,
    description,
    openGraph: {
      title: photo.title,
      description,
      images: [{ url: ogImage }],
    },
    alternates: {
      canonical: `${SITE_URL}/photo/${params.id}`,
    },
  }
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export default function PhotoPage({ params }: PageProps) {
  const record = getPhotoRecord(params.id)
  if (!record) notFound()

  const photo = record.photo
  const heroUrl = record.source === 'portfolio' ? record.photo.url : record.photo.hero_url

  const ctaHref =
    record.source === 'portfolio' && record.collection
      ? `/portfolio/${record.collection.slug}#&gid=1&pid=${photo.id}`
      : '/journal'
  const ctaLabel =
    record.source === 'portfolio' && record.collection
      ? `View in ${record.collection.name}`
      : 'Back to Journal'

  const shootPhotos = getShootPhotos(params.id)
  const shootDisplayName = getShootDisplayName(photo)

  return (
    <main className="min-h-screen bg-paper pt-20 pb-24">
      {/* Hero image — full-bleed on mobile, generous margin on desktop */}
      <div className="md:max-w-5xl md:mx-auto md:px-10">
        <img
          src={heroUrl}
          alt={photo.title}
          className="w-full"
          style={{ aspectRatio: String(photo.aspect_ratio) }}
          loading="eager"
        />
      </div>

      {/* Content area */}
      <div className="px-6 md:max-w-5xl md:mx-auto md:px-10 mt-8">
        <h1
          className="font-display text-3xl md:text-5xl leading-tight text-ink mb-3"
        >
          {photo.title}
        </h1>

        {/* Metadata line */}
        <p className="text-sm tracking-wide text-muted mb-6">
          {photo.date ? formatDate(photo.date) : ''}
          {photo.location ? ` · ${photo.location}` : ''}
        </p>

        {/* Caption — omit block entirely if absent */}
        {photo.caption && (
          <p className="text-base text-ink/80 leading-relaxed max-w-prose mb-8">
            {photo.caption}
          </p>
        )}

        {/* CTA */}
        <Link href={ctaHref} className="btn-primary">
          {ctaLabel}
        </Link>
      </div>

      {/* Shoot strip — only rendered when other photos from the same shoot exist */}
      {shootPhotos.length > 0 && (
        <div className="px-6 md:max-w-5xl md:mx-auto md:px-10 mt-14">
          <div className="border-t border-dust pt-8">
            <p className="text-xs tracking-[0.15em] uppercase text-muted mb-5">
              More from this shoot{shootDisplayName ? ` · ${shootDisplayName}` : ''}
            </p>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {shootPhotos.map((p) => (
                <Link key={p.id} href={`/photo/${p.id}`} className="flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity duration-200">
                  <img
                    src={p.thumbnail_url}
                    alt={p.title}
                    className="h-20 w-auto object-cover"
                    loading="lazy"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
