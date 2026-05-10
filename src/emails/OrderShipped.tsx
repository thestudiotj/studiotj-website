import { Button, Heading, Section, Text } from '@react-email/components'
import { Layout } from './components/Layout'

export type TrackingPresentation =
  | { kind: 'url'; url: string; carrier: string; service: string }
  | { kind: 'number'; number: string; carrier: string; service: string }
  | { kind: 'none'; carrier: string; service: string }

export interface OrderShippedProps {
  customerName: string
  orderRef: string
  tracking: TrackingPresentation
  shipmentIndex?: number
  totalShipments?: number
}

export function OrderShipped({
  customerName,
  orderRef,
  tracking,
  shipmentIndex,
  totalShipments,
}: OrderShippedProps) {
  const isPartial = typeof shipmentIndex === 'number' && typeof totalShipments === 'number'
  const headingText = isPartial
    ? `Part ${shipmentIndex} of ${totalShipments} has shipped.`
    : 'Your order has shipped.'

  const carrierLine =
    tracking.service
      ? `${tracking.carrier} — ${tracking.service}`
      : tracking.carrier

  return (
    <Layout
      preview={`Your StudioTJ order ${orderRef} has shipped`}
      heading={headingText}
    >
      <Section className="mt-6">
        <Text>Hi {customerName},</Text>
        {isPartial ? (
          <Text>
            Part <strong>{shipmentIndex}</strong> of your order <strong>{orderRef}</strong> is on
            its way via {carrierLine}.
          </Text>
        ) : (
          <Text>
            Order <strong>{orderRef}</strong> is on its way via {carrierLine}.
          </Text>
        )}
      </Section>

      {tracking.kind === 'url' && (
        <Section className="mt-6">
          <Heading as="h2" className="text-lg font-semibold">Tracking</Heading>
          <Button
            href={tracking.url}
            className="mt-3 rounded bg-neutral-900 px-5 py-3 text-sm font-medium text-white"
          >
            Track your package
          </Button>
        </Section>
      )}

      {tracking.kind === 'number' && (
        <Section className="mt-6">
          <Heading as="h2" className="text-lg font-semibold">Tracking</Heading>
          <Text className="my-1">
            {carrierLine} — tracking <strong>{tracking.number}</strong>
          </Text>
        </Section>
      )}

      {tracking.kind === 'none' && (
        <Section className="mt-6">
          <Text>Your order has been dispatched via {tracking.carrier}.</Text>
        </Section>
      )}
    </Layout>
  )
}

OrderShipped.PreviewProps = {
  customerName: 'Pieter de Boer',
  orderRef: 'A1B2C3D4',
  tracking: {
    kind: 'url',
    url: 'https://jouw.postnl.nl/track-and-trace/3SKABA0123456789',
    carrier: 'PostNL',
    service: 'Standard',
  },
  shipmentIndex: 1,
  totalShipments: 2,
} satisfies OrderShippedProps
