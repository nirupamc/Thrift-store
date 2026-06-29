'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAdminOrders } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { AdminOrder } from '@/lib/types'

const STATUSES = ['PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED']

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPED:   'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function AdminOrdersPage() {
  const [page,     setPage]     = useState(1)
  const [status,   setStatus]   = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status, dateFrom, dateTo],
    queryFn:  () => fetchAdminOrders({
      page,
      limit: 20,
      status:   status   || undefined,
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
    }),
  })

  const orders: AdminOrder[] = data?.data ?? []

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide">ORDERS</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.meta.total ?? 0} orders on the platform</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="pixel-input px-3 py-2 text-sm bg-white"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-bold uppercase">From</label>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="pixel-input px-3 py-2 text-sm bg-white" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-bold uppercase">To</label>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="pixel-input px-3 py-2 text-sm bg-white" />
        </div>
        {(status || dateFrom || dateTo) && (
          <button
            onClick={() => { setStatus(''); setDateFrom(''); setDateTo(''); setPage(1) }}
            className="pixel-btn-sm bg-white text-gray-500 text-xs"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(6).fill(null).map((_, i) => <div key={i} className="h-16 bg-white animate-pulse pixel-border" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="pixel-card p-12 text-center text-gray-400">No orders found.</div>
      ) : (
        <>
          <div className="pixel-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-purple text-brand-cream uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Order ID</th>
                    <th className="px-6 py-3 text-left">Buyer</th>
                    <th className="px-6 py-3 text-left">Total</th>
                    <th className="px-6 py-3 text-left">Items</th>
                    <th className="px-6 py-3 text-left">Payment</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order: AdminOrder) => (
                    <tr key={order.id} className="hover:bg-brand-cream/50">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{order.id.slice(-10)}</td>
                      <td className="px-6 py-4 text-gray-700">{order.buyerName ?? '—'}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{formatPrice(order.totalAmount)}</td>
                      <td className="px-6 py-4 text-gray-500">{order.itemCount ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : order.paymentStatus === 'FAILED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {order.paymentStatus ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(data?.meta.totalPages ?? 1) > 1 && (
            <div className="flex justify-center gap-3">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data?.meta.hasPrevPage} className="pixel-btn text-sm disabled:opacity-40">← Prev</button>
              <span className="px-4 py-2 text-sm text-gray-500">Page {data?.meta.page} of {data?.meta.totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={!data?.meta.hasNextPage} className="pixel-btn text-sm disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
