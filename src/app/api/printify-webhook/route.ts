import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = process.env.PRINTIFY_WEBHOOK_SECRET
  if (!secret || req.nextUrl.searchParams.get('token') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)

  console.log('Printify webhook received:', JSON.stringify(body))

  if (body?.type === 'product:publish:started') {
    const productId = body.resource?.id ?? body.product_id
    const shopId = process.env.PRINTIFY_SHOP_ID
    const token = process.env.PRINTIFY_API_TOKEN

    if (productId && shopId && token) {
      const url = `https://api.printify.com/v1/shops/${shopId}/products/${productId}/publishing_succeeded.json`
      const result = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          external: {
            id: productId,
            handle: `https://www.studiotj.com/shop/${productId}`,
          },
        }),
      })
      console.log('publishing_succeeded response:', result.status)
    } else {
      console.warn('product:publish:started — missing productId, PRINTIFY_SHOP_ID, or PRINTIFY_API_TOKEN')
    }
  }

  // Printify expects { "type": "success" } to confirm receipt
  return NextResponse.json({ type: 'success' })
}
