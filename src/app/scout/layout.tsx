import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Scout — StudioTJ',
  description: 'Photography scouting context builder',
  manifest: '/scout-manifest.webmanifest',
  robots: 'noindex, nofollow',
};

export const viewport: Viewport = {
  themeColor: '#18181b',
  width: 'device-width',
  initialScale: 1,
};

export default function ScoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Script id="sw-register" strategy="afterInteractive">{`
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js', { scope: '/scout' });
        }
      `}</Script>
    </>
  );
}
