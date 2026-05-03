export const dynamic = 'force-static'

export function GET() {
  const content = [
    'User-agent: *',
    'Allow: /',
    '',
    'Sitemap: https://studiotj.com/sitemap.xml',
    'LLMs-Sitemap: https://studiotj.com/llms.txt',
  ].join('\n')

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
