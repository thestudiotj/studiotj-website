import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { mdxComponents } from '@/components/mdx'
import { getLearnTeaser, getAllLearnFamilies } from '@/lib/catalogue/learn-teasers'
import { getLearnPage } from '@/lib/catalogue/learn-pages'

export const dynamicParams = false

export function generateStaticParams() {
  return getAllLearnFamilies().map((family) => ({ family }))
}

export async function generateMetadata({
  params,
}: {
  params: { family: string }
}): Promise<Metadata> {
  const teaser = getLearnTeaser(params.family)
  if (!teaser) return {}
  const page = getLearnPage(params.family)
  if (!page) return {}
  const { title, description } = page.frontmatter
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
    },
  }
}

const proseClasses =
  'prose prose-lg prose-stone max-w-none ' +
  'prose-headings:font-display prose-headings:font-normal ' +
  'prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline'

export default function LearnPage({ params }: { params: { family: string } }) {
  const teaser = getLearnTeaser(params.family)
  if (!teaser) notFound()

  const page = getLearnPage(params.family)
  if (!page) notFound()

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      <div className="max-w-2xl">
        <Link
          href="/shop"
          className="text-sm text-muted tracking-widest uppercase hover:text-[var(--accent)] transition-colors"
        >
          ← Shop
        </Link>

        <article className={`${proseClasses} mt-10`}>
          <MDXRemote source={page.body} components={mdxComponents} />
        </article>
      </div>
    </div>
  )
}
