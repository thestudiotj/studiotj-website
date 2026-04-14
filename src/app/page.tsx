import Link from 'next/link'
import { getPortfolio, getPhoto, sortCollections } from '@/lib/portfolio'
import { getAllPosts } from '@/lib/blog'
import EmailCapture from '@/components/EmailCapture'
import HeroImage from '@/components/HeroImage'
import CollectionCard from '@/components/CollectionCard'

export default async function HomePage() {
  const portfolio = getPortfolio()
  const featuredCollections = portfolio
    ? sortCollections(portfolio.collections, portfolio.photos).slice(0, 4)
    : []
  const posts = await getAllPosts()

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-end pb-16 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0">
          <HeroImage />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-black/10 to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl animate-fade-up">
          <p className="text-dust text-sm tracking-[0.3em] uppercase mb-4">StudioTJ</p>
          <h1 className="font-display text-5xl md:text-7xl text-paper leading-tight mb-6">
            Architecture, atmosphere, monochrome.
          </h1>
          <p className="text-dust text-lg mb-8 max-w-md leading-relaxed">
            A studio built around photography, and everything it kept pulling in.
          </p>
          <div className="flex gap-4">
            <Link href="/portfolio" className="btn-primary">View Portfolio</Link>
            <Link href="/shop" className="btn-outline border-paper text-paper hover:bg-paper hover:text-ink">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Collections */}
      {featuredCollections.length > 0 && (
        <section className="px-6 md:px-12 py-20">
          <div className="flex items-end justify-between mb-12">
            <h2 className="section-title">Collections</h2>
            <Link href="/portfolio" className="nav-link">View all →</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredCollections.map((collection, i) => {
              const heroPhoto = collection.hero_photo_id
                ? getPhoto(collection.hero_photo_id)
                : null
              return (
                <CollectionCard
                  key={collection.slug}
                  collection={collection}
                  heroPhoto={heroPhoto}
                  index={i}
                  variant="homepage"
                />
              )
            })}
          </div>
        </section>
      )}

      {/* About strip */}
      <section className="border-t border-dust/40 px-6 md:px-12 py-20">
        <div className="max-w-2xl">
          <h2 className="section-title mb-6">The work</h2>
          <p className="text-muted leading-relaxed mb-4">
            StudioTJ is a one-person studio working across photography, print, and writing. The photographs come first; the shop, the journal, and The Subtext Lab are what grew around them.
          </p>
          <p className="text-muted leading-relaxed mb-8">
            Run by T.J. van der Heeft. Prints and products live in the <Link href="/shop">shop</Link>.
          </p>
          <Link href="/about" className="btn-outline">About the studio</Link>
        </div>
      </section>

      {/* Latest from the blog — only rendered when posts exist */}
      {posts.length > 0 && (
        <section className="bg-ink text-paper px-6 md:px-12 py-20">
          <div className="flex items-end justify-between mb-12">
            <h2 className="font-display text-4xl md:text-6xl">Latest</h2>
            <Link href="/blog" className="text-dust text-sm tracking-widest uppercase hover:text-paper transition-colors">
              All posts →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {posts.slice(0, 3).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <p className="text-dust text-xs tracking-widest uppercase mb-2">{post.date}</p>
                <h3 className="font-display text-xl text-paper group-hover:text-dust transition-colors leading-snug">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-dust/70 text-sm mt-2 leading-relaxed line-clamp-2">{post.excerpt}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Email capture */}
      <EmailCapture
        variant="light"
        headline="Subscribe"
        subline="The list is open; the newsletter is not. Sign up now and you'll be on it when the first one sends."
        incentive="Photos, collections, notes — nothing often, nothing else."
      />
    </>
  )
}
