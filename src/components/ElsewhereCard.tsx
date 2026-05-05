'use client'

import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import type { ElsewhereItem, Platform } from '@/lib/elsewhere'

// ─── Constants ────────────────────────────────────────────────────────────────

export const METADATA_HEIGHT = 84 // px — fixed metadata strip height for layout math

const PLATFORM_LABELS: Record<Platform, string> = {
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  pixelfed: 'Pixelfed',
  instagram: 'Instagram',
  pinterest: 'Pinterest',
  tiktok: 'TikTok',
  youtube: 'YouTube',
}

// ─── Identity indicator ───────────────────────────────────────────────────────

function IdentityDot({ identity }: { identity: ElsewhereItem['identity'] }) {
  if (identity === 'studiotj') return null
  if (identity === 'subtextlab') {
    return (
      <div
        className="absolute top-2 right-2 w-2 h-2 rounded-full z-10"
        style={{ backgroundColor: 'var(--st-accent)' }}
        title="Subtext Lab"
        aria-hidden="true"
      />
    )
  }
  // tjvanderheeft — open ring in accent-deep
  return (
    <div
      className="absolute top-2 right-2 w-2 h-2 rounded-full border z-10"
      style={{ borderColor: 'var(--accent-deep)', backgroundColor: 'transparent' }}
      title="tjvanderheeft"
      aria-hidden="true"
    />
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface ElsewhereCardProps {
  item: ElsewhereItem
  index: number
  /** Explicit image area height (px) from the justified-layout engine.
   *  When omitted the image falls back to aspect-ratio CSS. */
  imageHeight?: number
}

export default function ElsewhereCard({ item, index, imageHeight }: ElsewhereCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const [imgLoaded, setImgLoaded] = useState(false)

  const isTextOnly = !item.primary_image_url || item.aspect_ratio === 0

  // Most recently posted channel drives the primary card link
  const primaryChannel = [...item.channels].sort(
    (a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
  )[0]

  const copySnippet =
    item.copy.length > 120 ? item.copy.slice(0, 120).trimEnd() + '…' : item.copy

  const firstSentence = item.copy.split(/[.!?\n]/)[0]?.trim() ?? ''
  const imgAlt = firstSentence.length > 0
    ? (firstSentence.length > 100 ? firstSentence.slice(0, 100) + '…' : firstSentence)
    : `Post by ${item.identity}`

  const timestamp = formatDistanceToNow(new Date(item.earliest_posted_at), { addSuffix: true })
  const isoTimestamp = new Date(item.earliest_posted_at).toISOString()

  const imageStyle = imageHeight
    ? { height: imageHeight }
    : { aspectRatio: String(item.aspect_ratio > 0 ? item.aspect_ratio : 1) }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.04, 0.32),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      <article className="group relative">
        {/* Primary link — wraps image area + copy snippet + timestamp */}
        <a
          href={primaryChannel.public_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
          aria-label={copySnippet}
        >
          {isTextOnly ? (
            /* Text-only card */
            <div
              className="relative flex items-center justify-center p-4"
              style={{ ...imageStyle, backgroundColor: 'rgba(75,123,200,0.09)' }}
            >
              <IdentityDot identity={item.identity} />
              <p className="text-ink text-sm leading-relaxed line-clamp-4 text-center">
                {item.copy}
              </p>
            </div>
          ) : (
            /* Image card */
            <div className="relative overflow-hidden" style={imageStyle}>
              {/* Placeholder colour while image loads */}
              <div className="absolute inset-0 bg-dust/30" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.primary_image_url!}
                alt={imgAlt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                style={{
                  opacity: imgLoaded ? 1 : 0,
                  transition: imgLoaded ? 'opacity 0.35s ease, transform 0.7s ease' : 'none',
                }}
                loading={index < 8 ? 'eager' : 'lazy'}
                onLoad={() => setImgLoaded(true)}
              />
              <IdentityDot identity={item.identity} />
            </div>
          )}

          {/* Metadata strip */}
          <div className="pt-1.5 pb-0.5">
            {!isTextOnly && (
              <p className="text-muted text-xs leading-snug line-clamp-2 mb-0.5">{copySnippet}</p>
            )}
            <time
              dateTime={isoTimestamp}
              title={isoTimestamp}
              className="text-muted/70 text-xs block"
            >
              {timestamp}
            </time>
          </div>
        </a>

        {/* Channel chips — outside the primary link to avoid nested <a> */}
        <div className="flex flex-wrap gap-1 pt-1">
          {item.channels.map((ch) => (
            <a
              key={ch.platform}
              href={ch.public_url}
              target="_blank"
              rel="noopener noreferrer"
              title={`View on ${PLATFORM_LABELS[ch.platform]}`}
              className="inline-flex items-center p-1 border border-dust rounded-sm hover:border-muted transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/icons/elsewhere/${ch.platform}.svg`}
                alt={PLATFORM_LABELS[ch.platform]}
                className="w-3 h-3 opacity-50 hover:opacity-80"
                aria-hidden="true"
              />
              <span className="sr-only">{PLATFORM_LABELS[ch.platform]}</span>
            </a>
          ))}
        </div>
      </article>
    </motion.div>
  )
}
