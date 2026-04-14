import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPostBySlug } from '@/lib/content'
import type { GearFrontmatter } from '@/lib/content'
import { mdxComponents } from '@/components/mdx'

export const metadata: Metadata = {
  title: 'Gear — StudioTJ',
  description: "What I carry, what I shoot with, what I'd add next.",
}

// Status sort order: current → wishlist → previous
const STATUS_ORDER: Record<string, number> = { current: 0, wishlist: 1, previous: 2 }

// Category display order for navigation and section rendering
const CATEGORY_ORDER = [
  'Cameras',
  'Lenses',
  'Lighting',
  'Software',
  'Accessories',
  'Computer & Storage',
]

function categorySlug(category: string): string {
  // e.g. "Cameras" → "cameras", "Computer & Storage" → "computer-storage"
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')
}

interface GearEntryFull {
  slug: string
  frontmatter: GearFrontmatter
  summary: string
  body: string
}

export default async function GearPage() {
  const entries = await getAllPosts('gear')

  // Load full bodies for all entries (needed for MDXRemote)
  const fullEntries = (
    await Promise.all(entries.map((e) => getPostBySlug('gear', e.slug)))
  ).filter((e): e is NonNullable<typeof e> => e !== null) as GearEntryFull[]

  // Derive populated categories in display order
  const populatedCategories = CATEGORY_ORDER.filter((cat) =>
    fullEntries.some((e) => e.frontmatter.category === cat)
  )

  // Group and sort entries per category: status order, then date_added desc
  const byCategory = new Map<string, GearEntryFull[]>()
  for (const cat of populatedCategories) {
    const group = fullEntries
      .filter((e) => e.frontmatter.category === cat)
      .sort((a, b) => {
        const statusDiff =
          (STATUS_ORDER[a.frontmatter.status] ?? 99) -
          (STATUS_ORDER[b.frontmatter.status] ?? 99)
        if (statusDiff !== 0) return statusDiff
        return b.frontmatter.date_added.localeCompare(a.frontmatter.date_added)
      })
    byCategory.set(cat, group)
  }

  return (
    <div className="pt-24 px-6 md:px-12 pb-20 max-w-4xl">
      <h1 className="section-title mb-2">Gear</h1>
      <p className="text-muted text-lg mb-6">
        What I carry, what I shoot with, what I&apos;d add next.
      </p>

      {/* Disclosure banner */}
      <div className="bg-dust/20 border border-dust/40 rounded-sm px-5 py-4 mb-8 text-sm text-muted leading-relaxed">
        Some links go through affiliate programs; when you buy through them, StudioTJ earns a
        commission. If you ask me in person, this is what I&apos;d recommend — gear I use, gear I
        wish for, and gear I&apos;ve researched hard enough to vouch for.
      </div>

      {/* Category jump-nav — only populated categories */}
      {populatedCategories.length > 0 && (
        <nav aria-label="Jump to category" className="mb-10 flex flex-wrap items-center gap-y-2 text-sm tracking-widest uppercase">
          {populatedCategories.map((cat, i) => (
            <span key={cat} className="flex items-center">
              {i > 0 && (
                <span className="mx-3 text-muted select-none" aria-hidden="true">
                  ·
                </span>
              )}
              <a
                href={`#${categorySlug(cat)}`}
                className="text-muted hover:text-[var(--accent)] transition-colors"
              >
                {cat}
              </a>
            </span>
          ))}
        </nav>
      )}

      {/* Category sections */}
      {populatedCategories.map((cat) => {
        const group = byCategory.get(cat) ?? []
        return (
          <section key={cat} className="mb-16">
            <h2
              id={categorySlug(cat)}
              className="font-display text-3xl text-ink mb-0 pt-4 border-t border-dust/30"
            >
              {cat}
            </h2>

            {group.length === 0 ? (
              <p className="text-muted mt-4">Nothing here yet.</p>
            ) : (
              <div>
                {group.map((entry) => (
                  <article
                    key={entry.slug}
                    id={entry.slug}
                    className="py-10 border-b border-dust/20 last:border-0"
                  >
                    {/* Name + status badge */}
                    <h3 className="font-display text-2xl text-ink leading-tight">
                      <a
                        href={`#${entry.slug}`}
                        className="hover:text-[var(--accent)] transition-colors"
                      >
                        {entry.frontmatter.name}
                      </a>
                      <span className="ml-3 text-sm font-sans tracking-widest uppercase text-muted font-normal">
                        · {entry.frontmatter.status}
                      </span>
                    </h3>

                    {/* Image slot — graceful thumb fallback; absent when no image field */}
                    {entry.frontmatter.image && (
                      <div className="mt-4 mb-2">
                        <div
                          className="relative w-full overflow-hidden"
                          style={{ aspectRatio: '3 / 2', maxWidth: '640px' }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={entry.frontmatter.image.replace(/(\.[^.]+)$/, '-thumb$1')}
                            alt={entry.frontmatter.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {entry.frontmatter.image_caption && (
                          <p className="text-xs text-muted mt-1.5">
                            {entry.frontmatter.image_caption}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Summary lede */}
                    <p className="text-base font-medium text-ink mt-3 mb-4 leading-relaxed">
                      {entry.summary}
                    </p>

                    {/* MDX body */}
                    <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-normal prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
                      <MDXRemote source={entry.body} components={mdxComponents} />
                    </div>

                    {/* Affiliate link — badge only if affiliate_provider is truthy */}
                    {entry.frontmatter.affiliate_link && (
                      <p className="mt-6 text-sm">
                        <a
                          href={entry.frontmatter.affiliate_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline"
                        >
                          Buy / view {entry.frontmatter.name}
                        </a>
                        {entry.frontmatter.affiliate_provider && (
                          <span className="text-muted ml-1">(affiliate)</span>
                        )}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
