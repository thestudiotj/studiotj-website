import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Terms — StudioTJ' },
  description:
    'Terms of sale for StudioTJ orders: products, pricing, delivery, returns, your right of withdrawal, and complaints. Dutch law applies; consumer rights under EU law take precedence where they differ.',
}

export default function TermsPage() {
  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      <div className="max-w-3xl">
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-4">Terms</h1>
        <p className="text-sm text-muted mb-8">Last updated: April 14, 2026</p>

        <p className="text-muted leading-relaxed mb-12">
          These terms describe what you are buying when you place an order through StudioTJ, who
          fulfils it, what your rights are if something goes wrong, and how returns and refunds
          work. They apply to all orders placed through studiotj.com. Dutch law applies, and your
          rights as a consumer under EU law sit on top of anything stated here — where these terms
          and the law differ, the law wins.
        </p>

        {/* Who you are buying from */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Who you are buying from
          </h2>
          <ul className="space-y-2">
            <li className="text-muted leading-relaxed">
              <strong>Trader:</strong> Tjeerd van der Heeft, eenmanszaak (KvK 75602172), trading
              as StudioTJ (also registered under the trading name Definitive015)
            </li>
            <li className="text-muted leading-relaxed">
              <strong>BTW:</strong> NL002283139B11
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Post:</strong> Keurenplein 41, Box D2818, 1069CD Amsterdam
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Contact:</strong>{' '}
              <a href="mailto:thestudiotj@gmail.com" className="text-accent hover:underline">
                thestudiotj@gmail.com
              </a>
            </li>
          </ul>
        </section>

        {/* Products and pricing */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Products and pricing
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            The shop offers photographic prints and apparel, currently produced and shipped by a
            print-on-demand fulfilment partner. Each product page shows the product description,
            available options, price, and any applicable taxes.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            Prices are shown in your local currency where supported, with VAT included for EU
            customers. Shipping costs are calculated at checkout based on the destination and the
            chosen product. The total price you pay is the total shown on the final checkout page
            before payment.
          </p>
          <p className="text-muted leading-relaxed">
            Product availability and pricing can change. The price that applies to your order is
            the price shown at the moment you complete checkout.
          </p>
        </section>

        {/* Ordering and payment */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Ordering and payment
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            Placing an order means you accept these terms and the price shown at checkout. Payment
            is processed by Stripe; payment details are entered on Stripe&apos;s secure checkout
            page and are not handled by StudioTJ directly. Supported payment methods are shown at
            checkout and depend on your region.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            A confirmation email is sent once payment has been received. That email is the
            confirmation that your order has been placed; it is not yet a confirmation of
            shipment.
          </p>
          <p className="text-muted leading-relaxed">
            If an order cannot be fulfilled — for example, due to a production issue at the
            fulfilment partner, or an obvious pricing error — StudioTJ reserves the right to
            cancel the order and refund the full amount paid. You will be notified by email if
            this happens.
          </p>
        </section>

        {/* Delivery */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Delivery
          </h2>

          <h3 className="font-display text-xl md:text-2xl text-ink leading-tight mb-4">
            How fulfilment works
          </h3>
          <p className="text-muted leading-relaxed mb-4">
            Products are produced on demand by a third-party print-on-demand partner — currently
            Printify — which means each item is printed after you order it. Production typically
            takes a few business days, after which the item ships. Delivery times depend on the
            destination and the shipping option chosen at checkout.
          </p>
          <p className="text-muted leading-relaxed mb-8">
            The estimates shown at checkout are typical timeframes from the fulfilment partner;
            they are not guarantees. Delays can happen at the production stage or with the
            carrier, and StudioTJ does not control either of those steps directly.
          </p>

          <h3 className="font-display text-xl md:text-2xl text-ink leading-tight mb-4">
            Shipping address
          </h3>
          <p className="text-muted leading-relaxed mb-8">
            Please double-check the shipping address you enter at checkout — it is the single most
            common cause of failed deliveries, and once an order has been sent to production, the
            address typically cannot be changed. If you spot a mistake immediately after ordering,
            email{' '}
            <a href="mailto:thestudiotj@gmail.com" className="text-accent hover:underline">
              thestudiotj@gmail.com
            </a>{' '}
            straight away and StudioTJ will try to catch it before production starts. If a package
            is returned because the address was incorrect or incomplete, the fulfilment partner
            may refund the product price but typically not the shipping cost — re-shipping to a
            corrected address is treated as a new order.
          </p>

          <h3 className="font-display text-xl md:text-2xl text-ink leading-tight mb-4">
            Lost or significantly delayed packages
          </h3>
          <p className="text-muted leading-relaxed">
            If your package has not arrived within a reasonable time after the estimated delivery
            window — generally a week or two after the latest estimate, longer for international
            shipments — email the contact address above and StudioTJ will investigate with the
            fulfilment partner. Lost-in-transit cases are handled per the fulfilment
            partner&apos;s process, described in the next section.
          </p>
        </section>

        {/* Returns, refunds, and your right of withdrawal — anchor target for footer deep-link */}
        <section id="shipping-returns" className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Returns, refunds, and your right of withdrawal
          </h2>

          <h3 className="font-display text-xl md:text-2xl text-ink leading-tight mb-4">
            Plain-language summary
          </h3>
          <ul className="space-y-3 mb-8">
            <li className="text-muted leading-relaxed">
              <strong>Defective, damaged, or wrong product?</strong> You are covered. Report it
              within 30 days of delivery and you get a replacement or refund. Photo evidence
              required, no need to return the item.
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Changed your mind about a standard product?</strong> EU consumer law gives
              you 14 days from receipt to withdraw from the order, no reason required. Details
              below.
            </li>
            <li className="text-muted leading-relaxed">
              <strong>Custom-commissioned work</strong> (made specifically to your
              specifications): the 14-day cooling-off period does not apply, per EU law. None of
              the current shop products fall under this category — it would only become relevant
              if commissioned work is offered through the shop in the future.
            </li>
          </ul>

          <h3 className="font-display text-xl md:text-2xl text-ink leading-tight mb-4">
            Right of withdrawal (14-day cooling-off period)
          </h3>
          <p className="text-muted leading-relaxed mb-4">
            For products bought through the shop, you have the right to withdraw from the
            purchase within <strong>14 days</strong> of receiving the item, without giving any
            reason. This right comes from the EU Consumer Rights Directive (2011/83/EU),
            transposed into Dutch law in Boek 6 BW Art. 230o and following.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            To exercise this right:
          </p>
          <ol className="list-decimal list-inside space-y-3 mb-4 text-muted leading-relaxed">
            <li>
              Notify StudioTJ of your withdrawal within the 14-day period by emailing{' '}
              <a href="mailto:thestudiotj@gmail.com" className="text-accent hover:underline">
                thestudiotj@gmail.com
              </a>
              , with your order number and the item(s) you are withdrawing. You can use the{' '}
              <a
                href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32011L0083#d1e32-83-1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                EU model withdrawal form
              </a>{' '}
              but it is not required — a clear written statement is enough.
            </li>
            <li>
              Return the item(s) within 14 days of notifying StudioTJ. Return address and
              instructions are provided in the reply to your withdrawal notice. Return shipping
              costs are the buyer&apos;s responsibility unless StudioTJ confirms otherwise.
            </li>
            <li>
              Items should be returned in their original condition. A reduction in refund value
              can apply if the item is returned damaged or with clear signs of use beyond what is
              needed to inspect it.
            </li>
          </ol>
          <p className="text-muted leading-relaxed mb-8">
            StudioTJ refunds the full amount paid within 14 days of receiving the withdrawal
            notice, using the same payment method used for the original order. The refund includes
            the original delivery cost up to the price of the lowest-cost standard delivery option
            offered (so if you chose an upgraded shipping method, the difference is not refunded).
            The refund can be withheld until the returned items are received, or until you provide
            proof of return — whichever happens first.
          </p>

          <h3 className="font-display text-xl md:text-2xl text-ink leading-tight mb-4">
            Custom or personalised work (when applicable)
          </h3>
          <p className="text-muted leading-relaxed mb-8">
            If StudioTJ offers commissioned or personalised work in the future — photographs made
            or printed to your specific request — those orders are exempt from the 14-day
            withdrawal right under EU law (Directive 2011/83/EU Art. 16(c), Dutch implementation
            Boek 6 BW Art. 230p). This will be made clear at the point of purchase for any
            product where the exemption applies. The exemption does not affect your other rights,
            including the right to a working, defect-free product.
          </p>

          <h3 className="font-display text-xl md:text-2xl text-ink leading-tight mb-4">
            Defective, damaged, or wrong items (fulfilment partner process)
          </h3>
          <p className="text-muted leading-relaxed mb-4">
            Separate from the cooling-off period, the fulfilment partner provides a{' '}
            <strong>30-day reprint or refund process</strong> for production and shipping issues.
            Eligible cases include:
          </p>
          <ul className="space-y-2 mb-4">
            <li className="text-muted leading-relaxed">Product arrived damaged</li>
            <li className="text-muted leading-relaxed">Manufacturing or print error</li>
            <li className="text-muted leading-relaxed">Wrong product received</li>
            <li className="text-muted leading-relaxed">
              Lost in transit (after the estimated delivery window)
            </li>
          </ul>
          <p className="text-muted leading-relaxed mb-8">
            To report any of these: email{' '}
            <a href="mailto:thestudiotj@gmail.com" className="text-accent hover:underline">
              thestudiotj@gmail.com
            </a>{' '}
            within 30 days of delivery, with your order number and a clear photo of the issue.
            The item does not need to be returned. StudioTJ will arrange a free reprint or a
            refund through the fulfilment partner.
          </p>
          <p className="text-muted leading-relaxed mb-8">
            This 30-day process runs in parallel with — not instead of — your statutory rights
            under Dutch and EU consumer law, including the legal guarantee that a product must
            conform to what was sold. If a defect appears later than 30 days after delivery,
            contact StudioTJ regardless; defects within the legal guarantee period are addressed
            on a case-by-case basis.
          </p>

          <h3 className="font-display text-xl md:text-2xl text-ink leading-tight mb-4">
            Future fulfilment partners
          </h3>
          <p className="text-muted leading-relaxed mb-8">
            If StudioTJ adds further fulfilment partners — for example, additional partners for
            fine art prints — their specific processes will be added to this section before any
            orders flow through them. Existing orders are not affected by partner additions.
          </p>

          <h3 className="font-display text-xl md:text-2xl text-ink leading-tight mb-4">
            Current fulfilment partner: Printify
          </h3>
          <p className="text-muted leading-relaxed">
            Printify&apos;s published reprint and refund policy, summarised above, is documented
            at:{' '}
            <a
              href="https://help.printify.com/hc/en-us/articles/4483630299025"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              help.printify.com
            </a>
            .
          </p>
        </section>

        {/* Defects and complaints */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Defects and complaints
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            Under Dutch law (Boek 7 BW Art. 17), products must conform to the contract — meaning
            they must work as expected, match the description shown, and be of the quality
            reasonably expected for a product of that kind. If a product does not conform, you
            are entitled to a remedy: repair, replacement, partial refund, or full refund,
            depending on the nature of the defect.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            To make a complaint, email{' '}
            <a href="mailto:thestudiotj@gmail.com" className="text-accent hover:underline">
              thestudiotj@gmail.com
            </a>{' '}
            with your order number and a description of the issue. Complaints are answered within
            14 days. If a complaint requires longer to resolve, you will receive an
            acknowledgement within 14 days indicating when a full response can be expected.
          </p>
          <p className="text-muted leading-relaxed">
            If a complaint is not resolved to your satisfaction, you can use the EU Online Dispute
            Resolution platform at{' '}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>
            , which provides an out-of-court route for cross-border online purchase disputes.
          </p>
        </section>

        {/* Liability */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Liability
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            StudioTJ is liable for damages caused by intent or gross negligence, and for any
            damages that cannot be excluded under Dutch consumer law. Liability for indirect
            damages (loss of profit, loss of data, consequential business losses) is excluded to
            the extent permitted by law.
          </p>
          <p className="text-muted leading-relaxed">
            This does not limit your statutory rights as a consumer.
          </p>
        </section>

        {/* Applicable law and disputes */}
        <section className="mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Applicable law and disputes
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            These terms and any dispute arising from them are governed by Dutch law. The Dutch
            courts have jurisdiction, with the court of your place of residence (within the
            Netherlands) typically being competent. EU consumers outside the Netherlands retain
            the protections of their home country&apos;s mandatory consumer law and may bring
            proceedings in their home court where the law allows.
          </p>
          <p className="text-muted leading-relaxed">
            The EU Online Dispute Resolution platform mentioned above is also available as a first
            step for online purchase disputes.
          </p>
        </section>

        {/* Changes to these terms */}
        <section>
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-6">
            Changes to these terms
          </h2>
          <p className="text-muted leading-relaxed">
            These terms can change — for example, when a new fulfilment partner is added, when a
            new product line launches, or when applicable law changes. The version of the terms in
            force at the time you placed your order is the version that applies to that order.
            Material changes are dated at the top of this page.
          </p>
        </section>
      </div>
    </div>
  )
}
