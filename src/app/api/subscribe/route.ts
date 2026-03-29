// /app/api/subscribe/route.ts
// Handles email signups. Supports two providers:
//   - Resend Audiences (recommended — simpler, modern)
//   - Mailchimp (if you already have an account)
//
// Set ONE of these in .env.local:
//
// Option A — Resend:
//   RESEND_API_KEY=re_...
//   RESEND_AUDIENCE_ID=...   (from resend.com/audiences)
//
// Option B — Mailchimp:
//   MAILCHIMP_API_KEY=...
//   MAILCHIMP_SERVER_PREFIX=us1   (the bit before .api.mailchimp.com in your API URL)
//   MAILCHIMP_LIST_ID=...         (Audience ID from Mailchimp dashboard)

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // ── Option A: Resend ──────────────────────────────────────────────────────
  if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
    const res = await fetch(
      `https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      console.error('Resend error:', err)
      return NextResponse.json({ error: 'Could not subscribe. Try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  // ── Option B: Mailchimp ───────────────────────────────────────────────────
  if (
    process.env.MAILCHIMP_API_KEY &&
    process.env.MAILCHIMP_LIST_ID &&
    process.env.MAILCHIMP_SERVER_PREFIX
  ) {
    const url = `https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}/members`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        tags: ['studiotj-website'],
      }),
    })

    const data = await res.json()

    // Mailchimp returns 400 for already-subscribed, treat that as success
    if (!res.ok && data.title !== 'Member Exists') {
      console.error('Mailchimp error:', data)
      return NextResponse.json({ error: 'Could not subscribe. Try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  // ── No provider configured — dev/placeholder mode ─────────────────────────
  console.log(`[DEV] Email signup received: ${email}`)
  console.log('Configure RESEND_API_KEY or MAILCHIMP_API_KEY in .env.local to go live.')
  return NextResponse.json({ ok: true })
}
