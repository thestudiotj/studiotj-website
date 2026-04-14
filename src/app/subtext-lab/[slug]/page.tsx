import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPostBySlug } from '@/lib/content'
import type { SubtextFrontmatter, PostEntry } from '@/lib/content'
import { mdxComponents } from '@/components/mdx'
import Video from '@/components/mdx/Video'

export async function generateStaticParams() {
  const posts = await getAllPosts('subtext-lab')
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await getPostBySlug('subtext-lab', params.slug)
  if (!post) return {}
  const fm = post.frontmatter as SubtextFrontmatter
  const ogImage =
    fm.type === 'essay' && fm.hero
      ? fm.hero
      : fm.type === 'video'
      ? fm.video_poster
      : undefined
  return {
    title: fm.title,
    description: post.summary,
    openGraph: {
      title: fm.title,
      description: post.summary,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

function formatDateLong(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

const backLink = (
  <Link
    href="/subtext-lab"
    className="text-sm text-muted tracking-widest uppercase hover:text-[var(--accent)] transition-colors"
  >
    ← Subtext Lab
  </Link>
)

const proseClasses =
  'prose prose-lg prose-stone max-w-none ' +
  'prose-headings:font-display prose-headings:font-normal ' +
  'prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline'

function SubjectPills({ subjects }: { subjects: SubtextFrontmatter['subjects'] }) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {subjects.map((s) => (
        <Link
          key={s}
          href={`/subtext-lab?subject=${encodeURIComponent(s)}`}
          className="text-xs tracking-widest uppercase text-[var(--accent)] hover:underline"
        >
          {s}
        </Link>
      ))}
    </div>
  )
}

function thumbUrl(heroUrl: string): string {
  return heroUrl.endsWith('-hero.jpg')
    ? heroUrl.replace(/-hero\.jpg$/, '-thumb.jpg')
    : heroUrl
}

type SubtextEntry = PostEntry<SubtextFrontmatter>

function RelatedCard({ post }: { post: SubtextEntry }) {
  const fm = post.frontmatter as SubtextFrontmatter
  const typeLabel = fm.type.charAt(0).toUpperCase() + fm.type.slice(1)
  const dateLabel = formatDateShort(fm.date)

  const hasHero = fm.type === 'essay' && 'hero' in fm && fm.hero
  const isVideo = fm.type === 'video'
  const posterUrl = isVideo && 'video_poster' in fm ? fm.video_poster : null
  const thumbSrc = hasHero ? thumbUrl(fm.hero as string) : posterUrl

  return (
    <article className="relative group bg-white/5 hover:bg-white/10 transition-colors rounded-sm overflow-hidden">
      <Link
        href={`/subtext-lab/${post.slug}`}
        className="absolute inset-0 z-0"
        aria-label={fm.title}
      />
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
                <span className="w-10 h-10 flex items-center justify-center rounded-full bg-black/60">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 translate-x-0.5" fill="var(--accent)">
                    <polygon points="6,4 20,12 6,20" />
                  </svg>
                </span>
              </div>
            </>
          )}
        </div>
      )}
      <div className="relative z-10 p-4">
        <p className="text-xs tracking-widest uppercase text-muted mb-1">
          {typeLabel} · {dateLabel}
        </p>
        <h3
          className={`font-display text-ink group-hover:text-[var(--accent)] transition-colors leading-tight mb-2 ${
            thumbSrc ? 'text-base' : 'text-lg'
          }`}
        >
          {fm.title}
        </h3>
        <p className="text-muted text-sm leading-relaxed">{post.summary}</p>
      </div>
    </article>
  )
}

function RelatedPosts({
  allPosts,
  currentSlug,
  currentSubjects,
}: {
  allPosts: SubtextEntry[]
  currentSlug: string
  currentSubjects: SubtextFrontmatter['subjects']
}) {
  const others = allPosts.filter((p) => p.slug !== currentSlug)
  const subjectSet = new Set(currentSubjects)
  const matched = others.filter((p) =>
    (p.frontmatter as SubtextFrontmatter).subjects.some((s) => subjectSet.has(s))
  )
  const unmatched = others.filter((p) => !matched.includes(p))
  const related = [...matched, ...unmatched].slice(0, 2)

  if (related.length === 0) return null

  return (
    <section className="mt-16 pt-12 border-t border-dust/30">
      <h2 className="text-sm tracking-widest uppercase text-muted mb-6">Related</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {related.map((p) => (
          <RelatedCard key={p.slug} post={p} />
        ))}
      </div>
    </section>
  )
}

export default async function SubtextLabPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getPostBySlug('subtext-lab', params.slug)
  if (!post) notFound()

  const { frontmatter: _fm, body, readingTime } = post
  const fm = _fm as SubtextFrontmatter
  const allPosts = await getAllPosts('subtext-lab')

  // ── Essay layout ─────────────────────────────────────────────────────────────
  if (fm.type === 'essay') {
    const metaSegments = [
      'Essay',
      formatDateLong(fm.date),
      `${readingTime} min read`,
    ]

    return (
      <div className="pt-24 px-6 md:px-12 pb-20">
        <div className="max-w-4xl">
          {backLink}

          {fm.hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fm.hero}
              alt={fm.title}
              className="w-full mt-6"
            />
          )}
        </div>

        <div className="max-w-2xl mt-8">
          <h1 className="font-display text-4xl md:text-5xl text-ink mb-3 leading-tight">
            {fm.title}
          </h1>

          <SubjectPills subjects={fm.subjects} />

          <p className="text-sm tracking-widest uppercase text-muted mb-10">
            {metaSegments.join(' · ')}
          </p>

          <article className={proseClasses}>
            <MDXRemote source={body} components={mdxComponents} />
          </article>

          <RelatedPosts
            allPosts={allPosts}
            currentSlug={post.slug}
            currentSubjects={fm.subjects}
          />
        </div>
      </div>
    )
  }

  // ── Article layout ────────────────────────────────────────────────────────────
  if (fm.type === 'article') {
    const metaSegments = ['Article', formatDateLong(fm.date)]

    return (
      <div className="pt-24 px-6 md:px-12 pb-20">
        <div className="max-w-2xl">
          {backLink}

          <h1 className="font-display text-4xl md:text-5xl text-ink mt-10 mb-3 leading-tight">
            {fm.title}
          </h1>

          <SubjectPills subjects={fm.subjects} />

          <p className="text-sm tracking-widest uppercase text-muted mb-10">
            {metaSegments.join(' · ')}
          </p>

          <article className={proseClasses}>
            <MDXRemote source={body} components={mdxComponents} />
          </article>

          <RelatedPosts
            allPosts={allPosts}
            currentSlug={post.slug}
            currentSubjects={fm.subjects}
          />
        </div>
      </div>
    )
  }

  // ── Video layout ──────────────────────────────────────────────────────────────
  const metaSegments = ['Video', formatDateLong(fm.date)]

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      <div className="max-w-4xl">
        {backLink}

        <div className="mt-6 w-full">
          <Video
            id={fm.video_embed}
            poster={fm.video_poster}
            hero
          />
        </div>
      </div>

      <div className="max-w-2xl mt-8">
        <h1 className="font-display text-4xl md:text-5xl text-ink mb-3 leading-tight">
          {fm.title}
        </h1>

        <SubjectPills subjects={fm.subjects} />

        <p className="text-sm tracking-widest uppercase text-muted mb-10">
          {metaSegments.join(' · ')}
        </p>

        <article className={proseClasses}>
          <MDXRemote source={body} components={mdxComponents} />
        </article>

        <RelatedPosts
          allPosts={allPosts}
          currentSlug={post.slug}
          currentSubjects={fm.subjects}
        />
      </div>
    </div>
  )
}
