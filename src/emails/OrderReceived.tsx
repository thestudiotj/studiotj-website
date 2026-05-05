import { Heading, Section, Text } from '@react-email/components'
import { Layout } from './components/Layout'

export interface OrderReceivedProps {
  customerName: string
  orderRef: string
  items: Array<{
    title: string
    quantity: number
    priceFormatted: string
  }>
  totalFormatted: string
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    postalCode: string
    country: string
  }
  estimatedDeliveryDays: string
}

export function OrderReceived({
  customerName, orderRef, items, totalFormatted, shippingAddress, estimatedDeliveryDays,
}: OrderReceivedProps) {
  return (
    <Layout
      preview={`Your StudioTJ order ${orderRef} is on its way to our printers`}
      heading="Your order is on its way to our printers."
    >
      <Section className="mt-6">
        <Text>Thanks {customerName} &mdash; we&apos;ve received your order.</Text>
        <Text>
          Order reference: <strong>{orderRef}</strong>
        </Text>
      </Section>

      <Section className="mt-8">
        <Heading as="h2" className="text-lg font-semibold">What you ordered</Heading>
        {items.map((item, i) => (
          <Text key={i} className="my-1">
            {item.quantity}× {item.title} — {item.priceFormatted}
          </Text>
        ))}
        <Text className="mt-2 font-semibold">Total: {totalFormatted}</Text>
      </Section>

      <Section className="mt-8">
        <Heading as="h2" className="text-lg font-semibold">Shipping to</Heading>
        <Text className="my-1">{shippingAddress.line1}</Text>
        {shippingAddress.line2 && <Text className="my-1">{shippingAddress.line2}</Text>}
        <Text className="my-1">{shippingAddress.postalCode} {shippingAddress.city}</Text>
        <Text className="my-1">{shippingAddress.country}</Text>
      </Section>

      <Section className="mt-8">
        <Text>
          Estimated delivery: {estimatedDeliveryDays} from dispatch. We&apos;ll send you
          tracking details when it ships.
        </Text>
      </Section>
    </Layout>
  )
}

OrderReceived.PreviewProps = {
  customerName: 'Pieter de Boer',
  orderRef: 'a1b2c3d4',
  items: [
    { title: 'Halcyon 001 — Hahnemühle Photo Rag, A3', quantity: 1, priceFormatted: '€48,00' },
  ],
  totalFormatted: '€52,99',
  shippingAddress: {
    line1: 'Vrijthof 12',
    city: 'Maastricht',
    postalCode: '6211 LD',
    country: 'Netherlands',
  },
  estimatedDeliveryDays: '5–10 business days',
} satisfies OrderReceivedProps
