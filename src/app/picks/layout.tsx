import PicksFooter from "@/components/picks/PicksFooter";

export default function PicksLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PicksFooter />
    </>
  );
}
