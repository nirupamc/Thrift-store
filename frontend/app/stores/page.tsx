'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { fetchStores } from '@/lib/api'
import { StoreCard } from '@/components/StoreCard'
import { StoreCardSkeleton } from '@/components/ui/Skeleton'
import { Store } from 'lucide-react'
import { fadeUp } from '@/components/motion/variants'

const STYLE_OPTIONS = [
  'Vintage', 'Streetwear', 'Y2K', 'Cottagecore', 'Dark Academia',
  'Boho', 'Minimalist', 'Grunge', 'Indo-Western', 'Ethnic',
]

function StoresContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const page     = Number(searchParams.get('page') ?? 1)
  const search   = searchParams.get('search')
  const city     = searchParams.get('city')
  const styleTag = searchParams.get('styleTag')

  const { data, isLoading } = useQuery({
    queryKey: ['stores', { page, search, city, styleTag }],
    queryFn: () =>
      fetchStores({
        page,
        limit: 18,
        ...(search   && { search }),
        ...(city     && { city }),
        ...(styleTag && { styleTag }),
      }),
  })

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1')
    router.push(`/stores?${params.toString()}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search + filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search stores by name..."
          defaultValue={search ?? ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('search', (e.target as HTMLInputElement).value || null)
          }}
          className="pixel-input flex-1 px-4 py-2.5 text-sm"
        />
        <input
          type="text"
          placeholder="Filter by city"
          defaultValue={city ?? ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('city', (e.target as HTMLInputElement).value || null)
          }}
          className="pixel-input sm:w-48 px-4 py-2.5 text-sm"
        />
      </div>

      {/* Style tag pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setParam('styleTag', null)}
          className={`pixel-btn-sm ${
            !styleTag
              ? 'bg-brand-purple text-white'
              : 'bg-white text-gray-700'
          }`}
        >
          All Styles
        </button>
        {STYLE_OPTIONS.map((style) => (
          <button
            key={style}
            onClick={() => setParam('styleTag', styleTag === style ? null : style)}
            className={`pixel-btn-sm ${
              styleTag === style
                ? 'bg-brand-purple text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            {style}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        {isLoading ? 'Loading...' : `${data?.meta.total ?? 0} stores`}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 18 }).map((_, i) => <StoreCardSkeleton key={i} />)
          : data?.data.map((store) => (
              <motion.div
                key={store.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={fadeUp}
              >
                <StoreCard store={store} />
              </motion.div>
            ))}
      </div>

      {!isLoading && data?.data.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="mb-4"><Store size={64} className="mx-auto text-gray-300" /></p>
          <p className="text-lg font-medium">No stores found</p>
          <p className="text-sm mt-1">Try a different search or style</p>
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            disabled={!data.meta.hasPrevPage}
            onClick={() => setParam('page', String(page - 1))}
            className="pixel-btn text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600 font-medium">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <button
            disabled={!data.meta.hasNextPage}
            onClick={() => setParam('page', String(page + 1))}
            className="pixel-btn text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default function StoresPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Purple banner header */}
      <div className="bg-brand-purple text-brand-cream pt-16 pb-10 px-4 text-center">
        <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-widest leading-tight">
          DISCOVER STORES
        </h1>
        <div className="w-24 h-1 bg-brand-saffron mx-auto mt-3 mb-2" />
        <p className="text-brand-cream/70 text-sm">Support independent sellers. Shop conscious.</p>
      </div>
      <Suspense fallback={<div className="py-20 text-center text-gray-400">Loading...</div>}>
        <StoresContent />
      </Suspense>
    </div>
  )
}
