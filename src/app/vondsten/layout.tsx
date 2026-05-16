import VondstenFooter from "@/components/vondsten/VondstenFooter";

export default function VondstenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="nl">
      {children}
      <VondstenFooter />
    </div>
  );
}
