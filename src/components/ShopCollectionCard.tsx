'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ShopCollectionCardProps {
  slug: string
  name: string
  description: string
  heroImages: string[]
}

export default function ShopCollectionCard({
  slug,
  name,
  description,
  heroImages,
}: ShopCollectionCardProps) {
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    if (heroImages.length === 0) return
    const pick = heroImages[Math.floor(Math.random() * heroImages.length)]
    setHeroImage(pick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally once on mount — new random pick every page load

  return (
    <Link href={`/shop/${slug}`} className="group block">
      <div className="relative aspect-[3/2] bg-dust/20 overflow-hidden mb-4">
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.04]"
            style={{ opacity: imgLoaded ? 1 : 0, transition: imgLoaded ? 'opacity 0.4s ease, transform 0.5s ease-out' : 'none' }}
            loading="eager"
            onLoad={() => setImgLoaded(true)}
          />
        )}
      </div>
      <div>
        <h2 className="font-display text-2xl md:text-3xl text-ink leading-tight mb-2">
          {name}
        </h2>
        <p className="text-muted text-sm leading-relaxed">{description}</p>
        <p className="text-xs tracking-widest uppercase text-muted mt-3 group-hover:text-ink transition-colors">
          Browse collection →
        </p>
      </div>
    </Link>
  )
}
