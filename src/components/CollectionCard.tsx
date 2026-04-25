'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import type { Collection, Photo } from '@/lib/portfolio'

interface CollectionCardProps {
  collection: Collection
  /** All photo objects for this collection's photo_ids — used for random pick. */
  photos: Photo[]
  index: number
  variant?: 'portfolio' | 'homepage'
  /** 'large' uses the full-res URL (1600px); 'small' uses the thumbnail (600px).
   *  Default 'small'. Use 'large' when cards render above ~700px wide. */
  size?: 'small' | 'large'
}

export default function CollectionCard({
  collection,
  photos,
  index,
  variant = 'portfolio',
  size = 'small',
}: CollectionCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  // Resolved on mount — null during SSR (shows placeholder gradient only).
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (photos.length === 0) return

    // Use hero_photo_id as a pinned override if it resolves to a known photo.
    const heroId = collection.hero_photo_id
    if (heroId) {
      const pinned = photos.find((p) => p.id === heroId)
      if (pinned) {
        setSelectedPhoto(pinned)
        return
      }
      // hero_photo_id is stale (photo no longer exists) — fall through to random.
    }

    // Random pick — different every page load.
    const pick = photos[Math.floor(Math.random() * photos.length)]
    setSelectedPhoto(pick)
  }, []) // intentionally run once on mount

  const isHomepage = variant === 'homepage'
  const accentColor = collection.palette[0] ?? '#C4BEB4'

  // Gradient uses the selected photo's dominant colours once known, falling
  // back to palette colours on SSR / before mount.
  const bgColors =
    selectedPhoto?.dominant_colors ?? collection.palette.slice(0, 3)
  const placeholderGradient =
    bgColors.length >= 2
      ? `linear-gradient(145deg, ${bgColors[0]}, ${bgColors[1]}${bgColors[2] ? `, ${bgColors[2]}` : ''})`
      : `linear-gradient(145deg, ${accentColor}, #1a1a1a)`

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/portfolio/${collection.slug}`}
        className="group block relative overflow-hidden"
        style={isHomepage ? undefined : { borderLeft: `2px solid ${accentColor}` }}
      >
        {/* Hero image / placeholder */}
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: '4 / 5' }}
        >
          {/* Gradient placeholder — always visible, sits behind the photo */}
          <div
            className="absolute inset-0"
            style={{ background: placeholderGradient }}
          />

          {/* Photo fades in once selected on mount and loaded from network */}
          {selectedPhoto?.thumbnail_url && (
            <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
              <img
                src={size === 'large' ? selectedPhoto.url : selectedPhoto.thumbnail_url}
                alt={selectedPhoto.title || collection.name}
                className="w-full h-full object-cover"
                style={{
                  opacity: imgLoaded ? 1 : 0,
                  transition: imgLoaded ? 'opacity 0.4s ease' : 'none',
                }}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
              />
            </div>
          )}

          {/* Dark gradient overlay — strengthens on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <p className="text-paper/80 text-xs tracking-[0.2em] uppercase mb-2">
              {collection.photo_ids.length} photos
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-paper leading-tight mb-2">
              {collection.name}
            </h2>
            {!isHomepage && (
              <p className="text-paper/75 text-sm leading-relaxed line-clamp-2">
                {collection.tagline}
              </p>
            )}

            {/* Arrow — portfolio only */}
            {!isHomepage && (
              <div className="mt-4 flex items-center gap-2 text-paper/70 text-xs tracking-widest uppercase transition-all duration-300 group-hover:text-paper/90 group-hover:gap-3">
                <span>View</span>
                <span>→</span>
              </div>
            )}
          </div>
        </div>

        {/* Palette strip — portfolio only */}
        {!isHomepage && (
          <div className="flex h-1">
            {collection.palette.map((color, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </Link>
    </motion.div>
  )
}
