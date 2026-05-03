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
      {/* Header */}
      <div className="mb-10">
        <h1 className="section-title mb-4">Blog</h1>
        <p className="text-muted text-lg leading-relaxed">
          Short notes from the edit desk and the studio. Longer pieces from the walk itself.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blog-header-logo.webp"
          alt="StudioTJ Blog"
          width={152}
          height={152}
          className="mt-6"
        />
      </div>

      {/* Filter */}
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

      {/* Posts */}
      {posts.length === 0 ? null : visible.length === 0 ? (
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
                <p className="text-muted leading-relaxed">{post.summary}</p>
              </Link>
            </article>
          ))}
        </div>
      )}

      {/* Info copy */}
      <div className="mt-16 pt-12 border-t border-dust/30">
        <div className="space-y-4 text-muted leading-relaxed">
          <p>Notes are quick. Something caught the eye in editing, a shoot worked or didn&apos;t, a small decision that came up in running a one-person studio. Essays are slower — a day spent shooting somewhere, written long enough to do justice to the place, or a working-through of a question that needs more than a paragraph.</p>
          <p>Photography is at the centre: the process, the craft, the choices that make a frame work. Around it, the work of running StudioTJ as a sole proprietorship — decisions about the shop, what&apos;s worth doing, what isn&apos;t. And then whatever else is sitting at the desk on a given day that wants writing down.</p>
          <p>None of it is advice. Working notes from someone in the middle of figuring it out.</p>
        </div>
        <p className="text-muted text-sm mt-6">
          <a href="mailto:contact@studiotj.com" className="hover:text-ink transition-colors">
            contact@studiotj.com
          </a>
        </p>
      </div>
    </div>
  )
}
