'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminStats, fetchAdminOrders } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { AdminOrder } from '@/lib/types'
import type { LucideIcon } from 'lucide-react'
import { IndianRupee, Package, Store, ShoppingBag, Shirt, FolderOpen, CreditCard, BadgeCheck } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPED:   'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}


function StatCard({
  label,
  value,
  Icon,
  sub,
  borderClass,
}: {
  label: string
  value: string | number
  Icon: LucideIcon
  sub?: string
  borderClass: string
}) {
  return (
    <div className={`pixel-card p-5 ${borderClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <Icon size={28} className="text-gray-400" />
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  fetchAdminStats,
  })

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders-recent'],
    queryFn:  () => fetchAdminOrders({ page: 1, limit: 10 }),
  })

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide">
          ADMIN DASHBOARD
        </h1>
        <p className="text-gray-500 text-sm mt-1">ThriftBazaar admin dashboard</p>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(8).fill(null).map((_, i) => (
            <div key={i} className="pixel-card h-28 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue"    value={formatPrice(stats.totalRevenue)}  Icon={IndianRupee} borderClass="border-l-4 border-brand-purple" />
          <StatCard label="Total Orders"     value={stats.totalOrders}                Icon={Package}     borderClass="border-l-4 border-brand-saffron" />
          <StatCard label="Total Vendors"    value={stats.totalVendors}               Icon={Store}       borderClass="border-l-4 border-blue-500" sub={`${stats.pendingVendorApprovals} pending approval`} />
          <StatCard label="Total Buyers"     value={stats.totalBuyers}               Icon={ShoppingBag}  borderClass="border-l-4 border-green-500" />
          <StatCard label="Total Products"   value={stats.totalProducts}              Icon={Shirt}       borderClass="border-l-4 border-pink-500" />
          <StatCard label="Total Stores"     value={stats.totalStores}               Icon={FolderOpen}   borderClass="border-l-4 border-cyan-500" />
          <StatCard label="Pending Payouts"  value={stats.pendingPayouts}             Icon={CreditCard}  borderClass="border-l-4 border-orange-400" />
          <StatCard label="Total Items Sold" value={stats.totalItemsSold}             Icon={BadgeCheck}  borderClass="border-l-4 border-teal-500" />
        </div>
      ) : null}

      {/* Recent orders */}
      <div className="pixel-card overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-[#1a0a3c] flex items-center justify-between bg-white">
          <h2 className="font-bold text-gray-800 uppercase tracking-wide text-sm">Recent Orders</h2>
          <a href="/admin/orders" className="text-sm text-brand-purple hover:underline font-semibold">View all →</a>
        </div>

        {ordersLoading ? (
          <div className="p-6 space-y-3">
            {Array(5).fill(null).map((_, i) => <div key={i} className="h-10 bg-gray-100 animate-pulse" />)}
          </div>
        ) : (ordersData?.data ?? []).length === 0 ? (
          <div className="p-12 text-center text-gray-400">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-purple text-brand-cream uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">Order ID</th>
                  <th className="px-6 py-3 text-left">Buyer</th>
                  <th className="px-6 py-3 text-left">Total</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(ordersData?.data ?? []).map((order: AdminOrder) => (
                  <tr key={order.id} className="hover:bg-brand-cream/50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{order.id.slice(-10)}</td>
                    <td className="px-6 py-4 text-gray-700">{order.buyerName ?? '—'}</td>
                    <td className="px-6 py-4 font-semibold">{formatPrice(order.totalAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold uppercase ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
