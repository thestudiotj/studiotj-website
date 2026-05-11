import Link from 'next/link'

export interface BreadcrumbSegment {
  label: string
  href?: string
}

export default function Breadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-xs tracking-widest uppercase text-muted">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-dust/50">/</span>}
          {seg.href ? (
            <Link href={seg.href} className="hover:text-ink transition-colors">
              {seg.label}
            </Link>
          ) : (
            <span className="text-ink">{seg.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
