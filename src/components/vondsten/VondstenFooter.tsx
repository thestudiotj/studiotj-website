import Link from "next/link";

export default function VondstenFooter() {
  return (
    <footer className="border-t border-dust/30 px-6 md:px-12 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Affiliate disclosure */}
        <div>
          <p className="text-xs text-muted leading-relaxed">
            Als Amazon-partner verdien ik aan in aanmerking komende aankopen.
            Vondsten linken naar amazon.nl; aankopen via die links leveren een
            commissie op via het Amazon Partnerprogramma. Dat houdt de site
            mogelijk; het stuurt niet wat hier staat.
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
          </p>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xs text-muted leading-relaxed">
            <a
              href="mailto:info@studiotj.com"
              className="hover:text-ink transition-colors"
            >
              info@studiotj.com
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-dust/30 pt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} StudioTJ ·{" "}
          <Link href="/privacy" className="hover:text-ink transition-colors">
            Privacy
          </Link>
          {" "}·{" "}
          <Link href="/vondsten" className="hover:text-ink transition-colors">
            Vondsten
          </Link>
        </p>
        <p className="text-xs text-muted">
          Disclosure: &ldquo;Als Amazon-partner verdien ik aan in aanmerking komende aankopen.&rdquo;
        </p>
      </div>
    </footer>
  );
}
