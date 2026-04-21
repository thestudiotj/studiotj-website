import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  const secret = process.env.PRINTIFY_WEBHOOK_SECRET
  if (!secret || req.nextUrl.searchParams.get('token') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const event = body?.type

  console.log('[printify-webhook] received', event)

  if (event === 'product:publish:started') {
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

  if (event === 'product:deleted') {
    const productId = body.resource?.id ?? body.product_id
    const shopId = body.resource?.data?.shop_id ?? process.env.PRINTIFY_SHOP_ID
    const token = process.env.PRINTIFY_API_TOKEN

    if (!productId || !shopId || !token) {
      console.error('[printify-webhook] product:deleted missing ids', { productId, shopId })
      return NextResponse.json({ type: 'success' })
    }

    try {
      const resp = await fetch(
        `https://api.printify.com/v1/shops/${shopId}/products/${productId}/unpublish.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
        }
      )
      if (resp.ok) {
        console.log('[printify-webhook] unpublish cleared', { productId })
      } else {
        console.error('[printify-webhook] unpublish call failed', {
          productId,
          status: resp.status,
          body: await resp.text(),
        })
      }
    } catch (err) {
      console.error('[printify-webhook] unpublish threw', { productId, err })
    }

    revalidatePath('/shop')
    revalidatePath(`/shop/${productId}`)
  }

  // Printify expects { "type": "success" } to confirm receipt
  return NextResponse.json({ type: 'success' })
}
