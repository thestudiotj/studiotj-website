import Link from 'next/link'

// Social icon SVGs — monochrome, currentColor, no brand colours

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconPinterest() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.64 1.267 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.136-1.867 3.136-4.562 0-2.387-1.715-4.057-4.163-4.057-2.836 0-4.5 2.127-4.5 4.326 0 .856.33 1.775.741 2.276a.3.3 0 0 1 .069.285c-.075.314-.243.995-.276 1.134-.044.183-.146.222-.337.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
    </svg>
  )
}

function IconYouTube() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  )
}

function IconTikTok() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}

function IconAlamy() {
  // Simple camera/lens icon as Alamy has no standard SVG glyph
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

const socialLinks = [
  {
    href: 'https://www.instagram.com/thestudiotj/',
    label: 'Instagram',
    icon: <IconInstagram />,
  },
  {
    href: 'https://nl.pinterest.com/thestudiotj/',
    label: 'Pinterest',
    icon: <IconPinterest />,
  },
  {
    href: 'https://www.youtube.com/@thestudiotj',
    label: 'YouTube',
    icon: <IconYouTube />,
  },
  {
    href: 'https://www.tiktok.com/@thestudiotj',
    label: 'TikTok',
    icon: <IconTikTok />,
  },
  {
    href: 'https://www.alamy.com/stock-photo/?cid=YCLQJL4TSRM49GEASAHTCF2U7BCHX6RQ43SXPL74Y2PP5R9MJ8N3GDQMDHSFCRS6&sortBy=relevant',
    label: 'Alamy',
    icon: <IconAlamy />,
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-dust/30 px-6 md:px-12 py-10">
      {/* Top row: text links */}
      <div className="flex flex-wrap items-center gap-y-2 text-sm tracking-widest uppercase mb-6">
        {[
          { href: '/gear', label: 'Gear' },
          { href: '/vondsten', label: 'Vondsten' },
          { href: '/contact', label: 'Contact' },
          { href: '/privacy', label: 'Privacy' },
          { href: '/terms', label: 'Terms' },
        ].map((link, i) => (
          <span key={link.href} className="flex items-center">
            {i > 0 && (
              <span className="mx-3 text-muted select-none" aria-hidden="true">·</span>
            )}
            <Link href={link.href} className="text-muted hover:text-ink transition-colors">
              {link.label}
            </Link>
          </span>
        ))}
      </div>

      {/* Social row: icon links */}
      <div className="flex items-center gap-5 mb-8">
        {socialLinks.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="text-muted hover:text-ink transition-colors"
          >
            {social.icon}
          </a>
        ))}
      </div>

      {/* Bottom row: business details + copyright */}
      <div className="border-t border-dust/30 pt-6">
        <p className="text-xs text-muted leading-relaxed mb-3">
          KvK 75602172 · BTW NL002283139B11 · Postbus: Keurenplein 41 Box D2818, 1069CD Amsterdam
        </p>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} StudioTJ
        </p>
      </div>
    </footer>
  )
}
