import type { Metadata } from 'next'
import { getElsewhereData } from '@/lib/elsewhere'
import ElsewhereFilterGrid from '@/components/ElsewhereFilterGrid'

// ─── Brand-voice copy ─────────────────────────────────────────────────────────

const TAGLINE = 'Where the work lives off-site.'
const HERO_BODY =
  'A feed of posts shipped to Bluesky, Mastodon, Pixelfed, YouTube, Instagram, Pinterest, and TikTok — gathered into one place. Same photo posted to several channels appears once, with chips for where it landed.'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Elsewhere · StudioTJ',
  description: HERO_BODY,
  openGraph: {
    images: ['/og/studiotj-default.jpg'],
    type: 'website',
  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ElsewherePage() {
  const data = getElsewhereData()

  const isEmpty = data.items.length === 0

  return (
    <>
      {/* ── Hero ── */}
      <section className="px-6 md:px-12 py-20 border-b border-dust/40">
        <div className="max-w-2xl">
          <p className="font-display text-2xl italic text-muted mb-4">{TAGLINE}</p>
          <p className="text-muted leading-relaxed">{HERO_BODY}</p>
        </div>
      </section>

      {/* ── Filter bar + grid (or global empty state) ── */}
      {isEmpty ? (
        <div className="px-6 md:px-12 py-24">
          <p className="text-muted leading-relaxed">
            Nothing&rsquo;s landed here yet. The aggregator runs every half hour — when posts go
            out, they show up here.
          </p>
        </div>
      ) : (
        <section className="py-8">
          <ElsewhereFilterGrid items={data.items} />
        </section>
      )}

      {/* ── Evergreen body block ── */}
      <section className="border-t border-dust/40 px-6 md:px-12 py-16">
        <div className="max-w-2xl">
          <p className="text-muted leading-relaxed">
            The site lives in one place; the work scatters. This page gathers it back. Each card is
            one post — a photo, a caption, a moment of attention spent somewhere else — and the row
            of chips at the bottom records every platform it landed on. Some cards have one chip;
            some have five. The ratio is its own data point.
          </p>
        </div>
      </section>
    </>
  )
}
