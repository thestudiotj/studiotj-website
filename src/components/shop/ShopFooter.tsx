import Link from "next/link";

export default function ShopFooter() {
  return (
    <footer className="border-t border-dust/30 px-6 md:px-12 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Provider disclosure */}
        <div className="md:col-span-2">
          <p className="text-xs text-muted leading-relaxed">
            Payments are processed by Stripe. Prints are produced and shipped by Prodigi.
          </p>
        </div>

        {/* Business details */}
        <div>
          <p className="text-xs text-muted leading-relaxed">
            KvK 75602172 · BTW NL002283139B11
            <br />
            Keurenplein 41 Box D2818
            <br />
            1069CD Amsterdam
            <br />
            <a
              href="mailto:info@studiotj.com"
              className="hover:text-ink transition-colors"
            >
              info@studiotj.com
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-dust/30 pt-6">
        <div className="flex flex-wrap items-center gap-y-2 text-xs tracking-widest uppercase text-muted">
          {[
            { href: '/shop', label: 'Shop' },
            { href: '/shop/learn', label: 'How buying a print works' },
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
        <p className="text-xs text-muted mt-4">
          © {new Date().getFullYear()} StudioTJ
        </p>
      </div>
    </footer>
  );
}
