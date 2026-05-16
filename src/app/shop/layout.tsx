import ShopFooter from "@/components/shop/ShopFooter";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ShopFooter />
    </>
  );
}
