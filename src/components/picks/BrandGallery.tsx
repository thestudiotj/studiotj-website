import { resolveR2 } from "@/lib/picks/paths";

interface BrandGalleryProps {
  images: string[];
  brandName: string;
}

export default function BrandGallery({ images, brandName }: BrandGalleryProps) {
  if (images.length === 0) return null;

  return (
    <section className="border-t border-dust/30 pt-8 mb-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={resolveR2(src)}
            alt={`${brandName} image ${i + 1}`}
            className="w-full h-auto"
          />
        ))}
      </div>
    </section>
  );
}
