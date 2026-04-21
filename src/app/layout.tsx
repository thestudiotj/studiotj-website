import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import 'photoswipe/dist/photoswipe.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { CartProvider } from '@/lib/cart'
import CartDrawer from '@/components/CartDrawer'

const playfairDisplay = localFont({
  src: [
    {
      path: '../../public/fonts/playfair-display/playfair-display-latin-normal.woff2',
      weight: '400 900',
      style: 'normal',
    },
    {
      path: '../../public/fonts/playfair-display/playfair-display-latin-ext-normal.woff2',
      weight: '400 900',
      style: 'normal',
    },
    {
      path: '../../public/fonts/playfair-display/playfair-display-latin-italic.woff2',
      weight: '400 900',
      style: 'italic',
    },
    {
      path: '../../public/fonts/playfair-display/playfair-display-latin-ext-italic.woff2',
      weight: '400 900',
      style: 'italic',
    },
  ],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = localFont({
  src: [
    {
      path: '../../public/fonts/dm-sans/dm-sans-latin.woff2',
      weight: '300 500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/dm-sans/dm-sans-latin-ext.woff2',
      weight: '300 500',
      style: 'normal',
    },
  ],
  variable: '--font-body',
  display: 'swap',
})

const dmMono = localFont({
  src: [
    {
      path: '../../public/fonts/dm-mono/dm-mono-latin-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/dm-mono/dm-mono-latin-ext-400.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-mono',
  display: 'swap',
})

export const metadataBase = new URL('https://studiotj.com')

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: 'StudioTJ',
    template: '%s · StudioTJ',
  },
  description: 'StudioTJ is a one-person studio created by Tjeerd van der Heeft — photography, print, and writing. Four collections, a shop, and The Subtext Lab.',
  openGraph: {
    siteName: 'StudioTJ',
    type: 'website',
    description: 'StudioTJ is a one-person studio created by Tjeerd van der Heeft — photography, print, and writing. Four collections, a shop, and The Subtext Lab.',
    images: [
      {
        url: 'https://photos.studiotj.com/og/studiotj-default.jpg',
        width: 1200,
        height: 630,
        alt: 'StudioTJ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="bg-paper text-ink min-h-screen flex flex-col">
        <CartProvider>
          <Nav />
          <CartDrawer />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
