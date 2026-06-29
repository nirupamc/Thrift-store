'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { fetchOrder } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import type { OrderStatus, PaymentStatus } from '@/lib/types'
import { ChevronLeft, Check, Package, Phone } from 'lucide-react'

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

const STATUS_STEPS: OrderStatus[] = ['CONFIRMED', 'SHIPPED', 'DELIVERED']

function StatusTracker({ status }: { status: OrderStatus }) {
  if (status === 'PENDING' || status === 'CANCELLED') return null

  const currentIdx = STATUS_STEPS.indexOf(status)

  return (
    <div className="flex items-center gap-0 mb-4">
      {STATUS_STEPS.map((step, i) => {
        const done    = i <= currentIdx
        const current = i === currentIdx
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className={`flex flex-col items-center ${i < STATUS_STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className={`w-9 h-9 flex items-center justify-center text-xs font-bold transition-colors ${
                done
                  ? 'bg-brand-purple text-white pixel-border'
                  : 'bg-white pixel-border-sm text-gray-400'
              } ${current ? 'ring-2 ring-brand-purple ring-offset-2' : ''}`}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-xs mt-1 font-medium ${done ? 'text-brand-purple' : 'text-gray-400'}`}>
                {step.charAt(0) + step.slice(1).toLowerCase()}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 text-center text-lg mb-4 mx-1 leading-none font-bold ${i < currentIdx ? 'text-brand-purple' : 'text-gray-300'}`}>
                ──
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { isAuthenticated, hydrated } = useRequireAuth()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: isAuthenticated && !!orderId,
  })

  if (!hydrated) return null
  if (!isAuthenticated) return <div className="min-h-screen flex items-center justify-center text-gray-400">Redirecting...</div>

  if (isLoading) {
    return (
      <div className="bg-brand-cream min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="bg-brand-cream min-h-screen py-20 text-center">
        <div className="mb-3"><Package size={48} className="mx-auto text-gray-300" /></div>
        <p className="text-lg font-bold uppercase text-gray-700">Order not found</p>
        <Link href="/orders" className="text-brand-purple hover:underline mt-2 block">Back to orders</Link>
      </div>
    )
  }

  const shipping = order.shippingSnapshot as Record<string, string> | undefined

  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Header */}
        <div>
          <Link href="/orders" className="text-sm text-gray-400 hover:text-brand-purple flex items-center gap-1 w-fit">
            <ChevronLeft size={14} /> Back to orders
          </Link>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <h1 className="font-heading text-2xl font-bold text-gray-900 uppercase font-mono">
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 text-sm font-bold pixel-border-sm ${ORDER_STATUS_STYLES[order.status]}`}>
              {order.status}
            </span>
            <span className={`inline-flex items-center px-3 py-1 text-sm font-bold pixel-border-sm ${PAYMENT_STATUS_STYLES[order.payment.status]}`}>
              {order.payment.status}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Sub-orders by vendor */}
        {order.subOrders.map((subOrder) => (
          <div key={subOrder.id} className="pixel-card overflow-hidden">
            {/* Vendor header */}
            <div className="pixel-section-header px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-brand-cream">{subOrder.vendor.displayName}</p>
                <span className={`px-2.5 py-0.5 text-xs font-bold pixel-border-sm ${ORDER_STATUS_STYLES[subOrder.status]}`}>
                  {subOrder.status}
                </span>
              </div>
            </div>

            {/* Status tracker */}
            <div className="px-5 pt-5">
              <StatusTracker status={subOrder.status} />
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-100">
              {subOrder.items?.map((item) => {
                const snap = item.snapshot
                const img  = snap?.image ?? item.product?.images?.[0]
                return (
                  <div key={item.id} className="flex gap-4 px-5 py-4">
                    <div className="relative w-16 h-16 flex-shrink-0 pixel-border-sm overflow-hidden bg-gray-100">
                      {img ? (
                        <Image src={img} alt={snap?.title ?? item.product.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm line-clamp-2">
                        {snap?.title ?? item.product.title}
                      </p>
                      {snap?.brand && <p className="text-xs text-gray-400 mt-0.5">{snap.brand}</p>}
                      {snap?.condition && (
                        <p className="text-xs text-gray-400 capitalize">
                          {snap.condition.replace('_', ' ').toLowerCase()}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-brand-purple">{formatPrice(Number(item.unitPrice))}</p>
                      <p className="text-xs text-gray-400">× {item.quantity}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Subtotal */}
            <div className="px-5 py-3 bg-gray-50 border-t-2 border-gray-200 flex justify-between text-sm">
              <span className="text-gray-600">Sub-order total</span>
              <span className="font-bold text-brand-saffron">{formatPrice(Number(subOrder.subtotal))}</span>
            </div>
          </div>
        ))}

        {/* Payment summary */}
        <div className="pixel-card p-5">
          <h2 className="font-bold text-gray-900 mb-4 uppercase tracking-wide">Payment Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span>{formatPrice(Number(order.totalAmount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid</span>
              <span>{formatPrice(Number(order.finalAmount))}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-gray-200 font-bold">
              <span>Status</span>
              <span className={`px-2.5 py-0.5 text-xs font-bold pixel-border-sm ${PAYMENT_STATUS_STYLES[order.payment.status]}`}>
                {order.payment.status}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        {shipping && (
          <div className="pixel-card p-5">
            <h2 className="font-bold text-gray-900 mb-3 uppercase tracking-wide">Delivery Address</h2>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-medium text-gray-900">{shipping.name}</p>
              <p>{shipping.line1}</p>
              {shipping.line2 && <p>{shipping.line2}</p>}
              <p>{shipping.city}, {shipping.state} – {shipping.pincode}</p>
              <p className="text-gray-400 flex items-center gap-1"><Phone size={12} /> +91 {shipping.phone}</p>
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="pixel-card p-5 bg-brand-cream">
            <h2 className="font-bold text-gray-900 mb-1 text-sm uppercase tracking-wide">Delivery Notes</h2>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
