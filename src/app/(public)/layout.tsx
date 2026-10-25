import { SiteNavbar } from '@/components/site-navbar'
import { SiteFooter } from '@/components/site-footer'
import { CartProvider } from '@/components/cart-provider'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from 'next-auth/react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <SiteNavbar />
        <main className="min-h-screen">{children}</main>
        <SiteFooter />
        <Toaster position="top-right" />
      </CartProvider>
    </SessionProvider>
  )
}
