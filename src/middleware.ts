import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SCOUT_COOKIE, hashPassword } from './app/scout/lib/auth';

// GSC audit (May 2026, step 2): ~850+ URLs in "not indexed" buckets are Shopify
// migration debris. Returning 410 Gone signals permanent removal; Google deindexes
// 410s faster than 404s and stops recrawling, freeing crawl budget for real pages.
// Step 3 (May 2026): /products/* and /collections/* added — investigation confirmed
// neither path exists as a current or planned route (shop is at /shop); all requests
// were falling through to the Next.js default 404.
const SHOPIFY_LEGACY_PATTERNS: RegExp[] = [
  /^\/services\/login_with_shop(\/|$)/,
  /^\/customer_authentication(\/|$)/,
  /^\/cart(\/|$)/,
  /^\/policies(\/|$)/,
  /^\/password$/,
  /^\/v1(\/|$)/,
  /^\/home\.html$/,
  /^\/pages(\/|$)/,
  /^\/nl(\/|$)/,
  /^\/de(\/|$)/,
  /^\/88644583751(\/|$)/,
  /^\/products(\/|$)/,
  /^\/collections(\/|$)/,
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (SHOPIFY_LEGACY_PATTERNS.some(p => p.test(pathname))) {
    return new NextResponse(null, { status: 410 });
  }

  if (!pathname.startsWith('/scout')) return NextResponse.next();

  const password = process.env.SCOUT_PASSWORD;
  if (!password) return NextResponse.next();

  const expectedHash = await hashPassword(password);
  const cookie = req.cookies.get(SCOUT_COOKIE);

  if (cookie?.value === expectedHash) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/scout-login';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/scout',
    '/scout/:path*',
    '/services/login_with_shop',
    '/services/login_with_shop/:path*',
    '/customer_authentication',
    '/customer_authentication/:path*',
    '/cart',
    '/cart/:path*',
    '/policies',
    '/policies/:path*',
    '/password',
    '/v1',
    '/v1/:path*',
    '/home.html',
    '/pages',
    '/pages/:path*',
    '/nl',
    '/nl/:path*',
    '/de',
    '/de/:path*',
    '/88644583751',
    '/88644583751/:path*',
    '/products',
    '/products/:path*',
    '/collections',
    '/collections/:path*',
  ],
};
