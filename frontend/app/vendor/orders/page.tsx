'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchVendorOrders, updateSubOrderStatus } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import type { VendorSubOrder } from '@/lib/types'
import { Package, Camera, MapPin, Phone } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPED:   'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const NEXT_STATUS: Record<string, { label: string; value: 'SHIPPED' | 'DELIVERED' }> = {
  CONFIRMED: { label: 'Mark Shipped',    value: 'SHIPPED' },
  SHIPPED:   { label: 'Mark Delivered',  value: 'DELIVERED' },
}

export default function VendorOrdersPage() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-orders-page', page],
    queryFn:  () => fetchVendorOrders({ page, limit: 15 }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ subOrderId, status }: { subOrderId: string; status: 'SHIPPED' | 'DELIVERED' }) =>
      updateSubOrderStatus(subOrderId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-orders-page'] }),
  })

  const orders: VendorSubOrder[] = data?.data ?? []

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-gray-900">Incoming Orders</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.meta.total ?? 0} sub-orders total</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(4).fill(null).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-40 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
          <div className="flex justify-center mb-3"><Package size={40} className="text-gray-300" /></div>
          <p className="text-gray-500 font-medium">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Orders will appear here when buyers purchase your items.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((sub) => {
            const nextStatus = NEXT_STATUS[sub.status]
            const isUpdating = statusMutation.isPending && statusMutation.variables?.subOrderId === sub.id

            return (
              <div key={sub.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-mono text-gray-500">#{sub.id.slice(-8)}</p>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[sub.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {sub.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-gray-800">{formatPrice(sub.subtotal)}</p>
                    <p className="text-xs text-gray-400">{new Date(sub.createdAt).toLocaleDateString('en-IN')}</p>
                    {nextStatus && (
                      <button
                        onClick={() => statusMutation.mutate({ subOrderId: sub.id, status: nextStatus.value })}
                        disabled={isUpdating}
                        className="bg-brand-purple text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-purple-800 transition-colors disabled:opacity-60"
                      >
                        {isUpdating ? '…' : nextStatus.label}
                      </button>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-50">
                  {sub.items.map((item) => {
                    const snap = item.snapshot
                    return (
                      <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {snap.images?.[0] ? (
                            <Image
                              src={snap.images[0]}
                              alt={snap.title}
                              width={56}
                              height={56}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Camera size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{snap.title}</p>
                          {snap.size  && <p className="text-xs text-gray-400">Size: {snap.size}</p>}
                          {snap.brand && <p className="text-xs text-gray-400">Brand: {snap.brand}</p>}
                        </div>
                        <p className="text-sm font-semibold text-gray-700 flex-shrink-0">{formatPrice(item.price)}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Shipping info */}
                {sub.shippingAddress && (
                  <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {[sub.shippingAddress.line1, sub.shippingAddress.city, sub.shippingAddress.state, sub.shippingAddress.pincode].filter(Boolean).join(', ')}
                    </span>
                    {sub.shippingAddress.phone && (
                      <> · <span className="inline-flex items-center gap-1"><Phone size={12} />{sub.shippingAddress.phone}</span></>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {(data?.meta.totalPages ?? 1) > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data?.meta.hasPrevPage}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Prev
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">
            Page {data?.meta.page} of {data?.meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data?.meta.hasNextPage}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
