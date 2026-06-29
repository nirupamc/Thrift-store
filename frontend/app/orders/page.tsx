'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { fetchOrders } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import type { OrderStatus, PaymentStatus } from '@/lib/types'
import { Package, ChevronRight } from 'lucide-react'

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:   'bg-yellow-400 text-black',
  CONFIRMED: 'bg-blue-400 text-black',
  SHIPPED:   'bg-brand-purple text-white',
  DELIVERED: 'bg-green-400 text-black',
  CANCELLED: 'bg-red-400 text-white',
}

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING:  'bg-yellow-300 text-black',
  PAID:     'bg-green-400 text-black',
  FAILED:   'bg-red-400 text-white',
  REFUNDED: 'bg-gray-300 text-gray-700',
}

export default function OrdersPage() {
  const { isAuthenticated, hydrated } = useRequireAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrders({ limit: 20 }),
    enabled: isAuthenticated,
  })

  if (!hydrated) return null

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Redirecting...</div>
  }

  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-8 uppercase tracking-wide">My Orders</h1>

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        )}

        {!isLoading && data?.data.length === 0 && (
          <div className="text-center py-20">
            <div className="mb-4"><Package size={64} className="mx-auto text-gray-300" /></div>
            <p className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-1">No orders yet</p>
            <p className="text-sm text-gray-500 mt-1 mb-6">Your orders will appear here once you make a purchase.</p>
            <Link
              href="/products"
              className="pixel-btn bg-brand-purple text-white font-bold px-8 py-3"
            >
              Start Shopping
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {data?.data.map((order) => {
            const vendorNames = order.subOrders.map((s) => s.vendor.displayName).join(', ')
            const itemCount   = order.subOrders.reduce((sum, s) => sum + (s._count?.items ?? 0), 0)

            return (
              <div key={order.id} className="pixel-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold pixel-border-sm ${ORDER_STATUS_STYLES[order.status]}`}>
                        {order.status}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold pixel-border-sm ${PAYMENT_STATUS_STYLES[order.payment.status]}`}>
                        {order.payment.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {vendorNames || 'Order'}
                      {' · '}
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                      {' · '}
                      {order.subOrders.length} vendor{order.subOrders.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      #{order.id.slice(-8).toUpperCase()} &middot;{' '}
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                    <p className="font-bold text-brand-saffron text-lg">{formatPrice(Number(order.totalAmount))}</p>
                    <Link
                      href={`/orders/${order.id}`}
                      className="pixel-btn-sm bg-brand-purple text-white font-bold px-3 py-1 text-xs"
                    >
                      <span className="flex items-center gap-1">View Details <ChevronRight size={12} /></span>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
