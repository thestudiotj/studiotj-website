'use client'

import { useRef, useEffect, useCallback } from 'react'
import type PhotoSwipeLightbox from 'photoswipe/lightbox'
import type { Photo } from '@/lib/portfolio'
import JustifiedGallery from './JustifiedGallery'

interface GalleryProps {
  photos: Photo[]
  /** When provided, enables hash-based URL state (#&gid=1&pid=photo-id). */
  galleryId?: string
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

function buildDataSource(photos: Photo[]) {
  return photos.map((photo) => {
    const { width, height } = getDimensions(photo)
    return {
      src: photo.url,
      msrc: photo.thumbnail_url,
      width,
      height,
      alt: photo.title,
      photoDate: photo.date,
      uid: photo.id,
    }
  })
}

type PSL = PhotoSwipeLightbox

function attachCaption(lightbox: PSL) {
  lightbox.on('uiRegister', () => {
    lightbox.pswp!.ui!.registerElement({
      name: 'custom-caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      onInit: (el: HTMLElement) => {
        lightbox.pswp!.on('change', () => {
          const data = lightbox.pswp!.currSlide?.data as Record<string, unknown>
          const title = (data?.alt as string) ?? ''
          const rawDate = data?.photoDate as string | undefined
          const dateStr = rawDate
            ? new Date(rawDate).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
              })
            : ''
          el.innerHTML = title
            ? `<p class="pswp-caption__title">${title}</p>${
                dateStr ? `<p class="pswp-caption__date">${dateStr}</p>` : ''
              }`
            : ''
        })
      },
    })
  })
}

type PhotoSwipeLightboxClass = typeof import('photoswipe/lightbox').default

function createLightbox(
  Ctor: PhotoSwipeLightboxClass,
  photos: Photo[],
  withHashNav: boolean,
): PSL {
  const lightbox = new Ctor({
    dataSource: buildDataSource(photos),
    pswpModule: () => import('photoswipe'),
    bgOpacity: 1.0,
    showHideAnimationType: 'zoom',
    loop: false,
    wheelToZoom: true,
    spacing: 0.12,
    // Fixed galleryUID=1 so hash URLs (#&gid=1&pid=photo-id) are stable.
    ...(withHashNav ? { galleryUID: 1 } : {}),
    paddingFn: (viewportSize: { x: number; y: number }) => ({
      top: 30,
      bottom: viewportSize.x < 768 ? 80 : 44,
      left: 0,
      right: 0,
    }),
  })
  attachCaption(lightbox)
  lightbox.init()
  return lightbox
}

/**
 * Collection gallery — justified grid + PhotoSwipe lightbox.
 *
 * Lazy-loading strategy:
 *   • JustifiedGallery renders immediately (SSR + initial JS bundle).
 *   • When galleryId is provided, `photoswipe/lightbox` is eagerly initialized
 *     at mount so hash-based auto-open works (reads URL hash on lightbox.init()).
 *   • Without galleryId, the lightbox shell is preloaded in the background and
 *     fully initialized only on the user's first click.
 *   • `photoswipe` core (~50 KB) is loaded via `pswpModule` only when the
 *     lightbox first opens, not before.
 *
 * JustifiedGallery remains free of any PhotoSwipe-specific code.
 * Rotation is applied upstream (server component) before photos arrive here.
 */
export default function Gallery({ photos, galleryId }: GalleryProps) {
  const lightboxRef = useRef<PSL | null>(null)
  const initPromiseRef = useRef<Promise<PSL | null> | null>(null)
  // Ref so the openAt callback always sees the latest photos without needing
  // to re-create itself (which would re-attach event handlers unnecessarily).
  const photosRef = useRef(photos)
  useEffect(() => { photosRef.current = photos }, [photos])

  useEffect(() => {
    let cancelled = false

    if (galleryId) {
      // Eager init — required so lightbox.init() reads the URL hash and
      // auto-opens the correct photo when arriving via a deep link.
      const p = import('photoswipe/lightbox').then(({ default: Ctor }): PSL | null => {
        if (cancelled) return null
        const lb = createLightbox(Ctor, photosRef.current, true)
        lightboxRef.current = lb
        return lb
      })
      initPromiseRef.current = p
    } else {
      // Preload the lightbox shell in the background so it is ready before
      // the user's first click. The core (pswpModule) is still lazy.
      import('photoswipe/lightbox')
    }

    return () => {
      cancelled = true
      lightboxRef.current?.destroy()
      lightboxRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openAt = useCallback(async (index: number) => {
    // Already initialized — open immediately.
    const existing = lightboxRef.current
    if (existing) {
      existing.loadAndOpen(index)
      return
    }

    // Eager init in progress (galleryId path) — wait for it.
    const pending = initPromiseRef.current
    if (pending) {
      const lb = await pending
      if (lb) lb.loadAndOpen(index)
      return
    }

    // Lazy init on first click (no galleryId path).
    const { default: Ctor } = await import('photoswipe/lightbox')
    // Check again after the await in case another click raced us.
    const raced = lightboxRef.current
    if (raced) {
      raced.loadAndOpen(index)
      return
    }
    const lb = createLightbox(Ctor, photosRef.current, false)
    lightboxRef.current = lb
    lb.loadAndOpen(index)
  }, []) // stable — uses refs, no deps needed

  if (photos.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">No photos in this collection yet.</p>
      </div>
    )
  }

  return <JustifiedGallery photos={photos} onPhotoClick={openAt} />
}
