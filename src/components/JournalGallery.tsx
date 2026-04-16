'use client'

import { useRef, useEffect, useCallback } from 'react'
import Masonry from 'react-masonry-css'
import type PhotoSwipeLightbox from 'photoswipe/lightbox'
import type { JournalPhoto } from '@/lib/journal'

interface JournalGalleryProps {
  photos: JournalPhoto[]
  entryTitle: string
}

function getDimensions(photo: JournalPhoto): { width: number; height: number } {
  const BASE = 1600
  return photo.aspect_ratio >= 1
    ? { width: BASE, height: Math.round(BASE / photo.aspect_ratio) }
    : { width: Math.round(BASE * photo.aspect_ratio), height: BASE }
}

const BREAKPOINTS = { default: 3, 1024: 2, 640: 1 }

export default function JournalGallery({ photos, entryTitle }: JournalGalleryProps) {
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null)
  const photosRef = useRef(photos)
  useEffect(() => { photosRef.current = photos }, [photos])

  useEffect(() => {
    import('photoswipe/lightbox')
    return () => {
      lightboxRef.current?.destroy()
      lightboxRef.current = null
    }
  }, [])

  const openAt = useCallback(async (index: number) => {
    if (!lightboxRef.current) {
      const { default: PhotoSwipeLightbox } = await import('photoswipe/lightbox')

      const dataSource = photosRef.current.map((photo) => {
        const { width, height } = getDimensions(photo)
        return {
          src: photo.url,
          msrc: photo.thumbnail_url,
          width,
          height,
          alt: photo.title,
          photoDate: photo.date,
        }
      })

      const lightbox = new PhotoSwipeLightbox({
        dataSource,
        pswpModule: () => import('photoswipe'),
        bgOpacity: 0.95,
        showHideAnimationType: 'zoom',
        loop: false,
        wheelToZoom: true,
        spacing: 0.12,
        padding: { top: 30, bottom: 80, left: 60, right: 60 },
      })

      lightbox.on('uiRegister', () => {
        lightbox.pswp!.ui!.registerElement({
          name: 'custom-caption',
          order: 9,
          isButton: false,
          appendTo: 'root',
          onInit: (el: HTMLElement) => {
            lightbox.pswp!.on('change', () => {
              const data = lightbox.pswp!.currSlide?.data as any
              const title: string = data?.alt ?? ''
              const rawDate: string | undefined = data?.photoDate
              const dateStr = rawDate
                ? new Date(rawDate).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                  })
                : ''
              el.innerHTML = title
                ? `<p class="pswp-caption__title">${title}</p>${dateStr ? `<p class="pswp-caption__date">${dateStr}</p>` : ''}`
                : ''
            })
          },
        })
      })

      lightbox.init()
      lightboxRef.current = lightbox
    }

    lightboxRef.current.loadAndOpen(index)
  }, [])

  if (photos.length === 0) return null

  return (
    <Masonry
      breakpointCols={BREAKPOINTS}
      className="journal-masonry"
      columnClassName="journal-masonry-col"
    >
      {photos.map((photo, i) => {
        const gradient =
          photo.dominant_colors.length >= 2
            ? `linear-gradient(145deg, ${photo.dominant_colors[0]}, ${photo.dominant_colors[1]}${photo.dominant_colors[2] ? `, ${photo.dominant_colors[2]}` : ''})`
            : 'linear-gradient(145deg, #2a2a2a, #6a6a6a)'

        return (
          <div
            key={photo.id}
            className="relative overflow-hidden cursor-pointer group"
            style={{ aspectRatio: photo.aspect_ratio, background: gradient }}
            onClick={() => openAt(i)}
            role="button"
            tabIndex={0}
            aria-label={`View ${photo.title}`}
            onKeyDown={(e) => e.key === 'Enter' && openAt(i)}
          >
            <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
              <img
                src={photo.thumbnail_url}
                alt={photo.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-3">
              <p className="font-display text-white/0 group-hover:text-white/90 text-sm leading-tight transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                {photo.title}
              </p>
            </div>
          </div>
        )
      })}
    </Masonry>
  )
}
