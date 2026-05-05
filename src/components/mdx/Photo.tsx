interface PhotoProps {
  src: string
  alt: string
  caption?: string
  aspect?: 'landscape' | 'portrait' | 'square'
}

const aspectClasses: Record<NonNullable<PhotoProps['aspect']>, string> = {
  landscape: 'aspect-[16/9]',
  portrait:  'aspect-[3/4]',
  square:    'aspect-square',
}

export default function Photo({ src, alt, caption, aspect = 'landscape' }: PhotoProps) {
  return (
    <figure className="my-6">
      <div className={`relative w-full overflow-hidden ${aspectClasses[aspect]}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-sm text-muted text-center font-mono">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
