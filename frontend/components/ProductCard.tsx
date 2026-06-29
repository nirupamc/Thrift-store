'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RarityBadge, ConditionBadge } from './ui/Badge'
import { formatPrice } from '@/lib/utils'
import { addToCart } from '@/lib/api'
import type { Product } from '@/lib/types'
import { Heart, Check } from 'lucide-react'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=400&q=80'

interface ProductCardProps {
  product: Product
}

function getRarityColor(rarity?: string): string {
  switch (rarity) {
    case 'VINTAGE_RARE': return '#7C3AED'
    case 'RARE':         return '#DB2777'
    case 'UNCOMMON':     return '#0891B2'
    case 'COMMON':       return '#6B7280'
    default:             return '#6B7280'
  }
}

export function ProductCard({ product }: ProductCardProps) {
  if (!product) return null

  const [liked, setLiked] = useState(false)
  const [added, setAdded] = useState(false)
  const queryClient = useQueryClient()

  const image = product.images?.[0] ?? PLACEHOLDER
  const discount = product.originalPrice && product.originalPrice > product.sellingPrice
    ? Math.round((1 - product.sellingPrice / product.originalPrice) * 100)
    : null

  const rarityColor = getRarityColor(product.rarity)
  const productHref = product.slug ? `/products/${product.slug}` : '#'

  const cartMutation = useMutation({
    mutationFn: () => addToCart(product.id),
    onSuccess: () => {
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    },
    onError: () => {
      // reset silently — no error display in card
    },
  })

  return (
    <div className="pixel-card overflow-hidden group flex flex-col">
      {/* Image area */}
      <Link href={productHref} className="relative block aspect-[3/4] overflow-hidden bg-gray-100 flex-shrink-0">
        <Image
          src={image}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* SOLD overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-wide">SOLD</span>
          </div>
        )}

        {/* Rarity game-label badge top-left */}
        {product.rarity && (
          <span
            className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 text-white"
            style={{ background: rarityColor }}
          >
            {product.rarity.replace('_', ' ')}
          </span>
        )}

        {/* Heart icon top-right */}
        <button
          onClick={(e) => { e.preventDefault(); setLiked(!liked) }}
          className="absolute top-2 right-2 w-7 h-7 bg-white/90 flex items-center justify-center text-sm pixel-border-sm"
        >
          <Heart size={14} className={liked ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>

        {/* Discount badge bottom-left */}
        {discount && product.isAvailable && (
          <div className="absolute bottom-2 left-2 bg-brand-saffron text-white text-xs font-bold px-2 py-0.5">
            -{discount}%
          </div>
        )}
      </Link>

      {/* Info area */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-xs text-gray-400 truncate">{product.store?.name}</p>

        <Link
          href={productHref}
          className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 hover:text-brand-purple"
        >
          {product.title}
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="font-black text-brand-saffron">{formatPrice(product.sellingPrice)}</span>
          {product.originalPrice && product.originalPrice > product.sellingPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {product.brand && (
          <p className="text-xs text-gray-400">{product.brand}</p>
        )}

        {/* Add to Cart button */}
        <button
          onClick={() => cartMutation.mutate()}
          disabled={!product.isAvailable || cartMutation.isPending || added}
          className="pixel-btn bg-brand-purple text-white text-xs font-bold py-2 mt-auto w-full disabled:opacity-70"
        >
          {!product.isAvailable
            ? 'SOLD'
            : cartMutation.isPending
            ? 'Adding…'
            : added
            ? <><Check size={14} className="inline mr-1" /> Added!</>
            : 'ADD TO CART'}
        </button>
      </div>
    </div>
  )
}
