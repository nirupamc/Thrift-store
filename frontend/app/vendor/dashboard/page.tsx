'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/lib/authStore'
import { fetchVendorStoreStats, fetchVendorOrders, fetchMyStore } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { animate } from 'framer-motion'
import { useInView } from 'framer-motion'
import { formatPrice } from '@/lib/utils'
import type { VendorSubOrder } from '@/lib/types'
import { BarChart2, IndianRupee, Package, Star, Users, Plus, Zap, Store, ClipboardList } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fadeUp, staggerContainer } from '@/components/motion/variants'

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPED:   'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

function StatCard({
  label, Icon, accent, numericValue, format,
}: {
  label: string
  Icon: LucideIcon
  accent: string
  numericValue: number
  format: (n: number) => string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(format(0))

  useEffect(() => {
    if (!isInView) return
    const controls = animate(0, numericValue, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(format(Math.round(v))),
    })
    return controls.stop
  }, [isInView, numericValue, format])

  return (
    <motion.div
      ref={ref}
      className="pixel-card flex items-start gap-4 p-6"
      style={{ borderLeft: `4px solid ${accent}` }}
      variants={fadeUp}
    >
      <div className="flex-shrink-0"><Icon size={28} /></div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{display}</p>
      </div>
    </motion.div>
  )
}

const QUICK_LINKS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/vendor/products/new', label: 'Add Product',   Icon: Plus },
  { href: '/vendor/orders',       label: 'View Orders',   Icon: Package },
  { href: '/vendor/drops',        label: 'Schedule Drop', Icon: Zap },
]

export default function VendorDashboardPage() {
  const { vendorStoreId, setVendorStoreId, user } = useAuthStore()

  const { data: myStore } = useQuery({
    queryKey: ['my-store-lookup'],
    queryFn: fetchMyStore,
    enabled: !vendorStoreId && user?.role === 'VENDOR',
    staleTime: Infinity,
  })

  useEffect(() => {
    if (myStore?.id) setVendorStoreId(myStore.id)
  }, [myStore?.id, setVendorStoreId])

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['vendor-stats', vendorStoreId],
    queryFn:  () => fetchVendorStoreStats(vendorStoreId!),
    enabled:  !!vendorStoreId,
  })

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['vendor-orders', 1],
    queryFn:  () => fetchVendorOrders({ page: 1, limit: 10 }),
    enabled:  !!vendorStoreId,
  })

  if (!vendorStoreId) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <Store size={48} className="text-gray-400" />
        <h2 className="text-xl font-bold text-gray-800">You don&apos;t have a store yet</h2>
        <p className="text-gray-500 text-sm">Create your store to start selling.</p>
        <Link href="/vendor/store" className="pixel-btn bg-brand-purple text-white px-6 py-3 font-semibold">
          Create Store
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
        <motion.div variants={fadeUp}>
          <h1 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide flex items-center gap-2">
            <BarChart2 size={24} /> DASHBOARD
          </h1>
          <p className="text-brand-saffron text-sm font-bold mt-1 uppercase tracking-widest">Your store at a glance</p>
        </motion.div>
      </motion.div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(null).map((_, i) => (
            <div key={i} className="pixel-card p-6 h-24 shimmer" />
          ))}
        </div>
      ) : stats ? (
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <StatCard label="Total Revenue"  numericValue={stats.totalRevenue}    format={(n) => formatPrice(n)}                     Icon={IndianRupee} accent="#3B7A57" />
          <StatCard label="Items Sold"     numericValue={stats.totalItemsSold}  format={(n) => String(n)}                          Icon={Package}     accent="#C4683D" />
          <StatCard label="Avg Rating"     numericValue={stats.averageRating * 10} format={(n) => `${(n / 10).toFixed(1)} ★`}     Icon={Star}        accent="#D9B04A" />
          <StatCard label="Followers"      numericValue={stats.totalFollowers}  format={(n) => String(n)}                          Icon={Users}       accent="#5557CB" />
        </motion.div>
      ) : null}

      {/* Quick links */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {QUICK_LINKS.map((item) => (
          <motion.div key={item.href} variants={fadeUp}>
            <Link
              href={item.href}
              className="pixel-card p-5 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <item.Icon size={28} />
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{item.label}</span>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent orders */}
      <div className="pixel-card overflow-hidden">
        <div className="px-6 py-3 flex items-center justify-between" style={{ borderBottom: '3px solid #2C2A28', backgroundColor: '#3B7A57' }}>
          <h2 className="font-bold text-brand-cream uppercase tracking-widest text-sm flex items-center gap-1.5">
            <ClipboardList size={16} /> Recent Orders
          </h2>
          <Link href="/vendor/orders" className="text-xs text-brand-cream/80 hover:text-brand-cream font-bold">View all →</Link>
        </div>

        {ordersLoading ? (
          <div className="p-6 space-y-3">
            {Array(5).fill(null).map((_, i) => <div key={i} className="h-10 shimmer" />)}
          </div>
        ) : (ordersData?.data ?? []).length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-purple text-brand-cream uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">Order ID</th>
                  <th className="px-6 py-3 text-left">Items</th>
                  <th className="px-6 py-3 text-left">Total</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Date</th>
                </tr>
              </thead>
              <motion.tbody
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
              >
                {(ordersData?.data ?? []).map((sub: VendorSubOrder) => (
                  <motion.tr
                    key={sub.id}
                    className="hover:bg-brand-cream/50"
                    style={{ borderBottom: '1px solid rgba(44,42,40,0.15)' }}
                    variants={fadeUp}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{sub.id.slice(-8)}</td>
                    <td className="px-6 py-4">{sub.items.length} item{sub.items.length !== 1 ? 's' : ''}</td>
                    <td className="px-6 py-4 font-bold text-brand-purple">{formatPrice(sub.subtotal)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold ${STATUS_STYLES[sub.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{new Date(sub.createdAt).toLocaleDateString('en-IN')}</td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
