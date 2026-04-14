import Link from 'next/link'
import { getAllPosts } from '@/lib/content'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Short notes from the edit desk. Longer pieces from the walk itself.',
}

function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { tag?: string | string[] }
}) {
  const posts = await getAllPosts('blog')

  const allTags = Array.from(
    new Set(posts.flatMap((p) => p.frontmatter.tags ?? []))
  ).sort()
  const showFilter = allTags.length >= 3

  const activeTag = typeof searchParams.tag === 'string' ? searchParams.tag : null
  const visible = activeTag
    ? posts.filter((p) => p.frontmatter.tags?.includes(activeTag))
    : posts

  const pillItems = [
    { label: 'All', href: '/blog', active: activeTag === null },
    ...allTags.map((tag) => ({
      label: tag,
      href: `/blog?tag=${encodeURIComponent(tag)}`,
      active: activeTag === tag,
    })),
  ]

  return (
    <div className="pt-24 px-6 md:px-12 pb-20 max-w-4xl">
      <h1 className="section-title mb-4">Blog</h1>
      <p className="text-muted mb-10 text-lg">
        Short notes from the edit desk. Longer pieces from the walk itself.
      </p>

      {showFilter && (
        <div className="mb-10 flex flex-wrap items-center gap-y-2 text-sm tracking-widest uppercase">
          {pillItems.map((item, i) => (
            <span key={item.label} className="flex items-center">
              {i > 0 && (
                <span className="mx-3 text-muted select-none" aria-hidden="true">
                  ·
                </span>
              )}
              <Link
                href={item.href}
                className={
                  item.active
                    ? 'text-[var(--accent)]'
                    : 'text-muted hover:text-[var(--accent)] transition-colors'
                }
              >
                {item.label}
              </Link>
            </span>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-muted">No posts yet.</p>
      ) : visible.length === 0 ? (
        <p className="text-muted">
          No posts with that tag.{' '}
          <Link href="/blog" className="text-[var(--accent)] hover:underline">
            Back to all posts
          </Link>
        </p>
      ) : (
        <div className="divide-y divide-dust/30">
          {visible.map((post) => (
            <article key={post.slug} className="py-10 group">
              <Link href={`/blog/${post.slug}`} className="block">
                <p className="text-sm tracking-widest uppercase text-muted mb-1">
                  {post.frontmatter.type === 'note' ? 'Note' : 'Essay'} ·{' '}
                  {formatDateShort(post.frontmatter.date)}
                </p>
                <h2 className="font-display text-2xl text-ink group-hover:text-[var(--accent)] transition-colors mb-2">
                  {post.frontmatter.title}
                </h2>
                <p className="text-muted leading-relaxed">{post.frontmatter.summary}</p>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
