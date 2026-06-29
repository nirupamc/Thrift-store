'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/authStore'
import { createDrop, fetchProducts } from '@/lib/api'
import type { Product } from '@/lib/types'
import { Camera, Zap } from 'lucide-react'

export default function VendorDropsPage() {
  const { vendorStoreId } = useAuthStore()
  const queryClient = useQueryClient()

  const [dropTitle,    setDropTitle]    = useState('')
  const [description,  setDescription]  = useState('')
  const [scheduledAt,  setScheduledAt]  = useState('')
  const [selectedIds,  setSelectedIds]  = useState<string[]>([])
  const [productSearch,setProductSearch]= useState('')
  const [success,      setSuccess]      = useState('')

  const { data: productsData } = useQuery({
    queryKey: ['vendor-products-drop', vendorStoreId],
    queryFn:  () => fetchProducts({ storeId: vendorStoreId!, limit: 100 }),
    enabled:  !!vendorStoreId,
  })

  const mutation = useMutation({
    mutationFn: () => createDrop(vendorStoreId!, {
      dropTitle,
      description: description || undefined,
      scheduledAt: new Date(scheduledAt).toISOString(),
      productIds:  selectedIds,
    }),
    onSuccess: () => {
      setDropTitle('')
      setDescription('')
      setScheduledAt('')
      setSelectedIds([])
      setSuccess('Drop scheduled successfully!')
      setTimeout(() => setSuccess(''), 4000)
    },
  })

  function toggleProduct(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id)
      if (prev.length >= 20) return prev
      return [...prev, id]
    })
  }

  const availableProducts: Product[] = (productsData?.data ?? []).filter(
    (p: Product) => p.isAvailable && (
      !productSearch ||
      p.title.toLowerCase().includes(productSearch.toLowerCase())
    ),
  )

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white'

  if (!vendorStoreId) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>No store yet. Create one to schedule drops.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-gray-900">Schedule a Drop</h1>
        <p className="text-gray-500 text-sm mt-1">Announce a timed product release to your followers.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate() }}
        className="space-y-5"
      >
        {/* Drop details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-800">Drop Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Drop Title *</label>
            <input
              required
              value={dropTitle}
              onChange={(e) => setDropTitle(e.target.value)}
              placeholder="e.g. Summer Vintage Edit"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell buyers what to expect…"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time *</label>
            <input
              required
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Product picker */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Select Products</h2>
            <span className="text-xs text-gray-400">{selectedIds.length}/20 selected</span>
          </div>

          <input
            type="search"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search your products…"
            className={inputCls}
          />

          {availableProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No available products found.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {availableProducts.map((p: Product) => {
                const selected = selectedIds.includes(p.id)
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selected ? 'border-brand-purple bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleProduct(p.id)}
                      className="accent-brand-purple w-4 h-4"
                    />
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0">
                        <Camera size={16} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                      <p className="text-xs text-gray-400">₹{p.sellingPrice}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {mutation.isError && (
          <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">
            {(mutation.error as Error)?.message ?? 'Failed to schedule drop'}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
            <span className="flex items-center gap-2"><Zap size={16} />{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || selectedIds.length === 0 || !scheduledAt}
          className="w-full bg-brand-saffron text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-60"
        >
          {mutation.isPending ? 'Scheduling…' : `Schedule Drop (${selectedIds.length} product${selectedIds.length !== 1 ? 's' : ''})`}
        </button>
      </form>
    </div>
  )
}
