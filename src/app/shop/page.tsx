import {
  getProducts,
  getPriceRange,
  getDefaultImage,
  formatPrice,
  type PrintifyProduct,
} from '@/lib/printify'
import Image from 'next/image'
import Link from 'next/link'
import CategoryTabs from '@/components/CategoryTabs'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Shop',
  description: 'Fine art prints and merchandise from StudioTJ',
}

// ─── Category mapping ─────────────────────────────────────────────────────────

function getProductCategory(product: PrintifyProduct): string {
  const text = [product.title, ...product.tags].join(' ').toLowerCase()
  if (/hoodie|t-shirt|\btee\b|shirt|sweatshirt/.test(text)) return 'Clothing'
  if (/tote|bag/.test(text)) return 'Accessories'
  if (/canvas|print|poster|wall\s*art/.test(text)) return 'Wall Art'
  return 'Other'
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: PrintifyProduct }) {
  const image = getDefaultImage(product)
  const { min, max } = getPriceRange(product)
  const priceLabel =
    min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`

  return (
    <Link href={`/shop/${product.id}`} className="group">
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
      <div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  let allProducts: PrintifyProduct[] = []

  try {
    allProducts = await getProducts()
  } catch {
    // API not configured or unreachable — show empty state
  }

  // Build category list from products; preserve a consistent order
  const CATEGORY_ORDER = ['Clothing', 'Accessories', 'Wall Art', 'Other']
  const categoriesWithProducts = CATEGORY_ORDER.filter((cat) =>
    allProducts.some((p) => getProductCategory(p) === cat)
  )

  const activeCategory = searchParams.category ?? 'all'

  const products =
    activeCategory === 'all'
      ? allProducts
      : allProducts.filter((p) => getProductCategory(p) === activeCategory)

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs tracking-[0.3em] uppercase text-muted mb-3">StudioTJ</p>
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-none mb-6">
          Shop
        </h1>
        <p className="text-muted max-w-md leading-relaxed">
          Fine art prints and objects. Printed on demand, shipped from the Netherlands.
        </p>
      </div>

      {allProducts.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Category tabs */}
          {categoriesWithProducts.length > 1 && (
            <CategoryTabs
              categories={categoriesWithProducts}
              active={activeCategory}
            />
          )}

          {/* Count */}
          <p className="text-xs tracking-widest uppercase text-dust mb-8">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </p>

          {products.length === 0 ? (
            <p className="text-muted text-sm">No products in this category.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
