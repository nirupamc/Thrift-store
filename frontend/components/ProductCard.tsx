'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { RarityBadge } from './ui/Badge'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/lib/types'
import { Heart } from 'lucide-react'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=400&q=80'

interface ProductCardProps {
  product: Product
}

function getRarityColor(rarity?: string): string {
  switch (rarity) {
    case 'VINTAGE_RARE': return '#5557CB'
    case 'RARE':         return '#D9B04A'
    case 'UNCOMMON':     return '#C4683D'
    case 'COMMON':       return '#9CA3AF'
    default:             return '#9CA3AF'
  }
}

export function ProductCard({ product }: ProductCardProps) {
  if (!product) return null

  const [liked, setLiked] = useState(false)

  const image = product.images?.[0] ?? PLACEHOLDER
  const discount = product.originalPrice && product.originalPrice > product.sellingPrice
    ? Math.round((1 - product.sellingPrice / product.originalPrice) * 100)
    : null

  const rarityColor = getRarityColor(product.rarity)
  const productHref = product.slug ? `/products/${product.slug}` : '#'

  return (
    <motion.div
      className="pixel-card overflow-hidden group flex flex-col"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Image area */}
      <Link href={productHref} className="relative block aspect-[3/4] overflow-hidden bg-gray-100 flex-shrink-0">
        <Image
          src={image}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* SOLD overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-wide">SOLD</span>
          </div>
        )}

        {/* Rarity badge — springs in on mount */}
        {product.rarity && (
          <motion.span
            className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 text-white"
            style={{ background: rarityColor }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
          >
            {product.rarity.replace('_', ' ')}
          </motion.span>
        )}

        {/* Heart button — spring bounce on toggle */}
        <motion.button
          onClick={(e) => { e.preventDefault(); setLiked(!liked) }}
          className="absolute top-2 right-2 w-7 h-7 bg-white/90 flex items-center justify-center text-sm pixel-border-sm"
          whileTap={{ scale: 1.4 }}
          animate={liked ? { scale: [1, 1.35, 1] } : {}}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <Heart size={14} className={liked ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </motion.button>

        {/* Discount badge */}
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
          <span className="font-mono text-lg tracking-wide text-brand-saffron">{formatPrice(product.sellingPrice)}</span>
          {product.originalPrice && product.originalPrice > product.sellingPrice && (
            <span className="font-mono text-sm text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {product.brand && (
          <p className="text-xs text-gray-400">{product.brand}</p>
        )}

        {/* VIEW ITEM button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="mt-auto"
        >
          <Link
            href={`/products/${product.slug}`}
            className="pixel-btn bg-brand-purple text-white text-xs font-bold py-2 text-center block"
            onClick={(e) => e.stopPropagation()}
          >
            VIEW ITEM
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}
