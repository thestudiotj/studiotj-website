import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { CartProvider } from '@/lib/cart'
import CartDrawer from '@/components/CartDrawer'

export const metadataBase = new URL('https://studiotj.com')

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: 'StudioTJ',
    template: '%s · StudioTJ',
  },
  description: 'StudioTJ is a one-person studio — photography across four collections, a print shop, a journal, and essays at The Subtext Lab.',
  openGraph: {
    siteName: 'StudioTJ',
    type: 'website',
    description: 'StudioTJ is a one-person studio — photography across four collections, a print shop, a journal, and essays at The Subtext Lab.',
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
    <html lang="en">
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
