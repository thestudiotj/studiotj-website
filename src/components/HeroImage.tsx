'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function HeroImage() {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    setSrc(Math.random() < 0.5 ? '/images/hero-light.jpg' : '/images/hero-dark.jpg')
  }, [])

  if (!src) return <div className="absolute inset-0 bg-ink" />

  return (
    <Image
      src={src}
      alt=""
      fill
      className="object-cover"
      priority
    />
  )
}
