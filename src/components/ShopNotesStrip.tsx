import Link from 'next/link'
import type { ShopNote } from '@/lib/catalogue/shop-notes'

interface ShopNotesStripProps {
  notes: readonly ShopNote[]
}

export default function ShopNotesStrip({ notes }: ShopNotesStripProps) {
  return (
    <section className="mb-16 pt-10 border-t border-dust/30">
      <h2 className="text-xs tracking-widest uppercase text-dust mb-8">Studio notes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 max-w-4xl">
        {notes.map((note, i) =>
          note.href ? (
            <Link
              key={i}
              href={note.href}
              className="block text-lg leading-relaxed text-ink/85 hover:text-ink transition-colors"
            >
              {note.quote}
            </Link>
          ) : (
            <p key={i} className="text-lg leading-relaxed text-ink/85">
              {note.quote}
            </p>
          ),
        )}
      </div>
    </section>
  )
}
