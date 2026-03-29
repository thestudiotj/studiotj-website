import {
  getProducts,
  getPriceRange,
  getDefaultImage,
  formatPrice,
  type PrintifyProduct,
} from '@/lib/printify'
import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'Shop',
  description: 'Fine art prints and merchandise from StudioTJ',
}

function ProductCard({ product }: { product: PrintifyProduct }) {
  const image = getDefaultImage(product)
  const { min, max } = getPriceRange(product)
  const priceLabel =
    min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`
  const tag = product.tags?.[0]

  return (
    <Link href={`/shop/${product.id}`} className="group">
      {/* Image */}
      <div className="aspect-square bg-dust/20 relative overflow-hidden mb-4">
        {image ? (
          <Image
            src={image.src}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-dust text-xs tracking-widest uppercase">No image</span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div>
        {tag && (
          <p className="text-xs tracking-[0.2em] uppercase text-dust mb-1">{tag}</p>
        )}
        <h3 className="text-sm font-medium text-ink leading-snug">{product.title}</h3>
        <p className="text-muted text-sm mt-1">{priceLabel}</p>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="border border-dust/40 p-12 text-center max-w-lg">
      <p className="font-display text-2xl text-ink mb-3">Shop coming soon.</p>
      <p className="text-sm text-muted leading-relaxed">
        No published products found in your Printify shop yet.
        <br />
        Publish products in Printify and they'll appear here.
      </p>
    </div>
  )
}

export default async function ShopPage() {
  let products: PrintifyProduct[] = []

  try {
    products = await getProducts()
  } catch {
    // API not configured or unreachable — show empty state
  }

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      {/* Header */}
      <div className="mb-16">
        <p className="text-xs tracking-[0.3em] uppercase text-muted mb-3">StudioTJ</p>
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-none mb-6">
          Shop
        </h1>
        <p className="text-muted max-w-md leading-relaxed">
          Fine art prints and objects. Printed on demand, shipped from the Netherlands.
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Count */}
          <p className="text-xs tracking-widest uppercase text-dust mb-8">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
