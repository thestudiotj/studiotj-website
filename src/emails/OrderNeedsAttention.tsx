import { CodeInline, Heading, Section, Text } from '@react-email/components'
import { Layout } from './components/Layout'

export interface OrderNeedsAttentionProps {
  stripeSessionId: string
  customerEmail: string
  customerName: string
  prodigiErrorStatus: number
  prodigiErrorBody: string
  prodigiOutcome?: string
  suggestedFix?: string
  itemSummary: Array<{ title: string; sku: string; quantity: number }>
}

export function OrderNeedsAttention({
  stripeSessionId, customerEmail, customerName,
  prodigiErrorStatus, prodigiErrorBody, prodigiOutcome, suggestedFix, itemSummary,
}: OrderNeedsAttentionProps) {
  const outcomeLabel = prodigiOutcome ?? String(prodigiErrorStatus)
  const isPaymentFailed = prodigiOutcome === 'PaymentFailed'

  return (
    <Layout
      preview={`Order ${stripeSessionId.slice(-8)} needs attention — Prodigi ${outcomeLabel}`}
      heading="Order needs attention"
    >
      <Section className="mt-6">
        <Text>
          Prodigi returned <strong>{outcomeLabel}</strong> for order{' '}
          <strong>{stripeSessionId.slice(-8)}</strong>
          {prodigiErrorStatus > 0 ? ` (HTTP ${prodigiErrorStatus})` : ''}.{' '}
          {isPaymentFailed
            ? 'Stripe will continue retrying for up to 3 days. Resolve the Prodigi billing balance within that window and the order auto-completes without manual intervention.'
            : 'Stripe captured payment; the order is held pending manual resolution.'}
        </Text>
      </Section>

      <Section className="mt-6">
        <Heading as="h2" className="text-lg font-semibold">Customer</Heading>
        <Text className="my-1">{customerName} · {customerEmail}</Text>
      </Section>

      <Section className="mt-6">
        <Heading as="h2" className="text-lg font-semibold">Items</Heading>
        {itemSummary.map((item, i) => (
          <Text key={i} className="my-1">
            {item.quantity}× {item.title} <CodeInline>{item.sku}</CodeInline>
          </Text>
        ))}
      </Section>

      {suggestedFix && (
        <Section className="mt-6">
          <Heading as="h2" className="text-lg font-semibold">Suggested fix</Heading>
          <Text>{suggestedFix}</Text>
        </Section>
      )}

      <Section className="mt-6">
        <Heading as="h2" className="text-lg font-semibold">Prodigi error body</Heading>
        <CodeInline className="block whitespace-pre-wrap rounded bg-neutral-100 p-3 text-xs">
          {prodigiErrorBody}
        </CodeInline>
      </Section>

      <Section className="mt-8">
        <Heading as="h2" className="text-lg font-semibold">Stripe</Heading>
        <Text className="my-1">
          Session ID: <CodeInline>{stripeSessionId}</CodeInline>
        </Text>
        <Text className="my-1">
          Resolve via dashboard.stripe.com or re-trigger order creation against the same
          session after fixing the asset / SKU / page count.
        </Text>
      </Section>
    </Layout>
  )
}

OrderNeedsAttention.PreviewProps = {
  stripeSessionId: 'cs_live_a1b2c3d4e5f6g7h8',
  customerEmail: 'pieter@example.com',
  customerName: 'Pieter de Boer',
  prodigiErrorStatus: 400,
  prodigiErrorBody: '{"outcome":"Failed","issues":[{"errorCode":"InvalidPageCount","description":"Submitted pageCount does not match PDF asset"}]}',
  suggestedFix: 'PDF page count is 47 but Product entity declares 48. Update content/products/photo-halcyon-book-v1.mdx page_count, or re-export the PDF with the correct page count.',
  itemSummary: [
    { title: 'Halcyon V.1 Hardcover Photo Book', sku: 'GLOBAL-PB-HC-A4-PORT', quantity: 1 },
  ],
} satisfies OrderNeedsAttentionProps
