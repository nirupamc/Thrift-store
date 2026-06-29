'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAdminPayouts, markPayoutPaid } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { AdminPayout } from '@/lib/types'

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID:    'bg-green-100 text-green-800',
  FAILED:  'bg-red-100 text-red-800',
}

export default function AdminPayoutsPage() {
  const [page,   setPage]   = useState(1)
  const [status, setStatus] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payouts', page, status],
    queryFn:  () => fetchAdminPayouts({ page, limit: 20, status: status || undefined }),
  })

  const markPaidMutation = useMutation({
    mutationFn: markPayoutPaid,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['admin-payouts'] }),
  })

  const payouts: AdminPayout[] = data?.data ?? []

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide">PAYOUTS</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.meta.total ?? 0} payout records</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="pixel-input px-3 py-2 text-sm bg-white"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
        </select>
        {status && (
          <button onClick={() => { setStatus(''); setPage(1) }} className="pixel-btn-sm bg-white text-gray-500 text-xs">
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(6).fill(null).map((_, i) => <div key={i} className="h-16 bg-white animate-pulse pixel-border" />)}
        </div>
      ) : payouts.length === 0 ? (
        <div className="pixel-card p-12 text-center text-gray-400">No payouts found.</div>
      ) : (
        <>
          <div className="pixel-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-purple text-brand-cream uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Payout ID</th>
                    <th className="px-6 py-3 text-left">Vendor</th>
                    <th className="px-6 py-3 text-left">Store</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Period</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payouts.map((payout: AdminPayout) => {
                    const isMarking = markPaidMutation.isPending && markPaidMutation.variables === payout.id
                    return (
                      <tr key={payout.id} className="hover:bg-brand-cream/50">
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{payout.id.slice(-10)}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">{payout.vendorName ?? '—'}</td>
                        <td className="px-6 py-4 text-gray-600">{payout.storeName ?? '—'}</td>
                        <td className="px-6 py-4 font-semibold text-gray-800">{formatPrice(payout.amount)}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold uppercase px-2 py-0.5 ${STATUS_STYLES[payout.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs">
                          {payout.periodStart && payout.periodEnd
                            ? `${new Date(payout.periodStart).toLocaleDateString('en-IN')} – ${new Date(payout.periodEnd).toLocaleDateString('en-IN')}`
                            : new Date(payout.createdAt).toLocaleDateString('en-IN')
                          }
                        </td>
                        <td className="px-6 py-4">
                          {payout.status === 'PENDING' && (
                            <button
                              onClick={() => markPaidMutation.mutate(payout.id)}
                              disabled={isMarking}
                              className="pixel-btn-sm bg-green-500 text-white disabled:opacity-60"
                            >
                              {isMarking ? '…' : 'Mark Paid'}
                            </button>
                          )}
                          {payout.status === 'PAID' && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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
