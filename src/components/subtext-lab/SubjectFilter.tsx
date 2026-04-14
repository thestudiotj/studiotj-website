'use client'

import Link from 'next/link'

interface SubjectFilterProps {
  subjects: string[]
  activeSubject: string | null
}

export default function SubjectFilter({ subjects, activeSubject }: SubjectFilterProps) {
  const pillItems = [
    { label: 'All', href: '/subtext-lab', active: activeSubject === null },
    ...subjects.map((s) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      href: `/subtext-lab?subject=${encodeURIComponent(s)}`,
      active: activeSubject === s,
    })),
  ]

  return (
    <div className="mb-10 flex flex-wrap items-center gap-y-2 text-sm tracking-widest uppercase">
      {pillItems.map((item, i) => (
        <span key={item.label} className="flex items-center">
          {i > 0 && (
            <span className="mx-3 text-muted select-none" aria-hidden="true">
              ·
            </span>
          )}
          <Link
            href={item.href}
            className={
              item.active
                ? 'text-[var(--accent)]'
                : 'text-muted hover:text-[var(--accent)] transition-colors'
            }
          >
            {item.label}
          </Link>
        </span>
      ))}
    </div>
  )
}
