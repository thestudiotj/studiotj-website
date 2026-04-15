import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/content'
import { getJournalPhoto } from '@/lib/journal'

export async function generateMetadata(): Promise<Metadata> {
  const posts = await getAllPosts('journal')
  const mostRecent = posts[0]
  const heroUrl = mostRecent
    ? getJournalPhoto(mostRecent.frontmatter.hero_photo_id)?.hero_url
    : null

  return {
    title: 'Journal',
    description:
      'Photo galleries from walks, trips, and visits — the work beyond the four StudioTJ portfolio collections.',
    ...(heroUrl
      ? { openGraph: { images: [heroUrl] } }
      : {}),
  }
}

function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export default async function JournalPage() {
  const posts = await getAllPosts('journal')

  return (
    <div className="pt-24 px-6 md:px-12 pb-20 max-w-4xl">
      <h1 className="section-title mb-4">Journal</h1>
      <p className="text-muted mb-10 text-lg">
        Galleries from walks, trips, and visits. The four portfolio collections define what StudioTJ
        is; the journal is everything else worth keeping.
      </p>

      {posts.length === 0 ? (
        <p className="text-muted">
          Nothing here yet — first gallery in progress.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {posts.map((post) => {
            const heroPhoto = getJournalPhoto(post.frontmatter.hero_photo_id)
            const gradient =
              heroPhoto && heroPhoto.dominant_colors.length >= 2
                ? `linear-gradient(145deg, ${heroPhoto.dominant_colors[0]}, ${heroPhoto.dominant_colors[1]}${heroPhoto.dominant_colors[2] ? `, ${heroPhoto.dominant_colors[2]}` : ''})`
                : 'linear-gradient(145deg, #C4BEB4, #8a8580)'

            const metaLine = [
              formatDateShort(post.frontmatter.date),
              post.frontmatter.location ?? null,
            ]
              .filter(Boolean)
              .join(' · ')

            return (
              <Link
                key={post.slug}
                href={`/journal/${post.slug}`}
                className="group block"
              >
                {/* Thumbnail — 3:2 cover crop */}
                <div
                  className="relative w-full overflow-hidden"
                  style={{ aspectRatio: '3 / 2', background: gradient }}
                >
                  {heroPhoto?.thumbnail_url && (
                    <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                      <img
                        src={heroPhoto.thumbnail_url}
                        alt={post.frontmatter.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>

                {/* Card text */}
                <div className="mt-3">
                  <h2 className="font-display text-lg text-ink group-hover:text-[var(--accent)] transition-colors leading-snug">
                    {post.frontmatter.title}
                  </h2>
                  <p className="text-muted text-sm mt-1">{metaLine}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
