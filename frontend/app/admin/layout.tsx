'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRequireRole } from '@/hooks/useRequireRole'
import { BarChart2, Store, ShoppingBag, Package, IndianRupee, Settings } from 'lucide-react'

const NAV = [
  { href: '/admin',           label: 'Dashboard', Icon: BarChart2,   exact: true },
  { href: '/admin/vendors',   label: 'Vendors',   Icon: Store },
  { href: '/admin/buyers',    label: 'Buyers',    Icon: ShoppingBag },
  { href: '/admin/orders',    label: 'Orders',    Icon: Package },
  { href: '/admin/payouts',   label: 'Payouts',   Icon: IndianRupee },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { authorized, hydrated } = useRequireRole('ADMIN')

  if (!hydrated) return null

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream text-gray-400">
        <p>Redirecting…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-brand-cream">
      <aside className="w-56 bg-[#1a0a3c] text-brand-cream flex-shrink-0 flex flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="text-brand-saffron font-bold text-sm uppercase tracking-widest flex items-center gap-2"><Settings size={18} /> ADMIN PANEL</p>
        </div>

        <nav className="flex-1 py-4">
          {NAV.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'border-l-4 border-brand-saffron text-brand-saffron bg-white/10'
                    : 'text-brand-cream/60 hover:bg-white/10 hover:text-brand-cream'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <Link href="/" className="text-xs text-brand-cream/40 hover:text-brand-cream">
            ← Public site
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-brand-cream">{children}</main>
    </div>
  )
}
