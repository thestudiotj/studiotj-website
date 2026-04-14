import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPostBySlug } from '@/lib/content'
import { mdxComponents } from '@/components/mdx'

export async function generateStaticParams() {
  const posts = await getAllPosts('blog')
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await getPostBySlug('blog', params.slug)
  if (!post) return {}
  return {
    title: post.frontmatter.title,
    description: post.summary,
    openGraph: {
      title: post.frontmatter.title,
      description: post.summary,
      ...(post.frontmatter.hero ? { images: [post.frontmatter.hero] } : {}),
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
    href="/blog"
    className="text-sm text-muted tracking-widest uppercase hover:text-[var(--accent)] transition-colors"
  >
    ← Blog
  </Link>
)

const proseClasses =
  'prose prose-lg prose-stone max-w-none ' +
  'prose-headings:font-display prose-headings:font-normal ' +
  'prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline'

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getPostBySlug('blog', params.slug)
  if (!post) notFound()

  const { frontmatter, body, readingTime } = post

  // ── Note layout ─────────────────────────────────────────────────────────────
  if (frontmatter.type === 'note') {
    const heroUrl = frontmatter.hero
      ? frontmatter.hero.endsWith('-hero.jpg')
        ? frontmatter.hero.replace(/-hero\.jpg$/, '-thumb.jpg')
        : frontmatter.hero
      : null

    return (
      <div className="pt-24 px-6 md:px-12 pb-20">
        <div className="max-w-2xl">
          {backLink}

          <h1 className="font-display text-4xl md:text-5xl text-ink mt-10 mb-3 leading-tight">
            {frontmatter.title}
          </h1>

          <p className="text-sm tracking-widest uppercase text-muted mb-8">
            Note · {formatDateLong(frontmatter.date)}
          </p>

          {heroUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroUrl}
              alt={frontmatter.title}
              className="w-full mb-8"
            />
          )}

          <article className={proseClasses}>
            <MDXRemote source={body} components={mdxComponents} />
          </article>
        </div>
      </div>
    )
  }

  // ── Essay layout ─────────────────────────────────────────────────────────────
  const metaSegments: string[] = [
    'Essay',
    formatDateLong(frontmatter.date),
    ...(frontmatter.location ? [frontmatter.location] : []),
    ...(frontmatter.shoot_date ? [formatDateLong(frontmatter.shoot_date)] : []),
    `${readingTime} min read`,
  ]

  // Related essays — tag overlap with recency fallback
  const allPosts = await getAllPosts('blog')
  const allEssays = allPosts.filter(
    (p) => p.frontmatter.type === 'essay' && p.slug !== post.slug
  )
  const currentTags = new Set(frontmatter.tags ?? [])
  const matched = allEssays.filter((p) =>
    (p.frontmatter.tags ?? []).some((t) => currentTags.has(t))
  )
  const unmatched = allEssays.filter((p) => !matched.includes(p))
  const related = [...matched, ...unmatched].slice(0, 2)

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      <div className="max-w-4xl">
        {backLink}

        {frontmatter.hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frontmatter.hero}
            alt={frontmatter.title}
            className="w-full mt-6"
          />
        )}
      </div>

      <div className="max-w-2xl mt-8">
        <h1 className="font-display text-4xl md:text-5xl text-ink mb-3 leading-tight">
          {frontmatter.title}
        </h1>

        <p className="text-sm tracking-widest uppercase text-muted mb-10">
          {metaSegments.join(' · ')}
        </p>

        <article className={proseClasses}>
          <MDXRemote source={body} components={mdxComponents} />
        </article>

        {related.length > 0 && (
          <section className="mt-16 pt-12 border-t border-dust/30">
            <h2 className="font-display text-2xl text-ink mb-8">More essays</h2>
            <div className="divide-y divide-dust/30">
              {related.map((p) => (
                <article key={p.slug} className="py-8 group">
                  <Link href={`/blog/${p.slug}`} className="block">
                    <p className="text-sm tracking-widest uppercase text-muted mb-1">
                      Essay · {formatDateShort(p.frontmatter.date)}
                    </p>
                    <h3 className="font-display text-xl text-ink group-hover:text-[var(--accent)] transition-colors mb-2">
                      {p.frontmatter.title}
                    </h3>
                    <p className="text-muted leading-relaxed">{p.summary}</p>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
