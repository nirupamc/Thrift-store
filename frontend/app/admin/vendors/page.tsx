'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAdminVendors, approveVendor, suspendVendor } from '@/lib/api'
import type { AdminVendor } from '@/lib/types'

export default function AdminVendorsPage() {
  const [page,   setPage]   = useState(1)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors', page, search],
    queryFn:  () => fetchAdminVendors({ page, limit: 20, search: search || undefined }),
  })

  const approveMutation = useMutation({
    mutationFn: approveVendor,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['admin-vendors'] }),
  })

  const suspendMutation = useMutation({
    mutationFn: suspendVendor,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['admin-vendors'] }),
  })

  const vendors: AdminVendor[] = data?.data ?? []

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide">VENDORS</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.meta.total ?? 0} registered vendors</p>
      </div>

      <div className="flex gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name or email…"
          className="pixel-input flex-1 px-4 py-2.5 text-sm bg-white"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(6).fill(null).map((_, i) => <div key={i} className="h-16 bg-white animate-pulse pixel-border" />)}
        </div>
      ) : vendors.length === 0 ? (
        <div className="pixel-card p-12 text-center text-gray-400">No vendors found.</div>
      ) : (
        <>
          <div className="pixel-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-purple text-brand-cream uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Vendor</th>
                    <th className="px-6 py-3 text-left">Store</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Joined</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendors.map((v: AdminVendor) => {
                    const isApproving = approveMutation.isPending && approveMutation.variables === v.id
                    const isSuspending = suspendMutation.isPending && suspendMutation.variables === v.id

                    return (
                      <tr key={v.id} className="hover:bg-brand-cream/50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{v.displayName}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{v.storeName ?? '—'}</td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{v.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {v.isApproved ? (
                              <span className="inline-block text-xs font-bold uppercase px-2 py-0.5 bg-green-100 text-green-700">
                                APPROVED
                              </span>
                            ) : (
                              <span className="inline-block text-xs font-bold uppercase px-2 py-0.5 bg-yellow-100 text-yellow-700">
                                PENDING
                              </span>
                            )}
                            {v.isSuspended && (
                              <span className="inline-block text-xs font-bold uppercase px-2 py-0.5 bg-red-100 text-red-700">
                                SUSPENDED
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs">{new Date(v.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {!v.isApproved && !v.isSuspended && (
                              <button
                                onClick={() => approveMutation.mutate(v.id)}
                                disabled={isApproving}
                                className="pixel-btn-sm bg-green-500 text-white disabled:opacity-60"
                              >
                                {isApproving ? '…' : 'Approve'}
                              </button>
                            )}
                            {!v.isSuspended ? (
                              <button
                                onClick={() => suspendMutation.mutate(v.id)}
                                disabled={isSuspending}
                                className="pixel-btn-sm bg-red-500 text-white disabled:opacity-60"
                              >
                                {isSuspending ? '…' : 'Suspend'}
                              </button>
                            ) : (
                              <button
                                onClick={() => approveMutation.mutate(v.id)}
                                disabled={isApproving}
                                className="pixel-btn-sm bg-blue-500 text-white disabled:opacity-60"
                              >
                                {isApproving ? '…' : 'Reinstate'}
                              </button>
                            )}
                          </div>
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
