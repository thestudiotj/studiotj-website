'use client'

import Link from 'next/link'

export default function CategoryTabs({
  categories,
  active,
}: {
  categories: string[]
  active: string
}) {
  const all = ['All', ...categories]
  return (
    <div className="flex flex-wrap gap-2 mb-10">
      {all.map((cat) => {
        const href = cat === 'All' ? '/shop' : `/shop?category=${encodeURIComponent(cat)}`
        const isActive = cat === 'All' ? active === 'all' : active === cat
        return (
          <Link
            key={cat}
            href={href}
            className={`px-4 py-2 text-xs tracking-wider uppercase border transition-colors ${
              isActive
                ? 'bg-ink text-paper border-ink'
                : 'border-dust text-muted hover:border-ink hover:text-ink'
            }`}
          >
            {cat}
          </Link>
        )
      })}
    </div>
  )
}
