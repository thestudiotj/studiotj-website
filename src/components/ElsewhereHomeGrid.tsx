'use client'

import { useState, useEffect, useRef } from 'react'
import justifiedLayout from 'justified-layout'
import type { ElsewhereItem } from '@/lib/elsewhere'
import ElsewhereCard, { METADATA_HEIGHT } from './ElsewhereCard'

interface ElsewhereHomeGridProps {
  items: ElsewhereItem[]
}

export default function ElsewhereHomeGrid({ items }: ElsewhereHomeGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setContainerWidth(el.clientWidth)
    update()
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const targetRowHeight = containerWidth < 640 ? 160 : 200
  const GAP = 8

  const aspectRatios = items.map((item) => (item.aspect_ratio > 0 ? item.aspect_ratio : 1.0))

  const layout = justifiedLayout(aspectRatios, {
    containerWidth,
    targetRowHeight,
    boxSpacing: { horizontal: GAP, vertical: GAP + METADATA_HEIGHT },
    containerPadding: 0,
    showWidows: true,
  })

  const totalHeight = layout.containerHeight + METADATA_HEIGHT

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: totalHeight }}
    >
      {layout.boxes.map((box, i) => (
        <div
          key={items[i].cluster_id}
          className="absolute"
          style={{ top: box.top, left: box.left, width: box.width }}
        >
          <ElsewhereCard item={items[i]} index={i} imageHeight={box.height} />
        </div>
      ))}
    </div>
  )
}
