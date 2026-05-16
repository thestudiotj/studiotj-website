import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllLearnFamilies, getLearnTeaser } from '@/lib/catalogue/learn-teasers'

export const metadata: Metadata = {
  title: 'How buying a print works',
  description:
    'A reading list for the StudioTJ shop — one page per paper, canvas, frame, and card format the studio prints on.',
}

export default function LearnIndexPage() {
  const families = getAllLearnFamilies()
    .map((family) => getLearnTeaser(family))
    .filter((t): t is NonNullable<typeof t> => t !== null)

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      <div className="max-w-2xl">
        <Link
          href="/shop"
          className="text-sm text-muted tracking-widest uppercase hover:text-[var(--accent)] transition-colors"
        >
          ← Shop
        </Link>

        <h1 className="font-display text-5xl md:text-7xl text-ink leading-none mt-10 mb-6">
          How buying a print works
        </h1>
        <p className="text-muted leading-relaxed mb-3">
          Each StudioTJ print is made to order. Payments are handled by Stripe; prints are produced and shipped by Prodigi.
        </p>
        <p className="text-sm text-muted/80 leading-relaxed">
          Pick a format below to read what it is and how it is printed.
        </p>

        <ul className="mt-12 border-t border-dust/30">
          {families.map((fam) => (
            <li key={fam.family} className="border-b border-dust/30">
              <Link
                href={`/shop/learn/${fam.family}`}
                className="flex items-center justify-between gap-6 py-5 group"
              >
                <span className="text-lg text-ink group-hover:text-[var(--accent)] transition-colors">
                  {fam.displayName}
                </span>
                <span className="text-xs tracking-widest uppercase text-muted group-hover:text-ink transition-colors">
                  Read →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
