import Link from "next/link";
import { loadAllBrands } from "@/lib/picks/loader";

export default function PicksFooter() {
  const brands = loadAllBrands();
  const hasImpactBrands = brands.some((b) => b.network === "impact");
  const hasPartnerizeBrands = brands.some((b) => b.network === "partnerize");

  return (
    <footer className="border-t border-dust/30 px-6 md:px-12 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-2">
          {hasImpactBrands && (
            <p className="text-xs text-muted leading-relaxed mb-4">
              Picks works through affiliate partnerships with Impact. Clicks
              through these brands earn StudioTJ a commission on qualifying
              purchases. The selection runs on quality fit; commission shapes
              the path to the brand, not the place on the page.
            </p>
          )}
          {hasPartnerizeBrands && (
            <p className="text-xs text-muted leading-relaxed">
              {/* Partnerize disclosure — activates when first Partnerize brand goes live */}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted leading-relaxed">
            KvK 75602172 · BTW NL002283139B11
            <br />
            Keurenplein 41 Box D2818
            <br />
            1069CD Amsterdam
            <br />
            info@studiotj.com
          </p>
        </div>
      </div>

      <div className="border-t border-dust/30 pt-6">
        <div className="flex flex-wrap items-center gap-y-2 text-xs tracking-widest uppercase text-muted">
          {[
            { href: '/gear', label: 'My Gear' },
            { href: '/picks', label: 'Picks' },
            { href: '/vondsten', label: 'Vondsten' },
            { href: '/contact', label: 'Contact' },
            { href: '/privacy', label: 'Privacy' },
            { href: '/terms', label: 'Terms' },
          ].map((link, i) => (
            <span key={link.href} className="flex items-center">
              {i > 0 && (
                <span className="mx-3 select-none" aria-hidden="true">·</span>
              )}
              <Link href={link.href} className="hover:text-ink transition-colors">
                {link.label}
              </Link>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
