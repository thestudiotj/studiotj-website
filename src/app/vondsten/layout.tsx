import VondstenFooter from "@/components/vondsten/VondstenFooter";

export default function VondstenLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <VondstenFooter />
    </>
  );
}
