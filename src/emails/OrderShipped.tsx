import { Button, Heading, Section, Text } from '@react-email/components'
import { Layout } from './components/Layout'

export interface OrderShippedProps {
  customerName: string
  orderRef: string
  carrierName: string
  trackingNumber?: string
  trackingUrl?: string
  estimatedDeliveryDays: string
}

export function OrderShipped({
  customerName, orderRef, carrierName, trackingNumber, trackingUrl, estimatedDeliveryDays,
}: OrderShippedProps) {
  return (
    <Layout
      preview={`Your StudioTJ order ${orderRef} has shipped`}
      heading="Your order has shipped."
    >
      <Section className="mt-6">
        <Text>Hi {customerName},</Text>
        <Text>
          Order <strong>{orderRef}</strong> is on its way via {carrierName}.
        </Text>
      </Section>

      {trackingNumber && (
        <Section className="mt-6">
          <Heading as="h2" className="text-lg font-semibold">Tracking</Heading>
          <Text className="my-1">
            Tracking number: <strong>{trackingNumber}</strong>
          </Text>
          {trackingUrl && (
            <Button
              href={trackingUrl}
              className="mt-3 rounded bg-neutral-900 px-5 py-3 text-sm font-medium text-white"
            >
              Track your package
            </Button>
          )}
        </Section>
      )}

      <Section className="mt-8">
        <Text>
          Estimated delivery: {estimatedDeliveryDays}.
        </Text>
      </Section>
    </Layout>
  )
}

OrderShipped.PreviewProps = {
  customerName: 'Pieter de Boer',
  orderRef: 'a1b2c3d4',
  carrierName: 'PostNL',
  trackingNumber: '3SKABA0123456789',
  trackingUrl: 'https://jouw.postnl.nl/track-and-trace/3SKABA0123456789',
  estimatedDeliveryDays: '2–3 business days',
} satisfies OrderShippedProps
