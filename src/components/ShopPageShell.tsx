import ShopSidebar from './ShopSidebar'

export default function ShopPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-24 pb-20 px-6 md:px-12">
      <div className="md:flex md:gap-12">
        <ShopSidebar />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
