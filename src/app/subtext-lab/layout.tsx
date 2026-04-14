import type { Metadata } from 'next'

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: 'https://photos.studiotj.com/og/subtext-lab-default.jpg',
        width: 1200,
        height: 630,
        alt: 'The Subtext Lab',
      },
    ],
  },
}

export default function SubtextLabLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-subtext">{children}</div>
}
