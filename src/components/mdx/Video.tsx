'use client'

import { useState } from 'react'

interface VideoProps {
  id?: string
  url?: string
  /** Optional poster image URL — overrides the hotlinked YouTube thumbnail */
  poster?: string
  /** When true, renders a larger play button suited to a hero context */
  hero?: boolean
}

function extractYouTubeId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return url
}

export default function Video({ id, url, poster, hero = false }: VideoProps) {
  const [playing, setPlaying] = useState(false)
  const videoId = id ?? (url ? extractYouTubeId(url) : '')

  if (!videoId) return null

  const posterSrc = poster ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  const containerClass = hero
    ? 'relative w-full aspect-video'
    : 'my-6 relative w-full aspect-video'

  const playIconSize = hero ? 'w-20 h-20' : 'w-14 h-14'

  if (playing) {
    return (
      <div className={containerClass}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    )
  }

  return (
    <div className={containerClass}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={posterSrc}
        alt="Video thumbnail"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Semi-transparent dark scrim */}
      <div className="absolute inset-0 bg-black/40" />
      {/* Play button */}
      <button
        onClick={() => setPlaying(true)}
        className="absolute inset-0 flex items-center justify-center group"
        aria-label="Play video"
      >
        <span
          className={`${playIconSize} flex items-center justify-center rounded-full bg-black/60 group-hover:bg-black/80 transition-colors`}
        >
          {/* Play triangle */}
          <svg
            viewBox="0 0 24 24"
            className="w-1/2 h-1/2 translate-x-0.5"
            fill="var(--accent)"
          >
            <polygon points="6,4 20,12 6,20" />
          </svg>
        </span>
      </button>
    </div>
  )
}
