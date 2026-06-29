'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/authStore'
import { fetchCart, logoutUser } from '@/lib/api'
import { Diamond, Shirt } from 'lucide-react'

// ─── Dropdown ─────────────────────────────────────────────────────────────────

function Dropdown({
  label,
  items,
}: {
  label: React.ReactNode
  items: { href?: string; label: string; onClick?: () => void; danger?: boolean }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-gray-700 hover:text-brand-purple font-medium transition-colors text-sm"
      >
        {label}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {items.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}`}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={() => { item.onClick?.(); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}`}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ─── Cart icon with badge ─────────────────────────────────────────────────────

function CartIcon({ count }: { count: number }) {
  return (
    <Link href="/cart" className="relative p-1.5 text-gray-600 hover:text-brand-purple transition-colors">
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-saffron text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

// ─── Auth section skeleton (shown during hydration) ──────────────────────────

function AuthSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 h-5 bg-gray-100 rounded animate-pulse" />
      <div className="w-24 h-8 bg-gray-100 rounded-lg animate-pulse" />
    </div>
  )
}

// ─── Role-specific auth sections ─────────────────────────────────────────────

function BuyerNav({ onLogout }: { onLogout: () => void }) {
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    staleTime: 30_000,
  })
  const itemCount = cart?.itemCount ?? 0

  return (
    <div className="flex items-center gap-3">
      <Link href="/orders" className="text-gray-600 hover:text-brand-purple font-medium text-sm transition-colors">
        My Orders
      </Link>
      <CartIcon count={itemCount} />
      <Dropdown
        label={
          <span className="w-8 h-8 rounded-full bg-brand-purple text-white flex items-center justify-center text-sm font-bold">
            B
          </span>
        }
        items={[
          { href: '/orders',    label: 'My Orders' },
          { href: '/following', label: 'Following' },
          { label: 'Logout', onClick: onLogout, danger: true },
        ]}
      />
    </div>
  )
}

function VendorNav({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <Link href="/vendor/dashboard" className="text-gray-600 hover:text-brand-purple font-medium text-sm transition-colors">
        Dashboard
      </Link>
      <Link href="/vendor/store" className="text-gray-600 hover:text-brand-purple font-medium text-sm transition-colors">
        My Store
      </Link>
      <Dropdown
        label={
          <span className="w-8 h-8 rounded-full bg-brand-saffron text-white flex items-center justify-center text-sm font-bold">
            V
          </span>
        }
        items={[
          { href: '/vendor/dashboard', label: 'Vendor Dashboard' },
          { href: '/vendor/store',     label: 'My Store' },
          { href: '/vendor/products',  label: 'My Products' },
          { label: 'Logout', onClick: onLogout, danger: true },
        ]}
      />
    </div>
  )
}

function AdminNav({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <Link href="/admin" className="text-gray-600 hover:text-brand-purple font-medium text-sm transition-colors">
        Admin Panel
      </Link>
      <Dropdown
        label={
          <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold">
            A
          </span>
        }
        items={[
          { href: '/admin', label: 'Admin Dashboard' },
          { label: 'Logout', onClick: onLogout, danger: true },
        ]}
      />
    </div>
  )
}

// ─── Mobile menu auth links ───────────────────────────────────────────────────

function MobileAuthLinks({
  role,
  onLogout,
  onClose,
}: {
  role: string | undefined
  onLogout: () => void
  onClose: () => void
}) {
  if (role === 'BUYER') return (
    <>
      <Link href="/orders"    className="block py-2 text-gray-700 font-medium" onClick={onClose}>My Orders</Link>
      <Link href="/cart"      className="block py-2 text-gray-700 font-medium" onClick={onClose}>Cart</Link>
      <Link href="/following" className="block py-2 text-gray-700 font-medium" onClick={onClose}>Following</Link>
      <button onClick={() => { onLogout(); onClose() }} className="block py-2 text-red-600 font-medium w-full text-left">Logout</button>
    </>
  )
  if (role === 'VENDOR') return (
    <>
      <Link href="/vendor/dashboard" className="block py-2 text-gray-700 font-medium" onClick={onClose}>Dashboard</Link>
      <Link href="/vendor/store"     className="block py-2 text-gray-700 font-medium" onClick={onClose}>My Store</Link>
      <Link href="/vendor/products"  className="block py-2 text-gray-700 font-medium" onClick={onClose}>My Products</Link>
      <button onClick={() => { onLogout(); onClose() }} className="block py-2 text-red-600 font-medium w-full text-left">Logout</button>
    </>
  )
  if (role === 'ADMIN') return (
    <>
      <Link href="/admin" className="block py-2 text-gray-700 font-medium" onClick={onClose}>Admin Dashboard</Link>
      <button onClick={() => { onLogout(); onClose() }} className="block py-2 text-red-600 font-medium w-full text-left">Logout</button>
    </>
  )
  return (
    <>
      <Link href="/auth/login"    className="block py-2 text-brand-purple font-medium" onClick={onClose}>Log in</Link>
      <Link href="/auth/register" className="block py-2 text-brand-saffron font-medium" onClick={onClose}>Start Selling</Link>
    </>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  // Hydration guard: Zustand persist rehydrates on the client only.
  // We show a skeleton until we've confirmed the store is hydrated.
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  const { isAuthenticated, user, refreshToken, logout } = useAuthStore()
  const router = useRouter()

  async function handleLogout() {
    try {
      if (refreshToken) await logoutUser(refreshToken)
    } catch {
      // best-effort — clear state regardless
    }
    logout()
    router.push('/')
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const trimmed = searchValue.trim()
      if (!trimmed) return
      router.push(`/products?search=${encodeURIComponent(trimmed)}`)
    }
  }

  const role = user?.role // 'BUYER' | 'VENDOR' | 'ADMIN' | undefined

  return (
    <>
      {/* Announcement marquee bar */}
      <div className="bg-[#1a0a3c] overflow-hidden py-1.5">
        <style jsx>{`
          @keyframes scroll-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div className="whitespace-nowrap overflow-hidden">
          <div
            className="inline-block"
            style={{ animation: 'scroll-marquee 28s linear infinite' }}
          >
            <span className="text-brand-saffron text-xs font-bold tracking-wide px-8 inline-flex items-center gap-1.5">
              FREE SHIPPING ON ORDERS ABOVE ₹999 • COD AVAILABLE PAN INDIA <Diamond size={10} className="text-brand-saffron flex-shrink-0" /> NEW DROPS EVERY FRIDAY <Diamond size={10} className="text-brand-saffron flex-shrink-0" />
            </span>
            <span className="text-brand-saffron text-xs font-bold tracking-wide px-8 inline-flex items-center gap-1.5">
              FREE SHIPPING ON ORDERS ABOVE ₹999 • COD AVAILABLE PAN INDIA <Diamond size={10} className="text-brand-saffron flex-shrink-0" /> NEW DROPS EVERY FRIDAY <Diamond size={10} className="text-brand-saffron flex-shrink-0" />
            </span>
          </div>
        </div>
      </div>

      <nav
        className="bg-brand-cream sticky top-0 z-50"
        style={{ borderBottom: '3px solid #1a0a3c' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="font-heading text-2xl font-bold text-brand-purple flex-shrink-0 flex items-center gap-2">
              <Shirt size={24} /> ThriftBazaar
            </Link>

            {/* Desktop centre links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/products" className="text-gray-600 hover:text-brand-purple font-medium transition-colors">
                Browse
              </Link>
              <Link href="/stores" className="text-gray-600 hover:text-brand-purple font-medium transition-colors">
                Stores
              </Link>
            </div>

            {/* Search input */}
            <div className="hidden md:block">
              <input
                type="text"
                placeholder="Search finds…"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pixel-input px-3 py-1.5 text-sm w-40 lg:w-56"
              />
            </div>

            {/* Desktop auth section */}
            <div className="hidden md:flex items-center gap-3">
              {!hydrated ? (
                <AuthSkeleton />
              ) : !isAuthenticated ? (
                <>
                  <Link href="/auth/login" className="text-brand-purple font-medium hover:underline text-sm">
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-brand-purple text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-800 transition-colors text-sm"
                  >
                    Start Selling
                  </Link>
                </>
              ) : role === 'BUYER' ? (
                <BuyerNav onLogout={handleLogout} />
              ) : role === 'VENDOR' ? (
                <VendorNav onLogout={handleLogout} />
              ) : role === 'ADMIN' ? (
                <AdminNav onLogout={handleLogout} />
              ) : null}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
              <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
              <span className="block w-5 h-0.5 bg-gray-700" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#1a0a3c] bg-brand-cream px-4 pb-4 pt-2 space-y-1">
            <Link href="/products" className="block py-2 text-gray-700 font-medium" onClick={() => setMobileOpen(false)}>
              Browse
            </Link>
            <Link href="/stores" className="block py-2 text-gray-700 font-medium" onClick={() => setMobileOpen(false)}>
              Stores
            </Link>
            <div className="border-t border-gray-100 pt-2 mt-2">
              {!hydrated ? (
                <div className="py-2 space-y-2">
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                </div>
              ) : (
                <MobileAuthLinks
                  role={isAuthenticated ? role : undefined}
                  onLogout={handleLogout}
                  onClose={() => setMobileOpen(false)}
                />
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
