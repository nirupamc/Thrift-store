'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createVendorProduct } from '@/lib/api'
import { ProductForm } from '@/components/vendor/ProductForm'
import { Plus } from 'lucide-react'

export default function NewProductPage() {
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: (fd: FormData) => createVendorProduct(fd),
    onSuccess:  () => router.push('/vendor/products'),
  })

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide flex items-center gap-2">
          <Plus size={24} /> ADD NEW PRODUCT
        </h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details for your new listing.</p>
      </div>

      {mutation.isError && (
        <div className="pixel-border-saffron bg-red-50 px-4 py-3 text-sm text-red-700">
          {(mutation.error as Error)?.message ?? 'Failed to create product'}
        </div>
      )}

      <ProductForm
        onSubmit={(fd) => mutation.mutate(fd)}
        loading={mutation.isPending}
        submitLabel="Publish Product"
      />
    </div>
  )
}
