import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-dust/30 px-6 md:px-12 py-12">
      <div className="grid md:grid-cols-3 gap-10">
        <div>
          <p className="font-display text-xl mb-2">StudioTJ</p>
          <p className="text-muted text-sm leading-relaxed">
            Photography from the Netherlands.<br />
            KvK-nummer: [your KvK number]
          </p>
        </div>

        <div>
          <p className="text-xs tracking-widest uppercase text-muted mb-4">Navigate</p>
          <ul className="space-y-2">
            {[
              { href: '/portfolio', label: 'Portfolio' },
              { href: '/blog', label: 'Notes' },
              { href: '/shop', label: 'Shop' },
              { href: '/about', label: 'About' },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted hover:text-ink transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs tracking-widest uppercase text-muted mb-4">Find the work</p>
          <ul className="space-y-2">
            <li>
              <a href="https://www.alamy.com" target="_blank" rel="noopener noreferrer"
                className="text-sm text-muted hover:text-ink transition-colors">
                Alamy Stock Photos
              </a>
            </li>
            <li>
              <a href="#" className="text-sm text-muted hover:text-ink transition-colors">
                Instagram
              </a>
            </li>
            <li>
              <a href="#" className="text-sm text-muted hover:text-ink transition-colors">
                YouTube
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-dust/30 mt-10 pt-6 flex flex-col md:flex-row justify-between gap-4">
        <p className="text-xs text-dust">
          © {new Date().getFullYear()} StudioTJ — Eenmanszaak, Netherlands
        </p>
        <div className="flex gap-6">
          <Link href="/privacy" className="text-xs text-dust hover:text-muted transition-colors">Privacy</Link>
          <Link href="/terms" className="text-xs text-dust hover:text-muted transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  )
}
