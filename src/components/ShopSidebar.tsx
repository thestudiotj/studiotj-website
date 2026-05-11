'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { COLLECTION_CONFIG } from '@/lib/catalogue/collections'
import { FAMILY_CONFIG } from '@/lib/catalogue/families'

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-6">
      <Link
        href="/shop"
        className="block text-xs tracking-[0.3em] uppercase font-semibold text-ink hover:text-muted transition-colors"
      >
        Shop
      </Link>

      <div>
        <p className="text-xs tracking-widest uppercase text-dust mb-2">Collections</p>
        <ul className="space-y-0.5">
          {COLLECTION_CONFIG.map((col) => {
            const href = `/shop/${col.slug}`
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <li key={col.slug}>
                <Link
                  href={href}
                  className={`block py-1.5 text-sm transition-colors ${
                    active ? 'text-ink font-medium' : 'text-muted hover:text-ink'
                  }`}
                >
                  {col.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <p className="text-xs tracking-widest uppercase text-dust mb-2">Products</p>
        <ul className="space-y-0.5">
          {FAMILY_CONFIG.map((fam) => {
            const href = `/shop/${fam.slug}`
            const active = pathname === href
            return (
              <li key={fam.slug}>
                <Link
                  href={href}
                  className={`block py-1.5 text-sm transition-colors ${
                    active ? 'text-ink font-medium' : 'text-muted hover:text-ink'
                  }`}
                >
                  {fam.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

export default function ShopSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-52 shrink-0 sticky top-24 self-start pr-6">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile toggle */}
      <div className="md:hidden mb-6 pb-4 border-b border-dust/30">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted hover:text-ink transition-colors"
          aria-expanded={mobileOpen}
        >
          Browse
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="currentColor"
            className={`transition-transform duration-200 ${mobileOpen ? 'rotate-180' : ''}`}
          >
            <path d="M0 0l5 6 5-6z" />
          </svg>
        </button>
        {mobileOpen && (
          <div className="mt-5">
            <SidebarContent pathname={pathname} />
          </div>
        )}
      </div>
    </>
  )
}
