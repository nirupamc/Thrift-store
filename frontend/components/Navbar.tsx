'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/lib/authStore'
import { fetchCart, logoutUser } from '@/lib/api'
import { Diamond, Shirt, ShoppingCart } from 'lucide-react'
import { useCartStore, selectCartCount } from '@/lib/cartStore'

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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 origin-top-right"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Cart icon with badge ─────────────────────────────────────────────────────

function CartIcon({ count }: { count: number }) {
  return (
    <Link href="/cart" className="relative p-1.5 text-gray-600 hover:text-brand-purple transition-colors">
      <ShoppingCart size={22} strokeWidth={1.8} />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-brand-saffron text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none"
            style={{ border: '2px solid #2C2A28', boxShadow: '1px 1px 0 #2C2A28' }}
          >
            {count > 99 ? '99+' : count}
          </motion.span>
        )}
      </AnimatePresence>
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
  const setCount = useCartStore((s) => s.setCount)
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (cart) setCount(cart.itemCount)
  }, [cart, setCount])

  return (
    <div className="flex items-center gap-3">
      <Link href="/orders" className="text-gray-600 hover:text-brand-purple font-medium text-sm transition-colors">
        My Orders
      </Link>
      <Dropdown
        label={
          <span className="w-8 h-8 rounded-full bg-brand-purple text-white flex items-center justify-center text-sm font-bold">
            B
          </span>
        }
        items={[
          { href: '/account',   label: 'My Account' },
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
      <Link href="/account"   className="block py-2 text-gray-700 font-medium" onClick={onClose}>My Account</Link>
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
  const cartCount = useCartStore(selectCartCount)
  const resetCart = useCartStore((s) => s.reset)
  const router = useRouter()

  async function handleLogout() {
    try {
      if (refreshToken) await logoutUser(refreshToken)
    } catch {
      // best-effort — clear state regardless
    }
    resetCart()
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
      <div className="bg-[#2C2A28] overflow-hidden py-1.5">
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
        style={{ borderBottom: '3px solid #2C2A28' }}
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

            {/* Global cart icon — always visible */}
            <div className="hidden md:block">
              <CartIcon count={cartCount} />
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
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="md:hidden border-t border-[#2C2A28] bg-brand-cream px-4 pb-4 pt-2 space-y-1 overflow-hidden"
            >
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
              >
                {[
                  <Link key="browse" href="/products" className="block py-2 text-gray-700 font-medium" onClick={() => setMobileOpen(false)}>Browse</Link>,
                  <Link key="stores" href="/stores" className="block py-2 text-gray-700 font-medium" onClick={() => setMobileOpen(false)}>Stores</Link>,
                ].map((el, i) => (
                  <motion.div
                    key={i}
                    variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0, transition: { duration: 0.2 } } }}
                  >
                    {el}
                  </motion.div>
                ))}
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  )
}
