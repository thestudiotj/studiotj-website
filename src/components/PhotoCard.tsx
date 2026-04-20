'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

interface PhotoCardProps {
  href: string
  heroUrl: string | null
  title: string
  subtitle?: string
  index: number
}

/**
 * Generic photo-forward card used across /series pages.
 * With heroUrl: full-bleed image with gradient overlay and text on top.
 * Without heroUrl: text-only prose card (no image, no gradient).
 * Visually matches CollectionCard treatment.
 */
export default function PhotoCard({ href, heroUrl, title, subtitle, index }: PhotoCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={href}
        className="group block relative overflow-hidden"
        style={{ borderLeft: '2px solid var(--border)' }}
      >
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4 / 5' }}>
          {heroUrl ? (
            <>
              {/* Placeholder shown while image loads */}
              <div className="absolute inset-0 bg-dust/30" />

              {/* Photo with zoom on hover */}
              <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  style={{
                    opacity: imgLoaded ? 1 : 0,
                    transition: imgLoaded ? 'opacity 0.4s ease' : 'none',
                  }}
                  loading="lazy"
                  onLoad={() => setImgLoaded(true)}
                />
              </div>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <h2 className="font-display text-2xl md:text-3xl text-paper leading-tight mb-2">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-paper/75 text-sm leading-relaxed line-clamp-2">{subtitle}</p>
                )}
                <div className="mt-4 flex items-center gap-2 text-paper/50 text-xs tracking-widest uppercase transition-all duration-300 group-hover:text-paper/90 group-hover:gap-3">
                  <span>View</span>
                  <span>→</span>
                </div>
              </div>
            </>
          ) : (
            /* No-image prose card */
            <div className="absolute inset-0 bg-paper flex flex-col justify-end p-6">
              <h2 className="font-display text-2xl md:text-3xl text-ink leading-tight mb-2 group-hover:text-[var(--accent)] transition-colors">
                {title}
              </h2>
              {subtitle && (
                <p className="text-muted text-sm leading-relaxed line-clamp-3">{subtitle}</p>
              )}
              <div className="mt-4 flex items-center gap-2 text-muted text-xs tracking-widest uppercase transition-all duration-300 group-hover:text-ink group-hover:gap-3">
                <span>View</span>
                <span>→</span>
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
