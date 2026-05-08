export const dynamic = 'force-static'

// No Disallow rules are set for legacy Shopify path prefixes (/products/*, /collections/*,
// /cart/*, /nl/*, /de/*, /policies/*, /password, /v1/*, /home.html, /pages/*,
// /services/login_with_shop/*, /customer_authentication/*, /88644583751/*).
// These paths are intentionally left crawlable so Google fetches them and receives the
// middleware-issued 410 Gone, triggering deindexing. — GSC audit, May 2026.
//
// Operational paths that warrant blocking (/api/*, /scout/*) should be added here as
// Disallow rules if they need to be protected from crawlers.
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
