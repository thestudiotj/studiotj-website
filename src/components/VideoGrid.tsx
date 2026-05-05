'use client'

import { useState } from 'react'

interface Video {
  id: string
  title: string
  description?: string
  tags?: string[]
  date?: string
}

function VideoCard({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false)
  const thumb = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`

  return (
    <div className="group">
      {/* Embed / thumbnail */}
      <div className="relative aspect-video bg-ink overflow-hidden">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <>
            {/* Thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt={video.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-ink/20 group-hover:bg-ink/40 transition-colors duration-300" />
            {/* Play button */}
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center"
              aria-label={`Play ${video.title}`}
            >
              <div className="w-14 h-14 rounded-full border-2 border-paper/80 flex items-center justify-center
                              group-hover:border-paper group-hover:scale-110 transition-all duration-200">
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent
                                border-l-[14px] border-l-paper/80 group-hover:border-l-paper ml-1" />
              </div>
            </button>
          </>
        )}
      </div>

      {/* Meta */}
      <div className="pt-4 pb-8">
        <h3 className="font-display text-xl text-ink mb-1 leading-tight">{video.title}</h3>
        {video.description && (
          <p className="text-muted text-sm leading-relaxed mb-3">{video.description}</p>
        )}
        <div className="flex flex-wrap gap-2 items-center">
          {video.tags?.map((tag) => (
            <span key={tag} className="text-xs text-muted tracking-widest uppercase">
              #{tag}
            </span>
          ))}
          {video.date && (
            <span className="text-xs text-muted font-mono ml-auto">
              {new Date(video.date).toLocaleDateString('en-NL', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Empty state — shown until you add video IDs
function EmptyState() {
  return (
    <div className="px-6 md:px-12">
      <div className="border border-dashed border-dust/50 p-16 text-center max-w-2xl">
        {/* Film strip decoration */}
        <div className="flex justify-center gap-2 mb-8 opacity-20">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-8 h-12 border border-ink rounded-sm flex flex-col justify-between p-1">
              <div className="w-full h-1.5 bg-ink rounded-sm" />
              <div className="w-full h-5 bg-ink/20 rounded-sm" />
              <div className="w-full h-1.5 bg-ink rounded-sm" />
            </div>
          ))}
        </div>
        <p className="font-display text-2xl text-ink mb-3">Nothing here yet.</p>
        <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto">
          Videos will appear here once added. Drop a YouTube video ID into{' '}
          <code className="bg-dust/30 px-1 font-mono text-xs">app/videos/page.tsx</code>.
        </p>
      </div>
    </div>
  )
}

export default function VideoGrid({ videos }: { videos: Video[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null)

  if (videos.length === 0) return <EmptyState />

  // Collect all unique tags
  const allTags = Array.from(new Set(videos.flatMap((v) => v.tags ?? [])))
  const filtered = activeTag ? videos.filter((v) => v.tags?.includes(activeTag)) : videos

  return (
    <div className="px-6 md:px-12">
      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-10">
          <button
            onClick={() => setActiveTag(null)}
            className={`text-xs tracking-widest uppercase px-4 py-2 border transition-colors ${
              !activeTag ? 'bg-ink text-paper border-ink' : 'border-dust text-muted hover:border-ink hover:text-ink'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`text-xs tracking-widest uppercase px-4 py-2 border transition-colors ${
                activeTag === tag ? 'bg-ink text-paper border-ink' : 'border-dust text-muted hover:border-ink hover:text-ink'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid — 1 col mobile, 2 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  )
}
