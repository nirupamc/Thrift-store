'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRequireRole } from '@/hooks/useRequireRole'
import { BarChart2, Store, Shirt, Package, Zap, ArrowLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const NAV: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/vendor/dashboard', label: 'Dashboard', Icon: BarChart2 },
  { href: '/vendor/store',     label: 'My Store',  Icon: Store },
  { href: '/vendor/products',  label: 'Products',  Icon: Shirt },
  { href: '/vendor/orders',    label: 'Orders',    Icon: Package },
  { href: '/vendor/drops',     label: 'Drops',     Icon: Zap },
]

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { authorized, hydrated, user } = useRequireRole('VENDOR')

  if (!hydrated) return null

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <p>Redirecting…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-brand-cream">
      {/* Sidebar */}
      <aside className="w-56 bg-[#2C2A28] text-white flex-shrink-0 flex flex-col" style={{ borderRight: '3px solid #2C2A28' }}>
        <div className="px-5 py-6" style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs uppercase tracking-widest text-brand-saffron font-bold mb-1">VENDOR</p>
          <p className="font-heading font-bold text-lg leading-tight truncate text-brand-cream">
            {user?.vendor?.displayName ?? 'My Store'}
          </p>
        </div>

        <nav className="flex-1 py-4">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'border-l-4 border-brand-saffron text-brand-saffron bg-white/10'
                    : 'text-brand-cream/70 hover:bg-white/10 hover:text-brand-cream border-l-4 border-transparent'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4" style={{ borderTop: '2px solid rgba(255,255,255,0.1)' }}>
          <Link href="/" className="flex items-center gap-1.5 text-xs text-brand-cream/70 hover:text-brand-cream font-medium">
            <ArrowLeft size={14} /> Back to Store
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-brand-cream">{children}</main>
    </div>
  )
}
