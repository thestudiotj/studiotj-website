'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import justifiedLayout from 'justified-layout'
import { type ElsewhereItem, type Platform, type Identity } from '@/lib/elsewhere'
import ElsewhereCard, { METADATA_HEIGHT } from './ElsewhereCard'

// Mirrors ALL_PLATFORMS from lib/elsewhere.ts — defined locally so this client
// component doesn't bundle the server-only lib (which uses 'fs').
const ALL_PLATFORMS: Platform[] = [
  'bluesky', 'mastodon', 'pixelfed', 'instagram', 'pinterest', 'tiktok', 'youtube',
]

// ─── Filter constants ─────────────────────────────────────────────────────────

const IDENTITY_OPTIONS: { value: Identity | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'studiotj', label: 'StudioTJ' },
  { value: 'subtextlab', label: 'Subtext Lab' },
  { value: 'tjvanderheeft', label: 'tjvanderheeft' },
]

const PLATFORM_LABELS: Record<Platform, string> = {
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  pixelfed: 'Pixelfed',
  instagram: 'Instagram',
  pinterest: 'Pinterest',
  tiktok: 'TikTok',
  youtube: 'YouTube',
}

// ─── Inner component (uses useSearchParams — must be wrapped in Suspense) ─────

function FilterGridInner({ items }: { items: ElsewhereItem[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [identity, setIdentity] = useState<Identity | 'all'>(() => {
    const v = searchParams.get('identity')
    return (['studiotj', 'subtextlab', 'tjvanderheeft'] as string[]).includes(v ?? '')
      ? (v as Identity)
      : 'all'
  })

  const [enabledChannels, setEnabledChannels] = useState<Set<Platform>>(() => {
    const v = searchParams.get('channels')
    if (!v) return new Set(ALL_PLATFORMS)
    const parts = v
      .split(',')
      .filter((p): p is Platform => ALL_PLATFORMS.includes(p as Platform))
    return new Set(parts.length > 0 ? parts : ALL_PLATFORMS)
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setContainerWidth(el.clientWidth)
    update()
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const syncURL = (id: Identity | 'all', channels: Set<Platform>) => {
    const params = new URLSearchParams()
    if (id !== 'all') params.set('identity', id)
    if (channels.size !== ALL_PLATFORMS.length)
      params.set('channels', Array.from(channels).join(','))
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '?', { scroll: false })
  }

  const handleIdentityChange = (v: Identity | 'all') => {
    setIdentity(v)
    syncURL(v, enabledChannels)
  }

  const handleChannelToggle = (p: Platform) => {
    const next = new Set(enabledChannels)
    if (next.has(p)) {
      if (next.size > 1) next.delete(p) // keep at least one active
    } else {
      next.add(p)
    }
    setEnabledChannels(next)
    syncURL(identity, next)
  }

  const filtered = items.filter((item) => {
    if (identity !== 'all' && item.identity !== identity) return false
    return item.channels.some((ch) => enabledChannels.has(ch.platform))
  })

  const GAP = 8
  const targetRowHeight = containerWidth < 640 ? 220 : 280
  const aspectRatios = filtered.map((item) => (item.aspect_ratio > 0 ? item.aspect_ratio : 1.0))

  const layout = justifiedLayout(aspectRatios, {
    containerWidth,
    targetRowHeight,
    boxSpacing: { horizontal: GAP, vertical: GAP + METADATA_HEIGHT },
    containerPadding: 0,
    showWidows: true,
  })

  const totalHeight = layout.containerHeight + METADATA_HEIGHT

  return (
    <>
      {/* ── Filter bar ── */}
      <div className="sticky top-0 z-30 bg-paper/95 backdrop-blur-sm border-b border-dust/40">
        <div className="px-6 md:px-12 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Identity radio group */}
          <div
            className="flex flex-wrap gap-1"
            role="radiogroup"
            aria-label="Filter by identity"
          >
            {IDENTITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                role="radio"
                aria-checked={identity === opt.value}
                onClick={() => handleIdentityChange(opt.value)}
                className={`px-3 py-1 text-xs tracking-wider uppercase border transition-colors ${
                  identity === opt.value
                    ? 'bg-ink text-paper border-ink'
                    : 'border-dust text-muted hover:border-ink hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Divider (desktop only) */}
          <div className="hidden sm:block w-px h-5 bg-dust/60 shrink-0" />

          {/* Channel toggles */}
          <div
            className="flex gap-1 overflow-x-auto pb-0.5"
            role="group"
            aria-label="Filter by platform"
          >
            {ALL_PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => handleChannelToggle(p)}
                aria-pressed={enabledChannels.has(p)}
                title={`${enabledChannels.has(p) ? 'Hide' : 'Show'} ${PLATFORM_LABELS[p]}`}
                className={`shrink-0 p-1.5 border rounded-sm transition-colors ${
                  enabledChannels.has(p)
                    ? 'border-ink/40 bg-ink/5'
                    : 'border-dust/40 opacity-30'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/icons/elsewhere/${p}.svg`}
                  alt=""
                  aria-hidden="true"
                  className="w-3.5 h-3.5"
                />
                <span className="sr-only">{PLATFORM_LABELS[p]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accessible live region announces filter results to screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {filtered.length === 0
          ? 'No posts match the current filter.'
          : `${filtered.length} post${filtered.length === 1 ? '' : 's'} shown.`}
      </div>

      {/* ── Grid or empty state ── */}
      {filtered.length === 0 ? (
        <div className="px-6 md:px-12 py-24">
          <p className="text-muted">Nothing matches that filter. Try widening it.</p>
        </div>
      ) : (
        /* Padding wrapper is separate from containerRef so ResizeObserver
           measures the content width and left:0 aligns with content edge. */
        <div className="px-6 md:px-12">
          <div
            ref={containerRef}
            className="relative w-full"
            style={{ height: totalHeight }}
          >
            {layout.boxes.map((box, i) => (
              <div
                key={filtered[i].cluster_id}
                className="absolute"
                style={{ top: box.top, left: box.left, width: box.width }}
              >
                <ElsewhereCard item={filtered[i]} index={i} imageHeight={box.height} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Public component — wraps inner in Suspense for useSearchParams ───────────

export default function ElsewhereFilterGrid({ items }: { items: ElsewhereItem[] }) {
  return (
    <Suspense fallback={null}>
      <FilterGridInner items={items} />
    </Suspense>
  )
}
