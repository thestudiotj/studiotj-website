'use client'

import { useRef, useEffect, useCallback } from 'react'
import type PhotoSwipeLightbox from 'photoswipe/lightbox'
import type { Photo } from '@/lib/portfolio'
import JustifiedGallery from './JustifiedGallery'

interface GalleryProps {
  photos: Photo[]
}

/**
 * Derive pixel dimensions for PhotoSwipe from the stored aspect_ratio.
 * Photos only carry aspect_ratio, not explicit width/height.
 * Using 1600px on the long edge matches the "hero" WebP upload target.
 */
function getDimensions(photo: Photo): { width: number; height: number } {
  const BASE = 1600
  return photo.aspect_ratio >= 1
    ? { width: BASE, height: Math.round(BASE / photo.aspect_ratio) }
    : { width: Math.round(BASE * photo.aspect_ratio), height: BASE }
}

/**
 * Collection gallery — justified grid + PhotoSwipe lightbox.
 *
 * Lazy-loading strategy:
 *   • JustifiedGallery renders immediately (SSR + initial JS bundle).
 *   • `photoswipe/lightbox` (~10 KB) is preloaded in the background after
 *     mount — it's small and dramatically reduces first-click latency.
 *   • `photoswipe` core (~50 KB) is loaded via `pswpModule` only when the
 *     lightbox first opens, not before.
 *
 * JustifiedGallery remains free of any PhotoSwipe-specific code.
 * Rotation is applied upstream (server component) before photos arrive here.
 */
export default function Gallery({ photos }: GalleryProps) {
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null)
  // Ref so the openAt callback always sees the latest photos without needing
  // to re-create itself (which would re-attach event handlers unnecessarily).
  const photosRef = useRef(photos)
  useEffect(() => { photosRef.current = photos }, [photos])

  useEffect(() => {
    // Preload the lightbox shell in the background so it is ready before
    // the user's first click. The core (pswpModule) is still lazy.
    import('photoswipe/lightbox')

    return () => {
      lightboxRef.current?.destroy()
      lightboxRef.current = null
    }
  }, [])

  const openAt = useCallback(async (index: number) => {
    // Initialise once on first interaction
    if (!lightboxRef.current) {
      const { default: PhotoSwipeLightbox } = await import('photoswipe/lightbox')

      const dataSource = photosRef.current.map((photo) => {
        const { width, height } = getDimensions(photo)
        return {
          src: photo.url,
          msrc: photo.thumbnail_url, // low-res shown while full image loads
          width,
          height,
          alt: photo.title,
          // Custom field for caption — accessed with a type assertion below
          photoDate: photo.date,
        }
      })

      const lightbox = new PhotoSwipeLightbox({
        dataSource,
        // Core is loaded lazily on first open — not in the initial bundle
        pswpModule: () => import('photoswipe'),

        // Visual options
        bgOpacity: 0.95,
        showHideAnimationType: 'zoom',
        loop: false,
        wheelToZoom: true,
        spacing: 0.12,
        paddingFn: (viewportSize) => ({
          top: 30,
          bottom: viewportSize.x < 768 ? 80 : 44, // more space for caption on mobile
          left: 0,
          right: 0,
        }),
      })

      // Register a custom caption element that shows title + date
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
                ? `<p class="pswp-caption__title">${title}</p>${
                    dateStr
                      ? `<p class="pswp-caption__date">${dateStr}</p>`
                      : ''
                  }`
                : ''
            })
          },
        })
      })

      lightbox.init()
      lightboxRef.current = lightbox
    }

    lightboxRef.current.loadAndOpen(index)
  }, []) // stable — uses photosRef, no deps needed

  if (photos.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">No photos in this collection yet.</p>
      </div>
    )
  }

  return <JustifiedGallery photos={photos} onPhotoClick={openAt} />
}
