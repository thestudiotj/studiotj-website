import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SCOUT_COOKIE, hashPassword } from './app/scout/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  matcher: ['/scout', '/scout/:path*'],
};
