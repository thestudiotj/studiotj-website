import { getProducts, type PrintifyProduct } from '@/lib/printify'
import CategoryTabs from '@/components/CategoryTabs'
import ShopGrid from '@/components/ShopGrid'
import { getProductCategory } from '@/lib/shopHelpers'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Shop',
  description: 'Fine art prints and merchandise from StudioTJ',
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="border border-dust/40 p-12 text-center max-w-lg">
      <p className="font-display text-2xl text-ink mb-3">Shop coming soon.</p>
      <p className="text-sm text-muted leading-relaxed">
        No published products found in your Printify shop yet.
        <br />
        Publish products in Printify and they&apos;ll appear here.
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
