'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

interface ShopHomeCardProps {
  slug: string
  name: string
  heroImages: string[]
  index: number
}

export default function ShopHomeCard({
  slug,
  name,
  heroImages,
  index,
}: ShopHomeCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    if (heroImages.length === 0) return
    const pick = heroImages[Math.floor(Math.random() * heroImages.length)]
    setHeroImage(pick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/shop/${slug}`} className="group block relative overflow-hidden">
        <div
          className="relative w-full overflow-hidden bg-dust/20"
          style={{ aspectRatio: '4 / 5' }}
        >
          {heroImage && (
            <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage}
                alt={name}
                className="w-full h-full object-contain"
                style={{
                  opacity: imgLoaded ? 1 : 0,
                  transition: imgLoaded ? 'opacity 0.4s ease' : 'none',
                }}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <h2 className="font-display text-2xl md:text-3xl text-paper leading-tight mb-2">
              {name}
            </h2>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
