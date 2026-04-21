import type { Metadata } from 'next'
import { getProducts, type PrintifyProduct } from '@/lib/printify'
import CategoryTabs from '@/components/CategoryTabs'
import ShopGrid from '@/components/ShopGrid'
import { getProductCategory } from '@/lib/shopHelpers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Fine art prints from StudioTJ — photographs from the Netherlands, printed on demand and shipped worldwide via Printify partners.',
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center max-w-xl mx-auto py-20">
      <h2 className="font-display text-3xl mb-4">The shop is restocking</h2>
      <p className="text-muted leading-relaxed mb-8">
        New products will land here when they&apos;re ready.
      </p>
      <a href="/#email-capture" className="btn-primary">Join the list</a>
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

          {/* ShopGrid handles search + product cards (client component) */}
          <ShopGrid products={products} />
        </>
      )}
    </div>
  )
}
