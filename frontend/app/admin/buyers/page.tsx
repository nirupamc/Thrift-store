'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAdminBuyers, suspendBuyer } from '@/lib/api'
import type { AdminBuyer } from '@/lib/types'

export default function AdminBuyersPage() {
  const [page,   setPage]   = useState(1)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-buyers', page, search],
    queryFn:  () => fetchAdminBuyers({ page, limit: 20, search: search || undefined }),
  })

  const suspendMutation = useMutation({
    mutationFn: suspendBuyer,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['admin-buyers'] }),
  })

  const buyers: AdminBuyer[] = data?.data ?? []

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide">BUYERS</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.meta.total ?? 0} registered buyers</p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        placeholder="Search by name or email…"
        className="pixel-input w-full max-w-sm px-4 py-2.5 text-sm bg-white"
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array(6).fill(null).map((_, i) => <div key={i} className="h-16 bg-white animate-pulse pixel-border" />)}
        </div>
      ) : buyers.length === 0 ? (
        <div className="pixel-card p-12 text-center text-gray-400">No buyers found.</div>
      ) : (
        <>
          <div className="pixel-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-purple text-brand-cream uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Phone</th>
                    <th className="px-6 py-3 text-left">Orders</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Joined</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {buyers.map((b: AdminBuyer) => {
                    const isSuspending = suspendMutation.isPending && suspendMutation.variables === b.id
                    return (
                      <tr key={b.id} className="hover:bg-brand-cream/50">
                        <td className="px-6 py-4 font-medium text-gray-800">{b.displayName}</td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{b.email}</td>
                        <td className="px-6 py-4 text-gray-500">{b.phone ?? '—'}</td>
                        <td className="px-6 py-4 text-gray-700">{b.totalOrders ?? 0}</td>
                        <td className="px-6 py-4">
                          {b.isSuspended ? (
                            <span className="inline-block text-xs font-bold uppercase px-2 py-0.5 bg-red-100 text-red-700">
                              SUSPENDED
                            </span>
                          ) : (
                            <span className="inline-block text-xs font-bold uppercase px-2 py-0.5 bg-green-100 text-green-700">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs">{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-6 py-4">
                          {!b.isSuspended && (
                            <button
                              onClick={() => suspendMutation.mutate(b.id)}
                              disabled={isSuspending}
                              className="pixel-btn-sm bg-red-500 text-white disabled:opacity-60"
                            >
                              {isSuspending ? '…' : 'Suspend'}
                            </button>
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
