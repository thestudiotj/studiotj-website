'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useCart } from '@/lib/cart'

const links = [
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/videos', label: 'Film' },
  { href: '/blog', label: 'Notes' },
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
]

export default function Nav() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { itemCount, openDrawer } = useCart()
  const isHome = pathname === '/'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navBg = isHome
    ? scrolled ? 'bg-paper/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
    : 'bg-paper border-b border-dust/30'

  const logoColor = isHome && !scrolled ? 'text-paper' : 'text-ink'
  const linkColor = isHome && !scrolled ? 'text-paper/70 hover:text-paper' : 'text-muted hover:text-ink'

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <nav className="flex items-center justify-between px-6 md:px-12 h-16">
        <Link href="/" className={`font-display text-xl tracking-tight transition-colors ${logoColor}`}>
          StudioTJ
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-xs tracking-[0.2em] uppercase transition-colors duration-200 ${
                  pathname.startsWith(link.href)
                    ? isHome && !scrolled ? 'text-paper' : 'text-ink'
                    : linkColor
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Cart icon */}
        <button
          onClick={openDrawer}
          className={`relative p-2 transition-colors ${logoColor}`}
          aria-label="Open cart"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {itemCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-ink text-paper text-[10px] flex items-center justify-center leading-none">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </button>

        {/* Mobile hamburger */}
        <button
          className={`md:hidden flex flex-col gap-1.5 p-2 ${logoColor}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-px bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-px bg-current transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-px bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-paper border-t border-dust/30 px-6 py-6">
          <ul className="flex flex-col gap-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm tracking-widest uppercase text-muted hover:text-ink transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
