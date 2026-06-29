'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchProduct, fetchProductReviews, addToCart, followStore, unfollowStore } from '@/lib/api'
import { RarityBadge, ConditionBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatPrice, formatCondition } from '@/lib/utils'
import { Search, Store, Package, ClipboardList, Ruler, Check } from 'lucide-react'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800&q=80'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </div>
  )
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [selectedImage, setSelectedImage] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [cartAdded, setCartAdded] = useState(false)
  const [cartError, setCartError] = useState('')
  const [followed, setFollowed] = useState(false)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProduct(slug),
    enabled: !!slug,
  })

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', 'product', product?.id],
    queryFn: () => fetchProductReviews(product!.id),
    enabled: !!product?.id,
  })

  const cartMutation = useMutation({
    mutationFn: () => addToCart(product!.id),
    onSuccess: () => {
      setCartAdded(true)
      setCartError('')
      setTimeout(() => setCartAdded(false), 2000)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Please log in to add items to your cart.'
      setCartError(msg)
      setTimeout(() => setCartError(''), 4000)
    },
  })

  const followMutation = useMutation({
    mutationFn: () => (followed ? unfollowStore(product!.store.id) : followStore(product!.store.id)),
    onSuccess: () => setFollowed(!followed),
  })

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square animate-pulse" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 animate-pulse" />
            <Skeleton className="h-6 w-1/2 animate-pulse" />
            <Skeleton className="h-10 w-1/3 animate-pulse" />
            <Skeleton className="h-40 w-full animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="py-20 text-center text-gray-400">
        <div className="pixel-border inline-block px-8 py-10">
          <p className="mb-3"><Search size={64} className="mx-auto text-gray-300" /></p>
          <p className="text-lg font-medium">Product not found</p>
        </div>
      </div>
    )
  }

  const images = product.images?.length ? product.images : [PLACEHOLDER]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-brand-purple">Home</Link>
        <span className="text-brand-saffron font-bold">›</span>
        <Link href="/products" className="hover:text-brand-purple">Products</Link>
        <span className="text-brand-saffron font-bold">›</span>
        <span className="text-gray-700 truncate max-w-xs">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image gallery */}
        <div>
          {/* Main image */}
          <div
            className="relative aspect-square pixel-border overflow-hidden bg-gray-100 cursor-zoom-in"
            onClick={() => setZoomOpen(true)}
          >
            <Image
              src={images[selectedImage]}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute bottom-3 right-3 bg-brand-purple/80 text-white text-xs px-2 py-1 flex items-center gap-1">
              <Search size={12} /> Click to zoom
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className="relative flex-shrink-0 w-16 h-16 overflow-hidden pixel-border-sm transition-all"
                  style={selectedImage === i ? { boxShadow: '0 0 0 2px #5B21B6' } : undefined}
                >
                  <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-5">
          {/* Category */}
          <p className="text-xs text-brand-saffron font-bold uppercase tracking-widest">{product.category.name}</p>

          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            {product.title}
          </h1>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {product.rarity && <RarityBadge rarity={product.rarity} />}
            <ConditionBadge condition={product.condition} />
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-brand-saffron">
              {formatPrice(product.sellingPrice)}
            </span>
            {product.originalPrice && product.originalPrice > product.sellingPrice && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="text-sm text-brand-saffron font-bold">
                  {Math.round((1 - product.sellingPrice / product.originalPrice) * 100)}% off
                </span>
              </>
            )}
          </div>

          {/* Add to cart */}
          {product.isAvailable ? (
            <div className="space-y-2">
              <button
                onClick={() => cartMutation.mutate()}
                disabled={cartMutation.isPending || cartAdded}
                className="pixel-btn bg-brand-saffron text-white font-bold py-4 text-lg w-full disabled:opacity-70"
              >
                {cartAdded ? <><Check size={16} className="inline mr-1" /> Added to Cart!</> : cartMutation.isPending ? 'Adding...' : 'Add to Cart'}
              </button>
              {cartError && (
                <p className="text-red-600 text-sm text-center">{cartError}</p>
              )}
            </div>
          ) : (
            <button
              disabled
              className="pixel-btn bg-gray-300 text-gray-500 font-bold py-4 text-lg w-full cursor-not-allowed"
            >
              SOLD
            </button>
          )}

          {/* Product metadata grid */}
          <div className="pixel-card p-5">
            <div className="pixel-section-header -mx-5 -mt-5 mb-4 px-5 py-2 flex items-center gap-2">
              <Package size={16} /> DETAILS
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Brand',     product.brand],
                ['Size',      product.size],
                ['Fabric',    product.fabric],
                ['Era',       product.era],
                ['Gender',    product.gender],
                ['City',      product.city],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="font-medium text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}

              {product.color?.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Colors</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.color.map((c) => (
                      <span key={c} className="px-2 py-0.5 bg-gray-100 pixel-border-sm text-xs">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {product.tags?.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-brand-cream text-brand-purple pixel-border-sm text-xs">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="pixel-card overflow-hidden">
              <div className="pixel-section-header px-5 py-2 mb-4 flex items-center gap-2">
                <ClipboardList size={16} /> DESCRIPTION
              </div>
              <div className="px-5 pb-5">
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            </div>
          )}

          {/* Condition details */}
          {(product.defects || product.visibleSpots) && (
            <div className="pixel-border-saffron bg-orange-50 p-5 text-sm">
              <h3 className="font-semibold text-orange-800 mb-2">Condition Notes</h3>
              {product.defects && <p className="text-orange-700"><strong>Defects:</strong> {product.defects}</p>}
              {product.visibleSpots && <p className="text-orange-700 mt-1"><strong>Visible spots:</strong> {product.visibleSpots}</p>}
            </div>
          )}

          {/* Measurements */}
          {product.measurements && Object.keys(product.measurements).length > 0 && (
            <div className="pixel-card overflow-hidden">
              <div className="pixel-section-header px-5 py-2 mb-4 flex items-center gap-2">
                <Ruler size={16} /> MEASUREMENTS
              </div>
              <div className="px-5 pb-5 grid grid-cols-2 gap-2 text-sm">
                {Object.entries(product.measurements).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="font-medium">{String(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Store card */}
          <div className="pixel-card p-5">
            <div className="pixel-section-header -mx-5 -mt-5 mb-4 px-5 py-2 flex items-center gap-2">
              <Store size={16} /> SOLD BY
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href={`/stores/${product.store.id}`}
                  className="font-bold text-gray-900 hover:text-brand-purple transition-colors"
                >
                  {product.store.name}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5">{product.store.city}</p>
              </div>
              <button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className={`pixel-btn-sm text-sm font-medium ${
                  followed
                    ? 'bg-white text-gray-700'
                    : 'bg-brand-purple text-white'
                }`}
              >
                {followed ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16">
        <h2 className="font-heading text-2xl font-bold text-brand-purple uppercase mb-6">
          Reviews
          {reviewsData?.meta.total ? (
            <span className="ml-2 text-base font-normal text-gray-400">
              ({reviewsData.meta.total})
            </span>
          ) : null}
        </h2>

        {!reviewsData?.data.length ? (
          <p className="text-gray-400 text-sm">No reviews yet for this product.</p>
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
                {review.images?.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {review.images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 pixel-border-sm overflow-hidden">
                        <Image src={img} alt="Review image" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Zoom modal — kept exactly as-is */}
      {zoomOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <div className="relative w-full max-w-2xl aspect-square">
            <Image
              src={images[selectedImage]}
              alt={product.title}
              fill
              className="object-contain"
            />
          </div>
          <button
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
            onClick={() => setZoomOpen(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
