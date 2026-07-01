'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/authStore'
import { fetchVendorProducts, deleteVendorProduct } from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, formatCondition } from '@/lib/utils'
import { RarityBadge, ConditionBadge } from '@/components/ui/Badge'
import type { Product } from '@/lib/types'
import { Shirt, Plus, Camera, Trash2 } from 'lucide-react'

export default function VendorProductsPage() {
  const { vendorStoreId } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-products', page],
    queryFn:  () => fetchVendorProducts({ page, limit: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteVendorProduct,
    onSuccess:  () => {
      setConfirmDelete(null)
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
    },
  })

  if (!vendorStoreId) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>No store yet. <Link href="/vendor/store" className="text-brand-purple underline font-bold">Create one first.</Link></p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide flex items-center gap-2">
            <Shirt size={24} /> PRODUCTS
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">{data?.meta.total ?? 0} items in your store</p>
        </div>
        <Link
          href="/vendor/products/new"
          className="pixel-btn bg-brand-saffron text-white px-5 py-2.5 font-bold text-sm"
        >
          <span className="flex items-center gap-2"><Plus size={16} /> ADD NEW PRODUCT</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="h-20 bg-white animate-pulse pixel-border" />
          ))}
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="pixel-card p-16 text-center">
          <div className="flex justify-center mb-3"><Shirt size={40} className="text-gray-300" /></div>
          <p className="text-gray-500 font-bold uppercase tracking-wide">No products yet</p>
          <Link href="/vendor/products/new" className="mt-4 inline-block text-brand-purple text-sm font-bold hover:underline">
            Add your first product →
          </Link>
        </div>
      ) : (
        <>
          <div className="pixel-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-purple text-brand-cream uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left w-16">Image</th>
                    <th className="px-6 py-3 text-left">Title</th>
                    <th className="px-6 py-3 text-left">Price</th>
                    <th className="px-6 py-3 text-left">Condition</th>
                    <th className="px-6 py-3 text-left">Rarity</th>
                    <th className="px-6 py-3 text-left">Available</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.data ?? []).map((product: Product) => (
                    <tr key={product.id} className="hover:bg-brand-cream/50 group" style={{ borderBottom: '1px solid rgba(26,10,60,0.15)' }}>
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 overflow-hidden bg-gray-100 flex-shrink-0 pixel-border-sm">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Camera size={24} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800 leading-tight">{product.title}</p>
                        {product.brand && <p className="text-xs text-gray-400 mt-0.5">{product.brand}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-brand-saffron text-white font-mono text-sm tracking-wide font-bold px-2 py-1">
                          {formatPrice(product.sellingPrice)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ConditionBadge condition={product.condition} />
                      </td>
                      <td className="px-6 py-4">
                        {product.rarity && <RarityBadge rarity={product.rarity} />}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${product.isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                          <span className={`w-1.5 h-1.5 ${product.isAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
                          {product.isAvailable ? 'Available' : 'Sold'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/vendor/products/${product.id}/edit`}
                            className="pixel-btn-sm bg-brand-purple text-white px-2 py-1 text-xs font-bold"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setConfirmDelete(product.id)}
                            className="pixel-btn-sm bg-red-500 text-white px-2 py-1 text-xs font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {(data?.meta.totalPages ?? 1) > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!data?.meta.hasPrevPage}
                className="pixel-btn bg-white text-gray-700 px-4 py-2 text-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 text-sm text-gray-500 font-bold">
                Page {data?.meta.page} of {data?.meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!data?.meta.hasNextPage}
                className="pixel-btn bg-white text-gray-700 px-4 py-2 text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="pixel-card p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <Trash2 size={20} /> Delete product?
            </h3>
            <p className="text-sm text-gray-500">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 pixel-btn bg-white text-gray-700 py-2 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="flex-1 pixel-btn bg-red-500 text-white py-2 text-sm font-bold disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
