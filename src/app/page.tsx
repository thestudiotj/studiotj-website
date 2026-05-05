import Link from 'next/link'
import { getPortfolio, sortCollections } from '@/lib/portfolio'
import type { Photo } from '@/lib/portfolio'
import { getAllPosts } from '@/lib/content'
import type { BlogFrontmatter, SubtextFrontmatter, PostEntry } from '@/lib/content'
import { getAllSeriesPhotos } from '@/lib/series'
import { getElsewhereData } from '@/lib/elsewhere'
import EmailCapture from '@/components/EmailCapture'
import HeroImage from '@/components/HeroImage'
import CollectionCard from '@/components/CollectionCard'
import SeriesRotator from '@/components/SeriesRotator'
import ElsewhereHomeGrid from '@/components/ElsewhereHomeGrid'

// ─── Date formatter ───────────────────────────────────────────────────────────

function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

// ─── Blog card — text-forward, no thumbnail ───────────────────────────────────

function BlogCard({ post }: { post: PostEntry<BlogFrontmatter> }) {
  const fm = post.frontmatter
  const typeLabel = fm.type === 'note' ? 'Note' : 'Essay'
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <p className="text-paper/70 text-xs tracking-widest uppercase mb-2">
        {typeLabel} · {formatDateShort(fm.date)}
      </p>
      <h3 className="font-display text-xl text-paper group-hover:text-paper/70 transition-colors leading-snug mb-2">
        {fm.title}
      </h3>
      <p className="text-paper/70 text-sm leading-relaxed line-clamp-3">{post.summary}</p>
    </Link>
  )
}

// ─── Subtext Lab card ─────────────────────────────────────────────────────────

function thumbUrl(heroUrl: string): string {
  return heroUrl.endsWith('-hero.jpg')
    ? heroUrl.replace(/-hero\.jpg$/, '-thumb.jpg')
    : heroUrl
}

function SubtextCard({ post }: { post: PostEntry<SubtextFrontmatter> }) {
  const fm = post.frontmatter
  const hasHero = fm.type === 'essay' && 'hero' in fm && fm.hero
  const isVideo = fm.type === 'video'
  const posterUrl =
    isVideo && 'video_poster' in fm
      ? (fm as Extract<SubtextFrontmatter, { type: 'video' }>).video_poster
      : null
  const thumbSrc = hasHero
    ? thumbUrl((fm as Extract<SubtextFrontmatter, { type: 'essay' }>).hero as string)
    : posterUrl

  return (
    <Link href={`/subtext-lab/${post.slug}`} className="group block">
      {thumbSrc && (
        <div className="relative w-full aspect-[3/2] overflow-hidden mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbSrc}
            alt={fm.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          {isVideo && (
            <>
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-12 h-12 flex items-center justify-center rounded-full bg-black/60">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 translate-x-0.5" fill="var(--accent)">
                    <polygon points="6,4 20,12 6,20" />
                  </svg>
                </span>
              </div>
            </>
          )}
        </div>
      )}
      <h3
        className={`font-display text-paper group-hover:text-paper/70 transition-colors leading-snug mb-2 ${
          thumbSrc ? 'text-xl' : 'text-2xl'
        }`}
      >
        {fm.title}
      </h3>
      {post.summary && (
        <p className="text-paper/70 text-sm leading-relaxed line-clamp-3">{post.summary}</p>
      )}
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// Rotate daily so the hero image changes without client-side JS.
export const revalidate = 86400

const HERO_IMAGES = [
  '/images/hero-light.webp',
  '/images/hero-dark.webp',
  '/images/hero-subtext.webp',
]

export default async function HomePage() {
  const heroSrc = HERO_IMAGES[Math.floor(Date.now() / 86400000) % HERO_IMAGES.length]
  const portfolio = getPortfolio()
  const featuredCollections = portfolio
    ? sortCollections(portfolio.collections, portfolio.photos).slice(0, 4)
    : []
  const photoMap = portfolio
    ? new Map(portfolio.photos.map(p => [p.id, p]))
    : new Map()

  const seriesPhotos = getAllSeriesPhotos()

  const elsewhereItems = getElsewhereData().items.slice(0, 8)
  const showElsewhere = elsewhereItems.length >= 3

  const [blogPosts, subtextPosts] = await Promise.all([
    getAllPosts('blog'),
    getAllPosts('subtext-lab'),
  ])

  const latestBlog = blogPosts[0] ?? null
  const latestSubtext = subtextPosts[0] ?? null
  const hasLatest = latestBlog || latestSubtext

  return (
    <>
      {/* Hero — breakout so the image remains edge-to-edge despite <main> max-width */}
      <section className="breakout relative min-h-[85vh] md:min-h-[60vh] max-h-[900px] flex items-end pb-16 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0">
          <HeroImage src={heroSrc} />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-black/10 to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl animate-fade-up">
          <p className="text-paper/70 text-sm tracking-[0.3em] uppercase mb-4">StudioTJ</p>
          <h1 className="font-display text-5xl md:text-7xl text-paper leading-tight mb-6">
            Photography, and everything it pulled in.
          </h1>
          <p className="text-paper/70 text-lg mb-8 max-w-md leading-relaxed">
            Four photography collections and the prints to match, ongoing series, and The Subtext Lab on media and society.
          </p>
          <div className="flex gap-4">
            <Link href="/portfolio" className="btn-primary">View Portfolio</Link>
            <Link href="/shop" className="btn-outline">View Shop</Link>
          </div>
        </div>
      </section>

      {/* Collections */}
      {featuredCollections.length > 0 && (
        <section className="px-6 md:px-12 py-20">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="section-title">On view</h2>
              <p className="text-muted text-sm mt-1">Rotating weekly</p>
            </div>
            <Link href="/portfolio" className="nav-link">View all →</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredCollections.map((collection, i) => {
              const photos: Photo[] = collection.photo_ids
                .map(id => photoMap.get(id))
                .filter((p): p is Photo => p !== undefined)
              return (
                <CollectionCard
                  key={collection.slug}
                  collection={collection}
                  photos={photos}
                  index={i}
                  variant="homepage"
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Series — only rendered when at least one entry exists */}
      {seriesPhotos.length > 0 && (
        <section className="border-t border-dust/40 px-6 md:px-12 py-20">
          <div className="flex flex-col md:flex-row md:items-center gap-10 md:gap-16">
            <div className="md:w-1/2">
              <h2 className="section-title mb-6">Series</h2>
              <p className="text-muted leading-relaxed mb-8">
                Ongoing sequences of photographs, organized by subject, weather, and season.
              </p>
              <Link href="/series" className="btn-outline">View Series →</Link>
            </div>
            <div className="md:w-1/2 flex justify-center md:justify-end">
              <div className="w-full max-w-sm">
                <SeriesRotator photos={seriesPhotos} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Elsewhere — hidden until at least 3 items exist */}
      {showElsewhere && (
        <section className="border-t border-dust/40 px-6 md:px-12 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title">Elsewhere</h2>
              <p className="text-muted text-sm mt-1 italic">Lately, off-site.</p>
            </div>
            <Link href="/elsewhere" className="nav-link">See more →</Link>
          </div>
          <ElsewhereHomeGrid items={elsewhereItems} />
        </section>
      )}

      {/* About strip */}
      <section className="border-t border-dust/40 px-6 md:px-12 py-20">
        <div className="max-w-2xl">
          <h2 className="section-title mb-6">The work</h2>
          <p className="text-muted leading-relaxed mb-4">
            StudioTJ is a one-person studio working across photography, print, and writing. The photographs come first; the shop, the series, and The Subtext Lab are what grew around them.
          </p>
          <p className="text-muted leading-relaxed mb-8">
            Created by Tjeerd van der Heeft.
          </p>
          <Link href="/about" className="btn-outline">About the studio →</Link>
        </div>
      </section>

      {/* Latest strip — breakout so bg-ink spans edge-to-edge */}
      {hasLatest && (
        <section className="breakout bg-ink text-paper px-6 md:px-12 py-20">
          <h2 className="font-display text-4xl md:text-6xl mb-12">Latest</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {latestBlog && <BlogCard post={latestBlog} />}
            {latestSubtext && (
              <div className="theme-subtext">
                <SubtextCard post={latestSubtext} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Email capture */}
      <EmailCapture
        id="email-capture"
        variant="light"
        headline="When there's something to share"
        subline="New photography, new writing from The Subtext Lab, new work in the shop — gathered into one email when it's worth sending."
      />
    </>
  )
}
