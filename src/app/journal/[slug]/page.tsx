import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPostBySlug } from '@/lib/content'
import { getJournalPhoto, getJournalPhotos } from '@/lib/journal'
import { mdxComponents } from '@/components/mdx'
import JournalGallery from '@/components/JournalGallery'

interface PageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  const posts = await getAllPosts('journal')
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPostBySlug('journal', params.slug)
  if (!post) return {}

  const heroUrl = getJournalPhoto(post.frontmatter.hero_photo_id)?.hero_url ?? null
  if (!heroUrl && process.env.NODE_ENV === 'development') {
    console.warn(`[journal/${params.slug}] hero_photo_id not found in journal.json: ${post.frontmatter.hero_photo_id}`)
  }

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.summary,
    ...(heroUrl ? { openGraph: { images: [heroUrl] } } : {}),
  }
}

function formatDateLong(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

const proseClasses =
  'prose prose-lg prose-stone max-w-none ' +
  'prose-headings:font-display prose-headings:font-normal ' +
  'prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline'

export default async function JournalEntryPage({ params }: PageProps) {
  const post = await getPostBySlug('journal', params.slug)
  if (!post) notFound()

  const { frontmatter, body } = post

  const heroPhoto = getJournalPhoto(frontmatter.hero_photo_id)
  const heroUrl = heroPhoto?.hero_url ?? null

  const gridPhotos = getJournalPhotos(frontmatter.photo_ids)

  // Metadata strip segments
  const metaSegments: string[] = [
    formatDateLong(frontmatter.date),
    ...(frontmatter.location ? [frontmatter.location] : []),
    ...(frontmatter.shoot_date && frontmatter.shoot_date !== frontmatter.date
      ? [formatDateLong(frontmatter.shoot_date)]
      : []),
  ]

  return (
    <div className="pt-24 pb-20">
      {/* Back link */}
      <div className="px-6 md:px-12 mb-8">
        <Link
          href="/journal"
          className="text-sm text-muted tracking-widest uppercase hover:text-[var(--accent)] transition-colors"
        >
          ← Journal
        </Link>
      </div>

      {/* Hero photo — full-bleed within page padding, contain aspect */}
      {heroUrl && (
        <div className="px-6 md:px-12 mb-8">
          <div
            className="w-full flex justify-center bg-paper"
            style={{ maxHeight: '75vh' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroUrl}
              alt={frontmatter.title}
              style={{ maxHeight: '75vh', width: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {/* Title + metadata — centered */}
      <div className="px-6 md:px-12 text-center mb-10">
        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-4">
          {frontmatter.title}
        </h1>
        <p className="text-sm tracking-widest uppercase text-muted">
          {metaSegments.join(' · ')}
        </p>
      </div>

      {/* Optional MDX body — constrained prose column */}
      {body.trim() && (
        <div className="px-6 md:px-12 mb-12">
          <div className="max-w-2xl mx-auto">
            <article className={proseClasses}>
              <MDXRemote source={body} components={mdxComponents} />
            </article>
          </div>
        </div>
      )}

      {/* Photo grid — masonry, full width within page padding */}
      {gridPhotos.length > 0 && (
        <div className="px-6 md:px-12">
          <JournalGallery photos={gridPhotos} entryTitle={frontmatter.title} />
        </div>
      )}
    </div>
  )
}
