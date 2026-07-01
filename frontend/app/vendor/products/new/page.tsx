'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createVendorProduct } from '@/lib/api'
import { ProductForm } from '@/components/vendor/ProductForm'
import { Plus, CheckCircle, XCircle } from 'lucide-react'
import type { AxiosError } from 'axios'

type Toast = { message: string; type: 'success' | 'error' }

export default function NewProductPage() {
  const router = useRouter()
  const [toast, setToast] = useState<Toast | null>(null)

  function showToast(t: Toast, redirectTo?: string) {
    setToast(t)
    setTimeout(() => {
      setToast(null)
      if (redirectTo) router.push(redirectTo)
    }, 1200)
  }

  const mutation = useMutation({
    mutationFn: (fd: FormData) => createVendorProduct(fd),
    onSuccess: () => {
      showToast({ message: 'Product published!', type: 'success' }, '/vendor/products')
    },
    onError: (err: unknown) => {
      const status = (err as AxiosError)?.response?.status
      if (status === 401) {
        showToast({ message: 'Session expired — please log in again', type: 'error' }, '/auth/login')
      }
      // non-401 errors are shown inline below the form
    },
  })

  const apiError = mutation.isError && (mutation.error as AxiosError)?.response?.status !== 401
    ? ((mutation.error as AxiosError).response?.data as { message?: string })?.message
      ?? (mutation.error as Error).message
      ?? 'Failed to create product'
    : null

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 pixel-border text-sm font-bold shadow-lg ${
            toast.type === 'success' ? 'bg-forest text-white' : 'bg-rust text-white'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle size={18} />
            : <XCircle size={18} />}
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide flex items-center gap-2">
          <Plus size={24} /> ADD NEW PRODUCT
        </h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details for your new listing.</p>
      </div>

      {apiError && (
        <div className="pixel-border bg-red-50 px-4 py-3 text-sm text-red-700">
          {apiError}
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
