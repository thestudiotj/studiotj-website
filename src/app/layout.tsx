import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { CartProvider } from '@/lib/cart'
import CartDrawer from '@/components/CartDrawer'

export const metadata: Metadata = {
  title: {
    default: 'StudioTJ — Photography',
    template: '%s | StudioTJ',
  },
  description: 'StudioTJ is a one-person studio — photography across four collections, a print shop, a journal, and essays at The Subtext Lab.',
  openGraph: {
    siteName: 'StudioTJ',
    type: 'website',
    description: 'StudioTJ is a one-person studio — photography across four collections, a print shop, a journal, and essays at The Subtext Lab.',
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
