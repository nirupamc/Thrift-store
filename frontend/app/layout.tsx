import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { QueryProvider } from '@/providers/QueryProvider'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "ThriftBazaar — India's Thrift Universe",
  description: 'Discover vintage, rare, and pre-loved fashion from India\'s best thrift stores.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.className}`}>
      <body>
        <QueryProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  )
}
