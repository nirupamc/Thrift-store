'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { fetchProduct, updateVendorProduct } from '@/lib/api'
import { ProductForm } from '@/components/vendor/ProductForm'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn:  () => fetchProduct(id),
    enabled:  !!id,
  })

  const mutation = useMutation({
    mutationFn: (fd: FormData) => updateVendorProduct(id, fd),
    onSuccess:  () => router.push('/vendor/products'),
  })

  if (isLoading) {
    return <div className="p-8 text-gray-400">Loading product…</div>
  }

  if (!product) {
    return <div className="p-8 text-red-500 font-bold">Product not found.</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide">✏️ EDIT PRODUCT</h1>
        <p className="text-gray-500 text-sm mt-1 truncate">{product.title}</p>
      </div>

      {mutation.isError && (
        <div className="pixel-border-saffron bg-red-50 px-4 py-3 text-sm text-red-700">
          {(mutation.error as Error)?.message ?? 'Failed to update product'}
        </div>
      )}

      <ProductForm
        existingProduct={product}
        onSubmit={(fd) => mutation.mutate(fd)}
        loading={mutation.isPending}
        submitLabel="Save Changes"
      />
    </div>
  )
}
