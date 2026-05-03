import { buildLlmsFullData, formatLlmsFullTxt } from '@/lib/llms'

export const dynamic = 'force-static'

export async function GET() {
  const sections = await buildLlmsFullData()
  const body = formatLlmsFullTxt(sections)
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
