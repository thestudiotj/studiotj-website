import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  console.log('Printify webhook received:', JSON.stringify(body))

  // Printify expects { "type": "success" } to confirm receipt
  return NextResponse.json({ type: 'success' })
}
