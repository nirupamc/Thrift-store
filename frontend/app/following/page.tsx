'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchFollowedStores, unfollowStore } from '@/lib/api'
import { Skeleton, StoreCardSkeleton } from '@/components/ui/Skeleton'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import type { Store } from '@/lib/types'
import { Heart, Diamond, Store as StoreIcon } from 'lucide-react'

const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120&q=80'

function FollowedStoreCard({ store, onUnfollow }: { store: Store; onUnfollow: () => void }) {
  const bannerGradient = store.bannerColor
    ? `linear-gradient(135deg, ${store.bannerColor}, ${store.bannerColor}99)`
    : 'linear-gradient(135deg, #5B21B6, #7C3AED)'
  const followerCount = store.followerCount ?? store._count?.followers ?? 0

  return (
    <div className="pixel-card overflow-hidden">
      {/* Banner */}
      <Link href={`/stores/${store.id}`}>
        <div className="h-20 w-full" style={{ background: bannerGradient }} />
      </Link>

      <div className="px-4 pb-4">
        <div className="-mt-7 mb-3 flex items-end gap-3">
          <Link href={`/stores/${store.id}`}>
            <div className="relative w-14 h-14 pixel-border overflow-hidden flex-shrink-0 bg-gray-200" style={{ borderRadius: '50%' }}>
              <Image src={store.avatar ?? AVATAR_PLACEHOLDER} alt={store.name} fill className="object-cover" />
            </div>
          </Link>
          <div className="pb-1 min-w-0">
            <Link href={`/stores/${store.id}`} className="font-bold text-gray-900 hover:text-brand-purple transition-colors block truncate">
              {store.name}
            </Link>
            <p className="text-xs text-gray-500">{store.city}</p>
          </div>
        </div>

        {store.styleTags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {store.styleTags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-brand-cream text-brand-purple text-xs pixel-border-sm">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{followerCount.toLocaleString('en-IN')} followers</p>
          <button
            onClick={onUnfollow}
            className="text-xs text-red-500 hover:text-red-700 font-bold pixel-border-sm border-red-300 px-3 py-1 transition-colors"
          >
            Unfollow
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FollowingPage() {
  const { isAuthenticated, hydrated } = useRequireAuth()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['following'],
    queryFn: () => fetchFollowedStores({ limit: 50 }),
    enabled: isAuthenticated,
  })

  const unfollowMutation = useMutation({
    mutationFn: (storeId: string) => unfollowStore(storeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['following'] }),
  })

  if (!hydrated) return null
  if (!isAuthenticated) return <div className="min-h-screen flex items-center justify-center text-gray-400">Redirecting...</div>

  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            Stores You Follow <Heart size={24} className="text-brand-saffron" />
            <Diamond size={16} className="text-brand-purple" />
          </h1>
          {!isLoading && data && (
            <p className="text-gray-400 text-sm mt-1">
              You follow {data.meta.total} store{data.meta.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <StoreCardSkeleton key={i} />)}
          </div>
        )}

        {!isLoading && data?.data.length === 0 && (
          <div className="text-center py-20">
            <div className="mb-4"><StoreIcon size={64} className="mx-auto text-gray-300" /></div>
            <p className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-1">No stores followed yet</p>
            <p className="text-sm text-gray-500 mt-1 mb-6">Follow stores to stay updated on their drops and new arrivals.</p>
            <Link
              href="/stores"
              className="pixel-btn bg-brand-purple text-white font-bold px-8 py-3"
            >
              Explore Stores
            </Link>
          </div>
        )}

        {data && data.data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.data.map((store) => (
              <FollowedStoreCard
                key={store.id}
                store={store}
                onUnfollow={() => unfollowMutation.mutate(store.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
