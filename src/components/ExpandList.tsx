'use client'

import { useState, Children } from 'react'

interface ExpandListProps {
  children: React.ReactNode
  max?: number
  gridClassName?: string
}

/**
 * Shows the first `max` children by default. A muted text button reveals
 * the rest in-place — no pagination, no navigation. Client component.
 */
export default function ExpandList({
  children,
  max = 5,
  gridClassName = '',
}: ExpandListProps) {
  const [expanded, setExpanded] = useState(false)
  const all = Children.toArray(children)
  const visible = expanded ? all : all.slice(0, max)
  const hidden = all.length - max

  return (
    <div>
      <div className={gridClassName}>{visible}</div>
      {!expanded && hidden > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setExpanded(true)}
            className="text-sm text-muted tracking-widest uppercase hover:text-ink transition-colors"
          >
            Show all {all.length}
          </button>
        </div>
      )}
    </div>
  )
}
