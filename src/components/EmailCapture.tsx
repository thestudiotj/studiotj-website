'use client'

import { useState } from 'react'

interface EmailCaptureProps {
  variant?: 'light' | 'dark'
  headline?: string
  subline?: string
  incentive?: string
}

export default function EmailCapture({
  variant = 'dark',
  headline = 'Stay close to the work',
  subline = 'An occasional email when something new is ready. No schedule, no noise.',
  incentive,
}: EmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isDark = variant === 'dark'

  const bg = isDark ? 'bg-ink' : 'bg-paper'
  const text = isDark ? 'text-paper' : 'text-ink'
  const subText = isDark ? 'text-paper/70' : 'text-muted'
  const border = isDark ? 'border-paper/20' : 'border-ink/20'
  const inputBg = isDark ? 'bg-transparent border-paper/30 text-paper placeholder-paper/30 focus:border-paper' : 'bg-transparent border-ink/30 text-ink placeholder-ink/30 focus:border-ink'
  const btnBg = isDark ? 'bg-paper text-ink hover:bg-paper/80' : 'bg-ink text-paper hover:bg-accent'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }

      setStatus('success')
      setEmail('')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  return (
    <section className={`${bg} px-6 md:px-12 py-20 border-t ${border}`}>
      <div className="max-w-xl">
        {/* Cloud mark — subtle, ties to brand */}
        <div className={`mb-6 opacity-20 ${isDark ? 'text-paper' : 'text-ink'}`}>
          <svg width="48" height="28" viewBox="0 0 48 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M38 24H10C6.13 24 3 20.87 3 17C3 13.47 5.61 10.56 9.03 10.07C9.01 9.72 9 9.36 9 9C9 4.58 12.58 1 17 1C19.84 1 22.33 2.45 23.83 4.66C25.09 3.63 26.7 3 28.5 3C32.64 3 36 6.36 36 10.5C36 10.67 35.99 10.84 35.98 11.01C37.14 11.1 38.22 11.54 39.08 12.24C40.84 10.24 43.27 9 46 9V24H38Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 className={`font-display text-3xl md:text-4xl ${text} leading-tight mb-3`}>
          {headline}
        </h2>
        <p className={`${subText} leading-relaxed mb-2`}>{subline}</p>
        {incentive && (
          <p className={`text-xs tracking-wide ${isDark ? 'text-paper/70' : 'text-muted/70'} mb-8 italic`}>
            {incentive}
          </p>
        )}

        {status === 'success' ? (
          <div className={`border ${border} p-6`}>
            <p className={`font-display text-xl ${text} mb-1`}>You&apos;re on the list.</p>
            <p className={`${subText} text-sm`}>
              When there&apos;s something to send, it lands here first.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className={`flex-1 border px-4 py-3 text-sm outline-none transition-colors duration-200 ${inputBg}`}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className={`${btnBg} px-6 py-3 text-xs tracking-widest uppercase transition-colors duration-200 shrink-0 disabled:opacity-50`}
            >
              {status === 'loading' ? 'Joining…' : 'Join the list'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-red-400 text-xs mt-2">{errorMsg}</p>
        )}

        <p className={`text-xs ${isDark ? 'text-paper/50' : 'text-muted/50'} mt-4`}>
          No tracking. Unsubscribe any time. KvK-registered eenmanszaak.
        </p>
      </div>
    </section>
  )
}
