'use client'

import { useState, useEffect } from 'react'

export default function HeroImage() {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    const images = ['/images/hero-light.webp', '/images/hero-dark.webp', '/images/hero-subtext.webp']
    setSrc(images[Math.floor(Math.random() * images.length)])
  }, [])

  if (!src) return <div className="absolute inset-0 bg-ink" />

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={1920}
      height={1080}
      loading="eager"
      fetchPriority="high"
      className="absolute inset-0 w-full h-full object-cover"
    />
  )
}
