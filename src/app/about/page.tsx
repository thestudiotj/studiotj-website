import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About',
  description:
    'StudioTJ is a Dutch photography practice — bold colour architecture and monochrome with weight, alongside essays from The Subtext Lab. Curated, on purpose.',
}

export default function AboutPage() {
  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      <div className="max-w-2xl">
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-12">About</h1>

        {/* Section 1 — The studio */}
        <section className="mb-16">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            The studio
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            StudioTJ is a Dutch photography practice. Colour photography of architecture is the
            main lane — bold geometry, urban form, the lines buildings hold. Monochrome is the
            other lane, and the one I started in. It&apos;s stayed because monochrome carries
            texture, weight, and contrast on its own terms.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            StudioTJ shares the site with{' '}
            <Link href="/subtext-lab" className="text-accent hover:underline">
              The Subtext Lab
            </Link>{' '}
            — essays and video about games, film, TV, music, and the way digital society is
            shaping all of them. The lens is analytical and Dutch. The Dutch part stays even when
            the writing is in English.
          </p>
          <p className="text-muted leading-relaxed mb-8">
            The site is curated. Everything here has been chosen, edited, and shipped on purpose.
            The rest waits its turn or stays in the archive.
          </p>
          <div className="w-48 h-48 relative overflow-hidden rounded-full">
            <Image
              src="/images/TjeerdvanderHeeft.webp"
              alt="Tjeerd van der Heeft"
              fill
              className="object-cover object-top"
              sizes="192px"
            />
          </div>
        </section>

        {/* Section 2 — The work */}
        <section className="mb-16">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            The work
          </h2>
          <p className="text-muted leading-relaxed mb-6">
            The portfolio sits in four collections.
          </p>
          <div className="space-y-4 mb-8">
            <p className="text-muted leading-relaxed">
              <Link
                href="/portfolio/the-signature-collection"
                className="font-medium text-ink hover:text-accent transition-colors"
              >
                The Signature Collection
              </Link>{' '}
              is bold architecture in colour. Old buildings, new buildings, and the lines that
              hold them together. Punchy, accurate, made to print well.
            </p>
            <p className="text-muted leading-relaxed">
              <Link
                href="/portfolio/monochrome-moods"
                className="font-medium text-ink hover:text-accent transition-colors"
              >
                Monochrome Moods
              </Link>{' '}
              is just cool. Black and white photography that earns its medium — texture, contrast,
              weight, and the kind of light that only reads in greyscale.
            </p>
            <p className="text-muted leading-relaxed">
              <Link
                href="/portfolio/the-atmospheric-collection"
                className="font-medium text-ink hover:text-accent transition-colors"
              >
                The Atmospheric Collection
              </Link>{' '}
              is sense of place. Urban or natural, ambient or dramatic, anywhere the weather, the
              light, or the quiet of a scene becomes the actual subject.
            </p>
            <p className="text-muted leading-relaxed">
              <Link
                href="/portfolio/the-halcyon-collection"
                className="font-medium text-ink hover:text-accent transition-colors"
              >
                The Halcyon Collection
              </Link>{' '}
              makes you feel warm. A pink-and-peach grade with lavender shadows, applied
              whole-image to photographs where warmth makes the photograph better. Golden hour
              expanded into a palette.
            </p>
          </div>
          <p className="text-muted leading-relaxed mb-4">Beyond the four collections:</p>
          <ul className="space-y-2">
            <li className="text-muted leading-relaxed">
              <Link
                href="/series"
                className="font-medium text-ink hover:text-accent transition-colors"
              >
                /series
              </Link>{' '}
              — ongoing sequences of photographs, organized by subject, weather, and season.
            </li>
            <li className="text-muted leading-relaxed">
              <Link
                href="/shop"
                className="font-medium text-ink hover:text-accent transition-colors"
              >
                /shop
              </Link>{' '}
              — apparel and prints, fulfilled by print-on-demand partners.
            </li>
            <li className="text-muted leading-relaxed">
              <Link
                href="/gear"
                className="font-medium text-ink hover:text-accent transition-colors"
              >
                /gear
              </Link>{' '}
              — what I shoot and edit with, honest takes, recommendations on merit.
            </li>
            <li className="text-muted leading-relaxed">
              <Link
                href="/subtext-lab"
                className="font-medium text-ink hover:text-accent transition-colors"
              >
                /subtext-lab
              </Link>{' '}
              — essays and video, by the same person.
            </li>
          </ul>
        </section>

        {/* Section 3 — Get in touch */}
        <section>
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Get in touch
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            For commissions, licensing, or anything else,{' '}
            <Link href="/contact" className="text-accent hover:underline">
              /contact
            </Link>{' '}
            has the details — single inbox, plain email, no form to fill out.
          </p>
          <p className="text-muted leading-relaxed">
            For more casual visual updates, my personal Instagram is{' '}
            <a
              href="https://www.instagram.com/tjvanderheeft"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              @tjvanderheeft
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
