import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Reach StudioTJ for photography commissions, image licensing, or general enquiries. Direct email, no form. Based in the Netherlands.',
}

export default function ContactPage() {
  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      <div className="max-w-2xl">
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-12">
          Get in touch
        </h1>

        <p className="text-muted leading-relaxed mb-8">
          One inbox for everything:{' '}
          <a
            href="mailto:thestudiotj@gmail.com"
            className="font-display text-xl text-ink hover:text-accent transition-colors"
          >
            thestudiotj@gmail.com
          </a>
        </p>

        <p className="text-muted leading-relaxed mb-4">
          To help me get to the right reply faster, put one of these in your subject line:
        </p>

        <ul className="space-y-3 mb-8">
          <li className="text-muted leading-relaxed">
            <span className="font-medium text-ink">Commission</span> — for assignment work,
            custom shoots, or anything where you&apos;d like a photo made
          </li>
          <li className="text-muted leading-relaxed">
            <span className="font-medium text-ink">Licensing</span> — for use of an existing
            photograph in editorial, commercial, or print contexts
          </li>
          <li className="text-muted leading-relaxed">
            <span className="font-medium text-ink">General</span> — anything else, including
            questions about the prints, the site, or the writing
          </li>
        </ul>

        <p className="text-muted leading-relaxed mb-4">
          Email only. No form, no portal — direct email is the whole interface.
        </p>

        <p className="text-muted leading-relaxed mb-12">
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

        {/* Business details */}
        <div className="border-t border-dust/30 pt-8">
          <p className="text-xs text-dust leading-relaxed">
            StudioTJ — eenmanszaak, the Netherlands
            <br />
            KvK: 75602172
            <br />
            BTW: NL002283139B11
            <br />
            Post: Keurenplein 41, Box D2818, 1069CD Amsterdam
          </p>
        </div>
      </div>
    </div>
  )
}
