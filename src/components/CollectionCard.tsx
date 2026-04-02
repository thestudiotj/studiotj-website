'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import type { Collection, Photo } from '@/lib/portfolio'

interface CollectionCardProps {
  collection: Collection
  heroPhoto: Photo | null
  index: number
}

export default function CollectionCard({ collection, heroPhoto, index }: CollectionCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const accentColor = collection.palette[0] ?? '#C4BEB4'
  const bgColors = heroPhoto?.dominant_colors ?? collection.palette.slice(0, 3)

  const placeholderGradient = bgColors.length >= 2
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
        style={{ borderLeft: `2px solid ${accentColor}` }}
      >
        {/* Hero image / placeholder */}
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: '4 / 5' }}
        >
          <div
            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            style={{ background: placeholderGradient }}
          />

          {/* Dark gradient overlay — strengthens on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <p className="text-paper/60 text-xs tracking-[0.2em] uppercase mb-2">
              {collection.photo_ids.length} photos
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-paper leading-tight mb-2">
              {collection.name}
            </h2>
            <p className="text-paper/75 text-sm leading-relaxed line-clamp-2">
              {collection.tagline}
            </p>

            {/* Arrow */}
            <div className="mt-4 flex items-center gap-2 text-paper/50 text-xs tracking-widest uppercase transition-all duration-300 group-hover:text-paper/90 group-hover:gap-3">
              <span>View</span>
              <span>→</span>
            </div>
          </div>
        </div>

        {/* Palette strip */}
        <div className="flex h-1">
          {collection.palette.map((color, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </Link>
    </motion.div>
  )
}
