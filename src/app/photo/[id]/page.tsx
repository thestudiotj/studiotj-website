import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPortfolio } from '@/lib/portfolio'
import { getPhotoRecord, getShootPhotos, getShootDisplayName } from '@/lib/photos'
import { getProductsByPhotoId, groupMinPriceCents } from '@/lib/catalogue/loader'
import { COLLECTION_TO_SLUG } from '@/lib/catalogue/collections'
import { formatPrice } from '@/lib/catalogue/format'
import { getVisitorCurrency } from '@/lib/i18n/server'

const SITE_URL = 'https://studiotj.com'
const DEFAULT_OG = 'https://photos.studiotj.com/og/studiotj-default.jpg'

interface PageProps {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return (getPortfolio()?.photos ?? []).map(p => ({ id: p.id }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const record = getPhotoRecord(params.id)
  if (!record) return {}

  const photo = record.photo
  const ogImage = photo.og_url ?? DEFAULT_OG

  let description: string
  if (photo.caption) {
    description = photo.caption
  } else if (record.collection?.meta_description) {
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

export default async function PhotoPage({ params }: PageProps) {
  const record = getPhotoRecord(params.id)
  if (!record) notFound()

  const currency = await getVisitorCurrency()

  const photo = record.photo
  const heroUrl = photo.url

  const ctaHref =
    record.collection
      ? `/portfolio/${record.collection.slug}#&gid=1&pid=${photo.id}`
      : '/series'
  const ctaLabel =
    record.collection
      ? `View in ${record.collection.name}`
      : 'Browse Series'

  const shootPhotos = getShootPhotos(params.id)
  const shootDisplayName = getShootDisplayName(photo)

  const shopMatches = getProductsByPhotoId(photo.id)
  const cheapestShopMatch = shopMatches[0] ?? null
  const shopHref = cheapestShopMatch
    ? `/shop/${COLLECTION_TO_SLUG[cheapestShopMatch.collection] ?? cheapestShopMatch.collection}/${cheapestShopMatch.id}`
    : null
  const shopMinPrice = cheapestShopMatch ? groupMinPriceCents(cheapestShopMatch) : null

  return (
    <main className="min-h-screen bg-paper pt-20 pb-24">
      {/* Hero image */}
      <div className="md:max-w-5xl md:mx-auto md:px-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
        <h1 className="font-display text-3xl md:text-5xl leading-tight text-ink mb-3">
          {photo.title}
        </h1>

        <p className="text-sm tracking-wide text-muted mb-6">
          {photo.date ? formatDate(photo.date) : ''}
          {photo.location ? ` · ${photo.location}` : ''}
        </p>

        {photo.caption && (
          <p className="text-base text-ink/80 leading-relaxed max-w-prose mb-8">
            {photo.caption}
          </p>
        )}

        <Link href={ctaHref} className="btn-primary">
          {ctaLabel}
        </Link>

        {shopHref && shopMinPrice !== null && (
          <Link
            href={shopHref}
            className="block mt-5 text-sm tracking-widest uppercase text-muted hover:text-ink transition-colors"
          >
            Available in the shop — from {formatPrice(shopMinPrice, currency)} →
          </Link>
        )}
      </div>

      {/* Shoot strip */}
      {shootPhotos.length > 0 && (
        <div className="px-6 md:max-w-5xl md:mx-auto md:px-10 mt-14">
          <div className="border-t border-dust pt-8">
            <p className="text-xs tracking-[0.15em] uppercase text-muted mb-5">
              More from this shoot{shootDisplayName ? ` · ${shootDisplayName}` : ''}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {shootPhotos.map(p => (
                <Link
                  key={p.id}
                  href={`/photo/${p.id}`}
                  className="flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity duration-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
