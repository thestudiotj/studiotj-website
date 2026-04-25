export default function HeroImage({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={1920}
      height={1080}
      loading="eager"
      fetchPriority="high"
      className="absolute inset-0 w-full h-full object-cover"
    />
  )
}
