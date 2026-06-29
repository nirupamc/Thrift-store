'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { MessageSquare, Sparkles, Heart } from 'lucide-react'

export function Footer() {
  const [xpOpen, setXpOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setXpOpen(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <footer className="bg-[#1a0a3c] text-brand-cream">
        {/* Main grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Shop */}
            <div>
              <p className="text-brand-saffron font-bold uppercase text-xs tracking-widest mb-3">Shop</p>
              <Link href="/products" className="text-brand-cream/70 hover:text-brand-cream text-sm block py-0.5 transition-colors">
                Browse Products
              </Link>
              <Link href="/stores" className="text-brand-cream/70 hover:text-brand-cream text-sm block py-0.5 transition-colors">
                Discover Stores
              </Link>
              <Link href="/products?sortBy=createdAt" className="text-brand-cream/70 hover:text-brand-cream text-sm block py-0.5 transition-colors">
                New Arrivals
              </Link>
            </div>

            {/* Sell */}
            <div>
              <p className="text-brand-saffron font-bold uppercase text-xs tracking-widest mb-3">Sell</p>
              <Link href="/auth/register" className="text-brand-cream/70 hover:text-brand-cream text-sm block py-0.5 transition-colors">
                Start Selling
              </Link>
              <Link href="/vendor/dashboard" className="text-brand-cream/70 hover:text-brand-cream text-sm block py-0.5 transition-colors">
                Vendor Dashboard
              </Link>
              <Link href="#" className="text-brand-cream/70 hover:text-brand-cream text-sm block py-0.5 transition-colors">
                How it Works
              </Link>
            </div>

            {/* Support */}
            <div>
              <p className="text-brand-saffron font-bold uppercase text-xs tracking-widest mb-3">Support</p>
              <Link href="#" className="text-brand-cream/70 hover:text-brand-cream text-sm block py-0.5 transition-colors">
                FAQs
              </Link>
              <Link href="#" className="text-brand-cream/70 hover:text-brand-cream text-sm block py-0.5 transition-colors">
                Contact Us
              </Link>
              <Link href="#" className="text-brand-cream/70 hover:text-brand-cream text-sm block py-0.5 transition-colors">
                Returns Policy
              </Link>
            </div>

            {/* About */}
            <div>
              <p className="text-brand-saffron font-bold uppercase text-xs tracking-widest mb-3">About</p>
              <Link href="#" className="text-brand-cream/70 hover:text-brand-cream text-sm block py-0.5 transition-colors">
                Our Story
              </Link>
              <Link href="#" className="text-brand-cream/70 hover:text-brand-cream text-sm block py-0.5 transition-colors">
                Blog
              </Link>
              <Link href="#" className="text-brand-cream/70 hover:text-brand-cream text-sm block py-0.5 transition-colors">
                Careers
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-brand-cream/60 text-xs">
              © 2024 ThriftBazaar. Made with <Heart size={12} className="inline fill-current mx-0.5" /> in India.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-brand-saffron text-xs hover:text-brand-saffron/80 transition-colors">
                Instagram
              </Link>
              <Link href="#" className="text-brand-saffron text-xs hover:text-brand-saffron/80 transition-colors">
                Twitter
              </Link>
              <Link href="#" className="text-brand-saffron text-xs hover:text-brand-saffron/80 transition-colors">
                Facebook
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Windows XP popup */}
      {xpOpen && (
        <div className="fixed bottom-6 right-6 z-50 pixel-card max-w-xs w-72">
          {/* Title bar */}
          <div
            style={{ background: 'linear-gradient(to right, #2D1B69, #5B21B6)' }}
            className="flex items-center justify-between px-3 py-2"
          >
            <span className="text-white text-xs font-bold flex items-center gap-1.5"><MessageSquare size={12} /> ThriftBazaar.exe</span>
            <button
              onClick={() => setXpOpen(false)}
              className="text-white/70 hover:text-white text-sm leading-none"
            >
              ✕
            </button>
          </div>
          {/* Body */}
          <div className="bg-brand-cream p-5 text-sm text-gray-700 text-center">
            <p className="flex items-center justify-center gap-1">Good fits. Good vibes. Good karma. <Sparkles size={14} /></p>
            <button
              onClick={() => setXpOpen(false)}
              className="pixel-btn bg-white text-gray-800 font-bold px-6 py-1.5 text-xs mt-3 mx-auto block"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  )
}
