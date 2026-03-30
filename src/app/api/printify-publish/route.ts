import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = process.env.PRINTIFY_PUBLISH_SECRET
  if (!secret || req.headers.get('x-admin-token') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let product_id: string

  try {
    const body = await req.json()
    product_id = String(body.product_id ?? '')
    if (!product_id) throw new Error()
  } catch {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
  }

  const token = process.env.PRINTIFY_API_TOKEN
  const shopId = process.env.PRINTIFY_SHOP_ID

  if (!token || !shopId) {
    return NextResponse.json({ error: 'Printify env vars not configured' }, { status: 500 })
  }

  const res = await fetch(
    `https://api.printify.com/v1/shops/${shopId}/products/${product_id}/publish.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: true,
        description: true,
        images: true,
        variants: true,
        tags: true,
        keyFeatures: true,
        shipping_template: true,
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return NextResponse.json({ error: `Printify ${res.status}: ${text}` }, { status: res.status })
  }

  return NextResponse.json({ success: true, product_id })
}
