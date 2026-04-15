import Link from 'next/link'
import { getPortfolio, getPhoto, sortCollections } from '@/lib/portfolio'
import { getAllPosts } from '@/lib/content'
import type { BlogFrontmatter, JournalFrontmatter, SubtextFrontmatter, PostEntry } from '@/lib/content'
import { getJournalPhoto } from '@/lib/journal'
import EmailCapture from '@/components/EmailCapture'
import HeroImage from '@/components/HeroImage'
import CollectionCard from '@/components/CollectionCard'

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

// ─── Journal card — photo-forward, 3:2 thumb via journal.json ─────────────────

function JournalCard({ post }: { post: PostEntry<JournalFrontmatter> }) {
  const fm = post.frontmatter
  const heroPhoto = getJournalPhoto(fm.hero_photo_id)

  const gradient =
    heroPhoto && heroPhoto.dominant_colors.length >= 2
      ? `linear-gradient(145deg, ${heroPhoto.dominant_colors[0]}, ${heroPhoto.dominant_colors[1]}${
          heroPhoto.dominant_colors[2] ? `, ${heroPhoto.dominant_colors[2]}` : ''
        })`
      : 'linear-gradient(145deg, #C4BEB4, #8a8580)'

  const metaLine = [formatDateShort(fm.date), fm.location ?? null]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link href={`/journal/${post.slug}`} className="group block">
      <div
        className="relative w-full overflow-hidden mb-3"
        style={{ aspectRatio: '3 / 2', background: gradient }}
      >
        {heroPhoto?.thumbnail_url && (
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
            <img
              src={heroPhoto.thumbnail_url}
              alt={fm.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
      <h3 className="font-display text-xl text-paper group-hover:text-paper/70 transition-colors leading-snug">
        {fm.title}
      </h3>
      <p className="text-paper/70 text-sm mt-1">{metaLine}</p>
    </Link>
  )
}

// ─── Subtext Lab card — three-state: image / video / text-only ────────────────

function thumbUrl(heroUrl: string): string {
  return heroUrl.endsWith('-hero.jpg')
    ? heroUrl.replace(/-hero\.jpg$/, '-thumb.jpg')
    : heroUrl
}

function SubtextCard({ post }: { post: PostEntry<SubtextFrontmatter> }) {
  const fm = post.frontmatter
  const hasHero = fm.type === 'essay' && 'hero' in fm && fm.hero
  const isVideo = fm.type === 'video'
  const posterUrl = isVideo && 'video_poster' in fm ? (fm as Extract<SubtextFrontmatter, { type: 'video' }>).video_poster : null
  const thumbSrc = hasHero ? thumbUrl((fm as Extract<SubtextFrontmatter, { type: 'essay' }>).hero as string) : posterUrl

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

export default async function HomePage() {
  const portfolio = getPortfolio()
  const featuredCollections = portfolio
    ? sortCollections(portfolio.collections, portfolio.photos).slice(0, 4)
    : []

  // Fetch latest entry from each section (sorted date desc, draft excluded in prod)
  const [blogPosts, journalEntries, subtextPosts] = await Promise.all([
    getAllPosts('blog'),
    getAllPosts('journal'),
    getAllPosts('subtext-lab'),
  ])

  const latestBlog = blogPosts[0] ?? null
  const latestJournal = journalEntries[0] ?? null
  const latestSubtext = subtextPosts[0] ?? null

  const hasLatest = latestBlog || latestJournal || latestSubtext

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-end pb-16 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0">
          <HeroImage />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-black/10 to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl animate-fade-up">
          <p className="text-paper/70 text-sm tracking-[0.3em] uppercase mb-4">StudioTJ</p>
          <h1 className="font-display text-5xl md:text-7xl text-paper leading-tight mb-6">
            Architecture, atmosphere, monochrome.
          </h1>
          <p className="text-paper/70 text-lg mb-8 max-w-md leading-relaxed">
            A studio built around photography, and everything it kept pulling in.
          </p>
          <div className="flex gap-4">
            <Link href="/portfolio" className="btn-primary">View Portfolio</Link>
            <Link href="/shop" className="btn-outline border-paper text-paper hover:bg-paper hover:text-ink">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Collections */}
      {featuredCollections.length > 0 && (
        <section className="px-6 md:px-12 py-20">
          <div className="flex items-end justify-between mb-12">
            <h2 className="section-title">Collections</h2>
            <Link href="/portfolio" className="nav-link">View all →</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredCollections.map((collection, i) => {
              const heroPhoto = collection.hero_photo_id
                ? getPhoto(collection.hero_photo_id)
                : null
              return (
                <CollectionCard
                  key={collection.slug}
                  collection={collection}
                  heroPhoto={heroPhoto}
                  index={i}
                  variant="homepage"
                />
              )
            })}
          </div>
        </section>
      )}

      {/* About strip */}
      <section className="border-t border-dust/40 px-6 md:px-12 py-20">
        <div className="max-w-2xl">
          <h2 className="section-title mb-6">The work</h2>
          <p className="text-muted leading-relaxed mb-4">
            StudioTJ is a one-person studio working across photography, print, and writing. The photographs come first; the shop, the journal, and The Subtext Lab are what grew around them.
          </p>
          <p className="text-muted leading-relaxed mb-8">
            Run by T.J. van der Heeft. Prints and products live in the <Link href="/shop">shop</Link>.
          </p>
          <Link href="/about" className="btn-outline">About the studio</Link>
        </div>
      </section>

      {/* Latest strip — one card per section, graceful degradation */}
      {hasLatest && (
        <section className="bg-ink text-paper px-6 md:px-12 py-20">
          <h2 className="font-display text-4xl md:text-6xl mb-12">Latest</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {latestBlog && <BlogCard post={latestBlog} />}
            {latestJournal && <JournalCard post={latestJournal} />}
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
        variant="light"
        headline="A list for later"
        subline="Leave your address and it joins the list. When StudioTJ has something worth sending, this is how you'll hear about it first."
      />
    </>
  )
}
