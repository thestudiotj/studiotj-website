import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SCOUT_COOKIE, SCOUT_COOKIE_MAX_AGE, hashPassword } from '../../scout/lib/auth';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const passwordRaw = form.get('password');
  const password = typeof passwordRaw === 'string' ? passwordRaw : '';
  const nextRaw = form.get('next');
  const next = typeof nextRaw === 'string' ? nextRaw : '/scout';

  const expected = process.env.SCOUT_PASSWORD;
  if (!expected || password !== expected) {
    const loginUrl = new URL('/scout-login', req.url);
    loginUrl.searchParams.set('next', next);
    loginUrl.searchParams.set('error', '1');
    return NextResponse.redirect(loginUrl, 303);
  }

  const hash = await hashPassword(password);
  const res = NextResponse.redirect(new URL(next, req.url), 303);
  res.cookies.set(SCOUT_COOKIE, hash, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SCOUT_COOKIE_MAX_AGE,
    path: '/',
  });
  return res;
}
