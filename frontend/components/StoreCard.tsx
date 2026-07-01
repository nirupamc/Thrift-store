import Link from 'next/link'
import Image from 'next/image'
import type { Store, StoreTheme } from '@/lib/types'

const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120&q=80'

interface StoreCardProps {
  store: Store
}

export function StoreCard({ store }: StoreCardProps) {
  if (!store) return null

  const theme = store.storeTheme as StoreTheme | null | undefined
  const bannerImageUrl = theme?.bannerImageUrl ?? null
  const followerCount = store.followerCount ?? store._count?.followers ?? 0
  const bannerGradient = store.bannerColor
    ? `linear-gradient(135deg, ${store.bannerColor}, ${store.bannerColor}99)`
    : 'linear-gradient(135deg, #3B7A57, #5A9E63)'

  return (
    <Link
      href={`/stores/${store.id}`}
      className="pixel-card overflow-hidden flex flex-col group"
    >
      {/* Banner */}
      <div
        className="relative h-24 w-full"
        style={bannerImageUrl ? undefined : { background: bannerGradient }}
      >
        {bannerImageUrl && (
          <Image
            src={bannerImageUrl}
            alt={`${store.name} banner`}
            fill
            className="object-cover"
            unoptimized={bannerImageUrl.startsWith('http://localhost')}
          />
        )}
      </div>

      <div className="px-4 pb-4 flex flex-col flex-1">
        {/* Square avatar overlapping banner */}
        <div className="-mt-8 mb-3 flex items-end gap-3">
          <div className="relative w-16 h-16 pixel-border overflow-hidden flex-shrink-0 bg-gray-200">
            <Image
              src={store.avatar ?? store.logo ?? AVATAR_PLACEHOLDER}
              alt={store.name}
              fill
              className="object-cover"
              unoptimized={(store.avatar ?? store.logo ?? '').startsWith('http://localhost')}
            />
          </div>
          <div className="pb-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate group-hover:text-brand-purple transition-colors">
              {store.name}
            </h3>
            {store.city && <p className="text-xs text-gray-500">{store.city}</p>}
          </div>
        </div>

        {/* Bio */}
        {store.bio && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{store.bio}</p>
        )}

        {/* Style tags */}
        {store.styleTags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {store.styleTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="pixel-btn-sm bg-brand-saffron text-white text-[10px] py-0.5 px-2"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Followers */}
        <p className="text-xs text-gray-400">
          {followerCount.toLocaleString('en-IN')} followers
        </p>

        {/* Visit store CTA */}
        <div className="px-0 pb-0 mt-auto pt-3">
          <span className="pixel-btn-sm bg-brand-purple text-white text-xs font-bold px-3 py-1.5 inline-block">
            VISIT STORE →
          </span>
        </div>
      </div>
    </Link>
  )
}
