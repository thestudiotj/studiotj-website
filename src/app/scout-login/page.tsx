import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scout — Login',
  robots: 'noindex, nofollow',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = params.next ?? '/scout';

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Scout</h1>
          <p className="text-sm text-white/40 mt-1">Enter password to continue</p>
        </div>
        <form action="/api/scout-login" method="POST" className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoFocus
            required
            className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/50"
          />
          <button
            type="submit"
            className="w-full min-h-[44px] rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
