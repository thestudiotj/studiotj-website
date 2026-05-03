import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/content'
import type { SubtextFrontmatter, PostEntry } from '@/lib/content'
import SubjectFilter from '@/components/subtext-lab/SubjectFilter'

export const metadata: Metadata = {
  title: 'The Subtext Lab',
  description:
    'Notes on media and digital society. Threads between pieces — an article catches the first thought, an essay develops it, video carries it further.',
}

function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function thumbUrl(heroUrl: string): string {
  return heroUrl.endsWith('-hero.jpg')
    ? heroUrl.replace(/-hero\.jpg$/, '-thumb.jpg')
    : heroUrl
}

type SubtextEntry = PostEntry<SubtextFrontmatter>

function EntryCard({ post }: { post: SubtextEntry }) {
  const fm = post.frontmatter as SubtextFrontmatter
  const typeLabel = fm.type.charAt(0).toUpperCase() + fm.type.slice(1)
  const dateLabel = formatDateShort(fm.date)

  const hasHero = fm.type === 'essay' && 'hero' in fm && fm.hero
  const isVideo = fm.type === 'video'
  const posterUrl = isVideo && 'video_poster' in fm ? fm.video_poster : null
  const thumbSrc = hasHero ? thumbUrl(fm.hero as string) : posterUrl

  return (
    <article className="relative group bg-white/5 hover:bg-white/10 transition-colors rounded-sm overflow-hidden">
      {/* Stretched link covers the whole card; subject pills sit above it via z-10 */}
      <Link
        href={`/subtext-lab/${post.slug}`}
        className="absolute inset-0 z-0"
        aria-label={fm.title}
      />

      {/* Thumbnail slot */}
      {thumbSrc && (
        <div className="relative w-full aspect-[3/2] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbSrc}
            alt={fm.title}
            className="w-full h-full object-cover"
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

      {/* Text block — pointer-events-none so the stretched link underneath receives clicks */}
      <div className="relative z-10 p-5 pointer-events-none">
        <h2
          className={`font-display text-ink group-hover:text-[var(--accent)] transition-colors leading-tight mb-2 ${
            thumbSrc ? 'text-xl' : 'text-2xl'
          }`}
        >
          {fm.title}
        </h2>

        <p className="text-xs tracking-widest uppercase text-muted mb-2">
          {typeLabel} · {dateLabel}
        </p>

        {/* Subject pills — z-10 lets them intercept clicks above the card link */}
        <div className="flex flex-wrap gap-2 mb-3">
          {fm.subjects.map((s) => (
            <Link
              key={s}
              href={`/subtext-lab?subject=${encodeURIComponent(s)}`}
              className="relative z-10 pointer-events-auto text-xs tracking-widest uppercase text-[var(--accent)] hover:underline"
            >
              {s}
            </Link>
          ))}
        </div>

        <p className="text-muted text-sm leading-relaxed">{post.summary}</p>
      </div>
    </article>
  )
}

export default async function SubtextLabPage({
  searchParams,
}: {
  searchParams: { subject?: string | string[] }
}) {
  const posts = await getAllPosts('subtext-lab')

  const allSubjects = Array.from(
    new Set(posts.flatMap((p) => (p.frontmatter as SubtextFrontmatter).subjects))
  ).sort()
  const showFilter = allSubjects.length >= 3

  const activeSubject =
    typeof searchParams.subject === 'string' ? searchParams.subject : null

  const visible = activeSubject
    ? posts.filter((p) =>
        (p.frontmatter as SubtextFrontmatter).subjects.includes(
          activeSubject as SubtextFrontmatter['subjects'][number]
        )
      )
    : posts

  return (
    <div className="pt-24 px-6 md:px-12 pb-20 max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="section-title mb-4">The Subtext Lab</h1>
        <p className="text-muted text-lg leading-relaxed">
          Notes on media and digital society. Threads between pieces — an article catches the first
          thought, an essay develops it, video carries it further.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/subtext-lab-header-logo.webp"
          alt="The Subtext Lab"
          width={152}
          height={152}
          className="mt-6"
        />
      </div>

      {showFilter && (
        <SubjectFilter subjects={allSubjects} activeSubject={activeSubject} />
      )}

      {posts.length === 0 ? null : visible.length === 0 ? (
        <p className="text-muted italic">
          No entries yet — still watching, still reading, still playing.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {visible.map((post) => (
            <EntryCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {/* Info copy */}
      <div className="mt-16 pt-12 border-t border-dust/30 space-y-5 text-muted leading-relaxed">
        <p>The Subtext Lab is analytical work on media and the systems around it — what a film is doing under the surface, what an album is arguing about its own time, what a piece of digital culture reveals about the platform it lives on. It is observation that wants to be written down, with enough room to sit with the question and let it open.</p>
        <p>An <strong className="font-semibold text-ink">article</strong> is a sharpened observation — sometimes a paragraph that lands, sometimes pages that take their time, but always a complete piece. An <strong className="font-semibold text-ink">essay</strong> is the work of building an argument — a question pursued at length, evidence gathered, claims tested, a position arrived at over time. A <strong className="font-semibold text-ink">video</strong> is the same kind of thinking carried into another medium — the moving image and the voice doing what the page can&apos;t. The same subject can appear in more than one form when a question keeps opening; a later piece returns to something an earlier piece left open.</p>
        <p>Attention runs across games, film, television, anime, manga, comics, books, music, tech, and society. Within them, certain questions recur — how a piece of work earns its pace, what an artwork carries from the moment that made it, what a system makes possible and what it forecloses. The work crosses media on purpose. A question that surfaces in a film can return in an album, or a game, in another piece of writing later on.</p>
        <p>The Subtext Lab is for readers willing to follow a thread. Each piece is an attempt at thinking out loud, in writing, with the time the work needs.</p>
        <p className="text-sm">
          <a href="mailto:subtext@studiotj.com" className="hover:text-ink transition-colors">
            subtext@studiotj.com
          </a>
        </p>
      </div>
    </div>
  )
}
