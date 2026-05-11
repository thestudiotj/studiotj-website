import { Resend } from 'resend'
import { render } from '@react-email/components'
import { OrderReceived, type OrderReceivedProps } from '@/emails/OrderReceived'
import { OrderShipped, type OrderShippedProps } from '@/emails/OrderShipped'
import { OrderNeedsAttention, type OrderNeedsAttentionProps } from '@/emails/OrderNeedsAttention'

let _client: Resend | null = null

function getResend(): Resend {
  if (_client) return _client
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  _client = new Resend(apiKey)
  return _client
}

function getFromAddress(): string {
  const from = process.env.RESEND_FROM_ADDRESS
  if (!from) throw new Error('RESEND_FROM_ADDRESS is not set')
  return from
}

function getAdminEmail(): string {
  const admin = process.env.STUDIOTJ_ADMIN_EMAIL
  if (!admin) throw new Error('STUDIOTJ_ADMIN_EMAIL is not set')
  return admin
}

export async function sendOrderReceived(to: string, props: OrderReceivedProps) {
  return getResend().emails.send({
    from: getFromAddress(),
    to,
    subject: `Your StudioTJ order ${props.orderRef} is on its way`,
    html: await render(OrderReceived(props)),
  })
}

export async function sendOrderShipped(to: string, props: OrderShippedProps) {
  return getResend().emails.send({
    from: getFromAddress(),
    to,
    subject: `Your StudioTJ order ${props.orderRef} has shipped`,
    html: await render(OrderShipped(props)),
  })
}

export async function sendAdminAlert({ subject, body }: { subject: string; body: string }) {
  return getResend().emails.send({
    from: getFromAddress(),
    to: getAdminEmail(),
    subject,
    text: body,
  })
}

export async function sendOrderNeedsAttention(props: OrderNeedsAttentionProps) {
  return getResend().emails.send({
    from: getFromAddress(),
    to: getAdminEmail(),
    subject: `[StudioTJ] Order ${props.stripeSessionId.slice(-8)} needs attention — Prodigi ${props.prodigiErrorStatus}`,
    html: await render(OrderNeedsAttention(props)),
  })
}
