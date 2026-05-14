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
      <Link href={`/shop/${slug}`} className="group block">
        <div className="relative aspect-[3/2] bg-dust/20 overflow-hidden mb-4">
          {heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt={name}
              className="absolute inset-0 w-full h-full object-contain transition-all duration-500 ease-out group-hover:scale-[1.04]"
              style={{
                opacity: imgLoaded ? 1 : 0,
                transition: imgLoaded
                  ? 'opacity 0.4s ease, transform 0.5s ease-out'
                  : 'none',
              }}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
            />
          )}
        </div>
        <h2 className="font-display text-xl md:text-2xl text-ink leading-tight">
          {name}
        </h2>
      </Link>
    </motion.div>
  )
}
