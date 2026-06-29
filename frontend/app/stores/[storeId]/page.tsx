'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchStore, fetchStoreProducts, fetchStoreReviews, followStore, unfollowStore } from '@/lib/api'
import { ProductCard } from '@/components/ProductCard'
import { ProductCardSkeleton, Skeleton } from '@/components/ui/Skeleton'
import type { StoreTheme, StoreThemeSticker } from '@/lib/types'
import { Store, Package, MessageSquare, Star as StarIcon, Sparkles } from 'lucide-react'

const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=80'

// ─── Font / theme helpers ─────────────────────────────────────────────────────

const FONT_MAP: Record<string, { heading: string; body: string; google?: string }> = {
  retro:       { heading: "'Playfair Display', serif",   body: "'Courier New', monospace",  google: 'Playfair+Display:wght@700' },
  minimal:     { heading: 'Inter, sans-serif',           body: 'Inter, sans-serif' },
  handwritten: { heading: "'Caveat', cursive",           body: 'Inter, sans-serif',          google: 'Caveat:wght@700' },
  bold:        { heading: "'Black Han Sans', sans-serif",body: 'Inter, sans-serif',          google: 'Black+Han+Sans' },
  dreamy:      { heading: "'Satisfy', cursive",          body: "'Lato', sans-serif",         google: 'Satisfy&family=Lato:wght@400;700' },
}

const MARQUEE_SECS: Record<string, number> = { slow: 22, medium: 13, fast: 6 }

function getBannerStyle(t: StoreTheme): React.CSSProperties {
  if (t.bannerType === 'image' && t.bannerImageUrl) {
    return { backgroundImage: `url(${t.bannerImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  if (t.bannerType === 'gradient') {
    const c1 = t.bannerColor1 ?? '#5B21B6'
    const c2 = t.bannerColor2 ?? '#7C3AED'
    if (t.bannerGradientDirection === 'radial') return { background: `radial-gradient(circle, ${c1}, ${c2})` }
    return { background: `linear-gradient(${t.bannerGradientDirection ?? '135deg'}, ${c1}, ${c2})` }
  }
  return { backgroundColor: t.bannerColor1 ?? '#5B21B6' }
}

function getPatternStyle(pattern: string, opacity: number): React.CSSProperties {
  const a = opacity / 100
  const c = `rgba(0,0,0,${a})`
  switch (pattern) {
    case 'dots':
      return { backgroundImage: `radial-gradient(circle, ${c} 1px, transparent 1px)`, backgroundSize: '20px 20px' }
    case 'stripes':
      return { backgroundImage: `repeating-linear-gradient(45deg, ${c}, ${c} 1px, transparent 1px, transparent 10px)` }
    case 'checkerboard':
      return {
        backgroundImage: `linear-gradient(45deg,${c} 25%,transparent 25%),linear-gradient(-45deg,${c} 25%,transparent 25%),linear-gradient(45deg,transparent 75%,${c} 75%),linear-gradient(-45deg,transparent 75%,${c} 75%)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0,0 10px,10px -10px,-10px 0px',
      }
    case 'zigzag':
      return {
        backgroundImage: `linear-gradient(135deg,${c} 25%,transparent 25%),linear-gradient(225deg,${c} 25%,transparent 25%),linear-gradient(315deg,${c} 25%,transparent 25%),linear-gradient(45deg,${c} 25%,transparent 25%)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '-10px 0,-10px 0,0 0,0 0',
      }
    case 'grid':
      return {
        backgroundImage: `linear-gradient(${c} 1px,transparent 1px),linear-gradient(90deg,${c} 1px,transparent 1px)`,
        backgroundSize: '20px 20px',
      }
    default:
      return {}
  }
}

function getBorderCss(t: StoreTheme): React.CSSProperties {
  const s = t.borderStyle
  if (!s || s === 'none') return {}
  const c = t.borderColor ?? '#5B21B6'
  if (s === 'retro') return { border: `4px solid ${c}`, boxShadow: `6px 6px 0 0 ${c}` }
  if (s === 'double') return { border: `3px double ${c}` }
  return { border: `2px ${s} ${c}` }
}

// ─── Page-effect overlay ──────────────────────────────────────────────────────

function PageEffect({ effect }: { effect: string }) {
  const items = useMemo(() => {
    if (effect === 'none') return []
    const count = effect === 'confetti' ? 50 : 20
    const confettiColors = ['#FF6B6B','#4ECDC4','#45B7D1','#F7B731','#5B21B6','#EA580C']
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left:     `${(i * 7.31 + 3) % 100}%`,
      topPct:   `${(i * 11.7 + 5) % 90}%`,
      delay:    `${(i * 0.19) % 3}s`,
      duration: `${1.8 + (i * 0.21) % 2.5}s`,
      color: confettiColors[i % confettiColors.length],
      rotate: (i * 41) % 360,
    }))
  }, [effect])

  if (effect === 'none') return null

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <style>{`
        @keyframes sparkle-page { 0%,100%{opacity:0;transform:scale(0) rotate(0deg)} 50%{opacity:1;transform:scale(1) rotate(180deg)} }
        @keyframes fall-page { from{transform:translateY(-20px) rotate(0deg);opacity:1} to{transform:translateY(110vh) rotate(360deg);opacity:0} }
        @keyframes confetti-page { from{transform:translateY(-20px) rotate(0deg)} to{transform:translateY(110vh) rotate(720deg)} }
        @keyframes marquee-page { from{transform:translateX(100%)} to{transform:translateX(-100%)} }
      `}</style>
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute text-xl"
          style={{
            left: item.left,
            top: effect === 'sparkles' ? item.topPct : '-24px',
            animation: `${
              effect === 'sparkles' ? 'sparkle-page'
              : effect === 'stars' ? 'fall-page'
              : 'confetti-page'
            } ${item.duration} ${item.delay} infinite ${effect === 'confetti' ? 'linear' : 'ease-in-out'}`,
          }}
        >
          {effect === 'confetti'
            ? <div style={{ width: 8, height: 12, backgroundColor: item.color, transform: `rotate(${item.rotate}deg)` }} />
            : effect === 'stars' ? <StarIcon size={20} /> : <Sparkles size={20} />}
        </div>
      ))}
    </div>
  )
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StoreDetailPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const [tab, setTab] = useState<'products' | 'reviews'>('products')
  const [productPage, setProductPage] = useState(1)
  const [followed, setFollowed] = useState(false)

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ['store', storeId],
    queryFn: () => fetchStore(storeId),
    enabled: !!storeId,
  })

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['store-products', storeId, productPage],
    queryFn: () => fetchStoreProducts(storeId, { page: productPage, limit: 12 }),
    enabled: !!storeId,
  })

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['store-reviews', storeId],
    queryFn: () => fetchStoreReviews(storeId),
    enabled: !!storeId && tab === 'reviews',
  })

  const followMutation = useMutation({
    mutationFn: () => (followed ? unfollowStore(storeId) : followStore(storeId)),
    onSuccess: () => setFollowed(!followed),
  })

  const theme: StoreTheme | null = (store?.storeTheme as StoreTheme | null | undefined) ?? null
  const accent = theme?.accentColor ?? '#5B21B6'
  const fonts = FONT_MAP[theme?.fontStyle ?? 'minimal'] ?? FONT_MAP.minimal

  // ── Load Google Fonts for this store's theme ──────────────────────────────
  useEffect(() => {
    if (!theme?.fontStyle || theme.fontStyle === 'minimal') return
    const gf = FONT_MAP[theme.fontStyle]?.google
    if (!gf) return
    const id = `gf-store-${theme.fontStyle}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${gf}&display=swap`
    document.head.appendChild(link)
  }, [theme?.fontStyle])

  // ── Banner style (legacy bannerColor fallback) ────────────────────────────
  const bannerStyle: React.CSSProperties = theme
    ? getBannerStyle(theme)
    : store?.bannerColor
      ? { background: `linear-gradient(135deg, ${store.bannerColor}, ${store.bannerColor}99)` }
      : { background: 'linear-gradient(135deg, #5B21B6, #7C3AED, #EA580C)' }

  const bgStyle: React.CSSProperties = theme
    ? {
        backgroundColor: theme.bgColor ?? '#ffffff',
        ...getPatternStyle(theme.bgPattern ?? 'none', theme.bgPatternOpacity ?? 30),
      }
    : {}

  const borderStyle = theme ? getBorderCss(theme) : {}
  const marqueeSecs = MARQUEE_SECS[theme?.marqueeSpeed ?? 'medium'] ?? 13
  const stickers: StoreThemeSticker[] = theme?.stickers ?? []

  const followerCount = store?.followerCount ?? store?._count?.followers ?? 0

  const showReviews = theme?.showReviews !== false
  const showDrops   = theme?.showDrops   !== false
  const showAbout   = theme?.showAbout   !== false

  if (storeLoading) {
    return (
      <div>
        <Skeleton className="w-full h-52" />
        <div className="max-w-7xl mx-auto px-4 -mt-12 mb-8">
          <div className="flex items-end gap-4">
            <Skeleton className="w-24 h-24 ring-4 ring-white flex-shrink-0" />
            <div className="pb-2 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="mb-3"><Store size={64} className="mx-auto text-gray-300" /></p>
        <p className="text-lg font-medium">Store not found</p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: fonts.body, ...borderStyle }}>
      {theme?.pageEffect && theme.pageEffect !== 'none' && (
        <PageEffect effect={theme.pageEffect} />
      )}

      <style>{`@keyframes marquee-store{from{transform:translateX(100%)}to{transform:translateX(-100%)}}`}</style>

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div className="pixel-border relative w-full h-48 md:h-64" style={bannerStyle}>
        {stickers.map((s, i) => (
          <span
            key={i}
            className="absolute pointer-events-none select-none leading-none"
            style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size }}
          >
            {s.emoji}
          </span>
        ))}
      </div>

      {/* ── Marquee ─────────────────────────────────────────────────────────── */}
      {theme?.marqueeText && (
        <div
          className="overflow-hidden whitespace-nowrap py-1.5 text-sm font-semibold bg-brand-saffron text-white"
        >
          <span style={{ display: 'inline-block', animation: `marquee-store ${marqueeSecs}s linear infinite` }}>
            {theme.marqueeText}
          </span>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div style={bgStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Store header */}
          <div className="-mt-12 mb-6 flex flex-col sm:flex-row sm:items-end gap-4 pt-1">
            <div className="pixel-border relative w-24 h-24 overflow-hidden flex-shrink-0 bg-gray-200">
              <Image
                src={store.avatar ?? store.logo ?? AVATAR_PLACEHOLDER}
                alt={store.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1
                    className="text-3xl font-bold text-white"
                    style={{ fontFamily: fonts.heading, textShadow: '2px 2px 0 #1a0a3c' }}
                  >
                    {store.name}
                  </h1>
                  <p className="text-gray-200 text-sm mt-0.5" style={{ textShadow: '1px 1px 0 #1a0a3c' }}>
                    {store.city}{store.state ? `, ${store.state}` : ''}
                    {' · '}
                    {followerCount.toLocaleString('en-IN')} followers
                  </p>
                </div>
                <button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className={`pixel-btn font-semibold text-sm ${
                    followed
                      ? 'bg-white text-brand-purple'
                      : 'bg-brand-purple text-white'
                  }`}
                >
                  {followed ? 'Following' : 'Follow Store'}
                </button>
              </div>
            </div>
          </div>

          {/* Bio */}
          {(store.description ?? store.bio) && showAbout && (
            <p className="text-gray-600 mb-4 max-w-2xl">{store.description ?? store.bio}</p>
          )}

          {/* Style tags */}
          {store.styleTags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {store.styleTags.map((tag) => (
                <span
                  key={tag}
                  className="pixel-btn-sm bg-brand-saffron text-white font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b-2 border-[#1a0a3c]">
            <button
              onClick={() => setTab('products')}
              className={`px-6 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                tab === 'products'
                  ? 'bg-white pixel-border-purple text-brand-purple'
                  : 'bg-brand-purple/10 text-gray-500 hover:bg-brand-purple/20'
              }`}
            >
              Products
              {productsData?.meta.total != null && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5">
                  {productsData.meta.total}
                </span>
              )}
            </button>

            {showReviews && (
              <button
                onClick={() => setTab('reviews')}
                className={`px-6 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                  tab === 'reviews'
                    ? 'bg-white pixel-border-purple text-brand-purple'
                    : 'bg-brand-purple/10 text-gray-500 hover:bg-brand-purple/20'
                }`}
              >
                Reviews
              </button>
            )}
          </div>

          {/* Products tab */}
          {tab === 'products' && (
            <>
              {/* Grid layout switcher via theme */}
              {(theme?.productLayout === 'list') ? (
                <div className="space-y-3 mb-8">
                  {productsLoading
                    ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
                    : productsData?.data.map((product) => (
                        <div key={product.id} className="pixel-card flex gap-3 p-3">
                          {product.images[0] && (
                            <img src={product.images[0]} alt={product.title} className="w-20 h-20 object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{product.title}</p>
                            <p className="text-xs text-gray-400">{product.condition}</p>
                            <p className="font-bold mt-1" style={{ color: accent }}>
                              ₹{Number(product.sellingPrice).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      ))}
                </div>
              ) : (theme?.productLayout === 'magazine') ? (
                <div className="columns-2 md:columns-3 gap-4 mb-8">
                  {productsLoading
                    ? Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="break-inside-avoid mb-4 bg-gray-100 h-48" />
                      ))
                    : productsData?.data.map((product) => (
                        <div key={product.id} className="break-inside-avoid mb-4">
                          <ProductCard product={product} />
                        </div>
                      ))}
                </div>
              ) : (theme?.productLayout === 'polaroid') ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
                  {productsLoading
                    ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
                    : productsData?.data.map((product, i) => (
                        <div
                          key={product.id}
                          className="bg-white"
                          style={{
                            padding: '8px 8px 32px',
                            transform: `rotate(${i % 2 === 0 ? '-1.8deg' : '1.8deg'})`,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          }}
                        >
                          <ProductCard product={product} />
                        </div>
                      ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  {productsLoading
                    ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
                    : productsData?.data.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                </div>
              )}

              {!productsLoading && productsData?.data.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <p className="mb-3"><Package size={64} className="mx-auto text-gray-300" /></p>
                  <p className="font-medium">No products listed yet</p>
                </div>
              )}

              {productsData && productsData.meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4 mb-12">
                  <button
                    disabled={!productsData.meta.hasPrevPage}
                    onClick={() => setProductPage((p) => p - 1)}
                    className="pixel-btn text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {productsData.meta.page} of {productsData.meta.totalPages}
                  </span>
                  <button
                    disabled={!productsData.meta.hasNextPage}
                    onClick={() => setProductPage((p) => p + 1)}
                    className="pixel-btn text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

          {/* Reviews tab */}
          {tab === 'reviews' && showReviews && (
            <div className="pb-12">
              {reviewsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="pixel-card p-5 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ) : !reviewsData?.data.length ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="mb-3"><MessageSquare size={64} className="mx-auto text-gray-300" /></p>
                  <p className="font-medium">No reviews yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviewsData.data.map((review) => (
                    <div key={review.id} className="pixel-card p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <StarRating rating={review.rating} />
                          <p className="text-xs text-gray-400 mt-1">
                            {review.buyer.user.email.replace(/(.{2}).+(@.+)/, '$1***$2')}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
