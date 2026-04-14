import Image from 'next/image'

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
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
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
