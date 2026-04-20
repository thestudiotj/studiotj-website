export const SCOUT_COOKIE = 'scout-auth';
export const SCOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function hashPassword(pwd: string): Promise<string> {
  const data = new TextEncoder().encode(pwd);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return 'v1-' + Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
