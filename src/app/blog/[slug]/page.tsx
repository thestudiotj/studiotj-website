import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      <div className="max-w-2xl">
        <Link href="/blog" className="text-sm text-muted tracking-widest uppercase hover:text-ink transition-colors">
          ← Notes
        </Link>

        <header className="mt-10 mb-12">
          <time className="text-sm text-muted tracking-widest font-mono">
            {format(new Date(post.date), 'dd MMMM yyyy')}
          </time>
          <h1 className="font-display text-4xl md:text-5xl text-ink mt-3 mb-4 leading-tight">
            {post.title}
          </h1>
          {post.tags && (
            <div className="flex gap-3">
              {post.tags.map((tag: string) => (
                <span key={tag} className="text-xs text-dust tracking-widest uppercase">#{tag}</span>
              ))}
            </div>
          )}
        </header>

        <article className="prose prose-lg prose-stone max-w-none
          prose-headings:font-display prose-headings:font-normal
          prose-a:text-accent prose-a:no-underline hover:prose-a:underline">
          <MDXRemote source={post.content} />
        </article>
      </div>
    </div>
  )
}
