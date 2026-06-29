'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { fetchProducts } from '@/lib/api'
import { ProductCard } from '@/components/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { Diamond, ShoppingBasket } from 'lucide-react'

const CONDITIONS  = ['NEW_WITH_TAGS', 'LIKE_NEW', 'GOOD', 'FAIR']
const RARITIES    = ['VINTAGE_RARE', 'RARE', 'UNCOMMON', 'COMMON']
const GENDERS     = ['MEN', 'WOMEN', 'UNISEX', 'KIDS']
const ERAS        = ['70s', '80s', '90s', '2000s', 'Y2K', 'Victorian', 'Retro']

const CONDITION_LABELS: Record<string, string> = {
  NEW_WITH_TAGS: 'New with Tags',
  LIKE_NEW: 'Like New',
  GOOD: 'Good',
  FAIR: 'Fair',
}
const RARITY_LABELS: Record<string, string> = {
  VINTAGE_RARE: 'Vintage Rare',
  RARE: 'Rare',
  UNCOMMON: 'Uncommon',
  COMMON: 'Common',
}

function FilterCheckbox({
  label,
  param,
  value,
  current,
  onToggle,
}: {
  label: string
  param: string
  value: string
  current: string | null
  onToggle: (param: string, value: string) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={current === value}
        onChange={() => onToggle(param, value)}
        className="w-4 h-4 accent-brand-purple"
      />
      <span className="text-sm text-gray-700 group-hover:text-brand-purple">{label}</span>
    </label>
  )
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const page      = Number(searchParams.get('page') ?? 1)
  const condition = searchParams.get('condition')
  const rarity    = searchParams.get('rarity')
  const gender    = searchParams.get('gender')
  const era       = searchParams.get('era')
  const city      = searchParams.get('city')
  const search    = searchParams.get('search')
  const priceMin  = searchParams.get('priceMin')
  const priceMax  = searchParams.get('priceMax')

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, condition, rarity, gender, era, city, search, priceMin, priceMax }],
    queryFn: () =>
      fetchProducts({
        page,
        limit: 20,
        ...(condition && { condition }),
        ...(rarity    && { rarity }),
        ...(gender    && { gender }),
        ...(era       && { era }),
        ...(city      && { city }),
        ...(search    && { search }),
        ...(priceMin  && { priceMin: Number(priceMin) }),
        ...(priceMax  && { priceMax: Number(priceMax) }),
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
    router.push(`/products?${params.toString()}`)
  }

  function toggleParam(key: string, value: string) {
    const current = searchParams.get(key)
    setParam(key, current === value ? null : value)
  }

  function clearAll() {
    router.push('/products')
  }

  const hasFilters = [condition, rarity, gender, era, city, priceMin, priceMax].some(Boolean)

  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            defaultValue={search ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('search', (e.target as HTMLInputElement).value || null)
            }}
            className="pixel-input w-full max-w-lg px-4 py-2.5 text-sm"
          />
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="pixel-card p-0 overflow-hidden sticky top-24">
              {/* Filters header */}
              <div className="pixel-section-header px-4 py-2 flex items-center justify-between">
                <span>FILTERS</span>
                {hasFilters && (
                  <button onClick={clearAll} className="text-brand-saffron text-xs hover:underline normal-case">
                    Clear
                  </button>
                )}
              </div>

              {/* Condition */}
              <div className="border-t border-gray-100">
                <div className="px-4 pt-4 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  CONDITION
                </div>
                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleParam('condition', c)}
                      className={`pixel-btn-sm text-xs font-bold ${
                        condition === c ? 'bg-brand-saffron text-white' : 'bg-white text-gray-700'
                      }`}
                    >
                      {CONDITION_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rarity */}
              <div className="border-t border-gray-100">
                <div className="px-4 pt-4 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  RARITY
                </div>
                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {RARITIES.map((r) => (
                    <button
                      key={r}
                      onClick={() => toggleParam('rarity', r)}
                      className={`pixel-btn-sm text-xs font-bold ${
                        rarity === r ? 'bg-brand-saffron text-white' : 'bg-white text-gray-700'
                      }`}
                    >
                      {RARITY_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div className="border-t border-gray-100">
                <div className="px-4 pt-4 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  GENDER
                </div>
                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      onClick={() => toggleParam('gender', g)}
                      className={`pixel-btn-sm text-xs font-bold ${
                        gender === g ? 'bg-brand-saffron text-white' : 'bg-white text-gray-700'
                      }`}
                    >
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Era */}
              <div className="border-t border-gray-100">
                <div className="px-4 pt-4 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  ERA
                </div>
                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {ERAS.map((e) => (
                    <button
                      key={e}
                      onClick={() => toggleParam('era', e)}
                      className={`pixel-btn-sm text-xs font-bold ${
                        era === e ? 'bg-brand-saffron text-white' : 'bg-white text-gray-700'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-gray-100">
                <div className="px-4 pt-4 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  PRICE (₹)
                </div>
                <div className="flex gap-2 px-4 pb-3">
                  <input
                    type="number"
                    placeholder="Min"
                    defaultValue={priceMin ?? ''}
                    onBlur={(e) => setParam('priceMin', e.target.value || null)}
                    className="pixel-input w-full px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    defaultValue={priceMax ?? ''}
                    onBlur={(e) => setParam('priceMax', e.target.value || null)}
                    className="pixel-input w-full px-2 py-1.5 text-sm"
                  />
                </div>
              </div>

              {/* City */}
              <div className="border-t border-gray-100">
                <div className="px-4 pt-4 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  CITY
                </div>
                <div className="px-4 pb-4">
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    defaultValue={city ?? ''}
                    onBlur={(e) => setParam('city', e.target.value || null)}
                    className="pixel-input w-full px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {isLoading ? 'Loading...' : `${data?.meta.total ?? 0} products`}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {isLoading
                ? Array.from({ length: 20 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : data?.data.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>

            {!isLoading && data?.data.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <p className="mb-4"><ShoppingBasket size={64} className="mx-auto text-gray-300" /></p>
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}

            {/* Pagination */}
            {data && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  disabled={!data.meta.hasPrevPage}
                  onClick={() => setParam('page', String(page - 1))}
                  className="pixel-btn bg-white text-gray-700 px-4 py-2 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {data.meta.page} of {data.meta.totalPages}
                </span>
                <button
                  disabled={!data.meta.hasNextPage}
                  onClick={() => setParam('page', String(page + 1))}
                  className="pixel-btn bg-white text-gray-700 px-4 py-2 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-brand-purple py-12 px-4 text-center relative overflow-hidden">
        <span className="absolute top-4 left-8 text-brand-saffron select-none pointer-events-none opacity-60"><Diamond size={22} /></span>
        <span className="absolute bottom-4 right-8 text-brand-cream select-none pointer-events-none opacity-40"><Diamond size={18} /></span>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-cream uppercase tracking-widest">BROWSE ALL FINDS</h1>
        <div className="w-20 h-1 bg-brand-saffron mx-auto mt-3 mb-2" />
        <p className="text-brand-cream/70 text-sm">Find your next favourite pre-loved piece</p>
      </div>
      <Suspense fallback={<div className="py-20 text-center text-gray-400">Loading...</div>}>
        <ProductsContent />
      </Suspense>
    </div>
  )
}
