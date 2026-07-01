import type { Metadata } from 'next'
import { Pixelify_Sans, Inter, VT323 } from 'next/font/google'
import { QueryProvider } from '@/providers/QueryProvider'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { LoadingScreen } from '@/components/motion/LoadingScreen'
import './globals.css'

const pixelifySans = Pixelify_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-heading',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

const vt323 = VT323({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "ThriftBazaar — India's Thrift Universe",
  description: 'Discover vintage, rare, and pre-loved fashion from India\'s best thrift stores.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pixelifySans.variable} ${inter.variable} ${vt323.variable}`}>
      <body className={inter.className}>
        <QueryProvider>
          <LoadingScreen />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  )
}
