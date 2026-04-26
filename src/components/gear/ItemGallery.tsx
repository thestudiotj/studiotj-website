import { resolveR2 } from "@/lib/gear/paths";

interface ItemGalleryProps {
  images: string[];
  itemName: string;
}

export default function ItemGallery({ images, itemName }: ItemGalleryProps) {
  if (images.length === 0) return null;

  return (
    <section className="border-t border-dust/30 pt-8 mb-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={resolveR2(src)}
            alt={`${itemName} image ${i + 1}`}
            className="w-full aspect-square object-cover"
          />
        ))}
      </div>
    </section>
  );
}
