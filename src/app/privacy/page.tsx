import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Privacy — StudioTJ' },
  description:
    'How StudioTJ handles personal data: what is collected for orders, email correspondence, and the newsletter signup, who else processes it, and how long it is kept. Compliant with the AVG (GDPR).',
}

export default function PrivacyPage() {
  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      <div className="max-w-3xl">
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-4">Privacy</h1>
        <p className="text-sm text-muted mb-8">Last updated: April 14, 2026</p>

        <p className="text-muted leading-relaxed mb-12">
          StudioTJ collects personal data only as needed to ship orders, handle email
          correspondence, and operate the newsletter signup. The site does not use user accounts,
          behavioural tracking, or third-party analytics. The sections below describe what is
          collected for each purpose, who else processes it, and how long it is kept.
        </p>

        {/* Who runs this site */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Who runs this site
          </h2>
          <ul className="space-y-2 mb-6">
            <li className="text-muted leading-relaxed">
              <strong>Controller:</strong> Tjeerd van der Heeft, eenmanszaak (KvK 75602172),
              trading as StudioTJ (also registered under the trading name Definitive015)
            </li>
            <li className="text-muted leading-relaxed">
              <strong>BTW:</strong> NL002283139B11
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Post:</strong> Keurenplein 41, Box D2818, 1069CD Amsterdam
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Privacy contact:</strong>{' '}
              <a href="mailto:thestudiotj@gmail.com" className="text-accent hover:underline">
                thestudiotj@gmail.com
              </a>
            </li>
          </ul>
          <p className="text-muted leading-relaxed">
            For privacy questions or to exercise any of the rights described below, email the
            address above.
          </p>
        </section>

        {/* What StudioTJ collects, and why */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            What StudioTJ collects, and why
          </h2>

          <h3 className="font-display text-xl md:text-2xl text-ink leading-tight mb-4">
            When you place an order
          </h3>
          <p className="text-muted leading-relaxed mb-4">
            Stripe handles checkout. You enter your payment details, billing address, and email
            directly into Stripe&apos;s hosted payment page. Stripe is the controller of that
            payment data; their own privacy notice covers it.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            After payment, Stripe sends StudioTJ the order details: your name, email, shipping
            address, and what you ordered. That information is then sent to the print-on-demand
            fulfilment partner — currently Printify — which produces and ships the order. Legal
            basis: performance of a contract (AVG Art. 6(1)(b)) — without these details, the
            order cannot be fulfilled.
          </p>
          <p className="text-muted leading-relaxed mb-8">
            A copy of the order is also kept for tax bookkeeping, which Dutch tax law requires for
            seven years (Algemene wet inzake rijksbelastingen, Art. 52). Legal basis: legal
            obligation (AVG Art. 6(1)(c)).
          </p>

          <h3 className="font-display text-xl md:text-2xl text-ink leading-tight mb-4">
            When you write in
          </h3>
          <p className="text-muted leading-relaxed mb-8">
            If you email{' '}
            <a href="mailto:thestudiotj@gmail.com" className="text-accent hover:underline">
              thestudiotj@gmail.com
            </a>
            , your email address and the contents of your message are visible to Google (which
            provides the inbox) and to me. Replies are sent the same way. Email is kept as long as
            needed to handle the conversation and any reasonable follow-up. Legal basis: legitimate
            interest in answering correspondence (AVG Art. 6(1)(f)).
          </p>

          <h3 className="font-display text-xl md:text-2xl text-ink leading-tight mb-4">
            When you submit your email for updates
          </h3>
          <p className="text-muted leading-relaxed mb-8">
            The newsletter signup on the homepage stores your email address so you can be notified
            when StudioTJ has new work to share. The signup form is active and collects email
            addresses now, but no newsletter emails are being sent yet — the sending side is not
            yet set up. When sending begins, addresses already on file will be used only for that
            purpose, and you can unsubscribe at any time. You can also request removal at any
            point before sending begins, by emailing the privacy contact above. Legal basis:
            consent (AVG Art. 6(1)(a)).
          </p>

          <h3 className="font-display text-xl md:text-2xl text-ink leading-tight mb-4">
            When you visit the site
          </h3>
          <p className="text-muted leading-relaxed mb-4">
            The hosting provider (Vercel) keeps standard server logs — IP address, browser type,
            timestamp, and which pages were requested. These are used for security, debugging, and
            capacity. The CDN (Cloudflare) sets a small bot-management cookie called{' '}
            <code className="font-mono text-sm bg-dust/20 px-1 rounded">__cf_bm</code> to
            distinguish humans from automated traffic. Stripe Checkout sets its own cookies on its
            own pages while you are paying. The shopping cart uses a small amount of browser
            storage — a session cookie or local storage in your browser, depending on your setup —
            to remember what you have added while you browse.
          </p>
          <p className="text-muted leading-relaxed">
            That&apos;s the full list of what the site sets today. If analytics or other tracking
            is added later, this section is updated and, where required, consent is collected
            first. Legal basis for the strictly necessary items above: legitimate interest in
            keeping the site secure and functional (AVG Art. 6(1)(f)).
          </p>
        </section>

        {/* Who else processes your data */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Who else processes your data
          </h2>
          <p className="text-muted leading-relaxed mb-6">
            StudioTJ uses the following processors. Each only sees what it needs to do its job.
          </p>
          <ul className="space-y-2 mb-6">
            <li className="text-muted leading-relaxed">
              <strong>Stripe</strong> — payments
            </li>
            <li className="text-muted leading-relaxed">
              <strong>
                Print-on-demand fulfilment partner (currently Printify)
              </strong>{' '}
              — order fulfilment, and through them, the print provider that physically produces
              and ships your order
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Resend</strong> — transactional emails such as order confirmations
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Cloudflare</strong> — DNS and CDN
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Vercel</strong> — hosting
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Hetzner</strong> — server hosting for backend automation workflows that may
              process order data (located in Germany)
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Google</strong> — inbox provider for{' '}
              <a href="mailto:thestudiotj@gmail.com" className="text-accent hover:underline">
                thestudiotj@gmail.com
              </a>
            </li>
          </ul>
          <p className="text-muted leading-relaxed">
            Each has its own privacy policy describing what it does with the data it receives. As
            StudioTJ adds further fulfilment partners — for example, additional partners for fine
            art prints — they will be listed here before any customer data starts flowing to them.
          </p>
        </section>

        {/* Where your data goes */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Where your data goes
          </h2>
          <p className="text-muted leading-relaxed">
            Most processors are EU-based or have EU operations. Some (Stripe, Cloudflare, Vercel,
            Google) are headquartered in the United States, and the fulfilment partner&apos;s
            print providers may be located worldwide depending on which provider physically
            produces your order. Where data is transferred outside the EU/EEA, the transfer is
            covered by Standard Contractual Clauses or equivalent safeguards under AVG Chapter V.
          </p>
        </section>

        {/* How long it is kept */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            How long it is kept
          </h2>
          <ul className="space-y-2">
            <li className="text-muted leading-relaxed">
              <strong>Order and invoice records:</strong> seven years, per Dutch tax law
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Transactional email logs:</strong> per Resend&apos;s retention policy
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Email correspondence:</strong> as long as needed for the conversation, then
              deleted on a periodic basis
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Server and security logs:</strong> short-term, per Vercel and Cloudflare
              default retention
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Newsletter email addresses:</strong> until you unsubscribe or request removal
            </li>
          </ul>
        </section>

        {/* Your rights */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Your rights
          </h2>
          <p className="text-muted leading-relaxed mb-6">Under the AVG you have the right to:</p>
          <ul className="space-y-2 mb-6">
            <li className="text-muted leading-relaxed">
              Access the personal data StudioTJ holds about you
            </li>
            <li className="text-muted leading-relaxed">Have inaccurate data corrected</li>
            <li className="text-muted leading-relaxed">
              Have your data deleted (subject to legal retention obligations such as the seven-year
              tax record)
            </li>
            <li className="text-muted leading-relaxed">Restrict or object to processing</li>
            <li className="text-muted leading-relaxed">
              Receive your data in a portable format
            </li>
            <li className="text-muted leading-relaxed">
              Withdraw consent (where consent is the legal basis)
            </li>
          </ul>
          <p className="text-muted leading-relaxed mb-4">
            Email{' '}
            <a href="mailto:thestudiotj@gmail.com" className="text-accent hover:underline">
              thestudiotj@gmail.com
            </a>{' '}
            to exercise any of these. A response goes out within 30 days at the latest.
          </p>
          <p className="text-muted leading-relaxed">
            If StudioTJ does not handle a privacy concern to your satisfaction, you have the right
            to lodge a complaint with the Dutch data protection authority, the{' '}
            <strong>Autoriteit Persoonsgegevens</strong> (
            <a
              href="https://autoriteitpersoonsgegevens.nl/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              autoriteitpersoonsgegevens.nl
            </a>
            ).
          </p>
        </section>

        {/* Cookies and tracking */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Cookies and tracking
          </h2>
          <p className="text-muted leading-relaxed mb-6">
            The site itself does not currently set analytics, advertising, or tracking cookies.
            The cookies and equivalent browser storage used during normal visits are:
          </p>
          <ul className="space-y-2 mb-6">
            <li className="text-muted leading-relaxed">
              <strong>
                <code className="font-mono text-sm bg-dust/20 px-1 rounded">__cf_bm</code>
              </strong>{' '}
              — Cloudflare bot management, set automatically on traffic served through
              Cloudflare&apos;s CDN
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Stripe Checkout cookies</strong> — set by Stripe on its own checkout pages
              while you are paying
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Cart storage</strong> — a small amount of browser storage (session cookie or
              local storage, depending on your browser) used to remember what you have added to
              your cart while browsing
            </li>
          </ul>
          <p className="text-muted leading-relaxed">
            If analytics or other non-essential cookies are added later, this section is updated
            and consent is collected first where required.
          </p>
        </section>

        {/* Changes to this policy */}
        <section>
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Changes to this policy
          </h2>
          <p className="text-muted leading-relaxed">
            This policy is updated when something material changes — a new processor, a new
            product line, a new legal requirement. Material changes are dated at the top of this
            page. The policy in force at the time you placed an order, sent an email, or submitted
            your address is the one that applies to that interaction.
          </p>
        </section>
      </div>
    </div>
  )
}
