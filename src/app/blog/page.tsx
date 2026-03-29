import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { format } from 'date-fns'

export const metadata = {
  title: 'Blog',
  description: 'Photography notes, project updates, and creative writing from StudioTJ',
}

export default async function BlogPage() {
  const posts = await getAllPosts()

  return (
    <div className="pt-24 px-6 md:px-12 pb-20 max-w-4xl">
      <h1 className="section-title mb-4">Notes</h1>
      <p className="text-muted mb-16 text-lg">
        Field notes, project stories, gear thoughts, and occasional rambling.
      </p>

      {posts.length === 0 ? (
        <div className="border border-dust/40 p-12 text-center">
          <p className="text-muted">No posts yet.</p>
          <p className="text-sm text-dust mt-2">
            Add <code className="bg-dust/30 px-1">*.mdx</code> files to{' '}
            <code className="bg-dust/30 px-1">/content/blog/</code> to get started.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-dust/30">
          {posts.map((post) => (
            <article key={post.slug} className="py-10 group">
              <Link href={`/blog/${post.slug}`}>
                <div className="flex flex-col md:flex-row md:items-start md:gap-12">
                  <time className="text-sm text-muted tracking-widest font-mono shrink-0 md:w-32 mb-2 md:mb-0">
                    {format(new Date(post.date), 'dd MMM yyyy')}
                  </time>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl text-ink group-hover:text-accent transition-colors mb-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-muted leading-relaxed mb-3">{post.excerpt}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {post.tags?.map((tag: string) => (
                        <span key={tag} className="text-xs text-dust tracking-widest uppercase">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
