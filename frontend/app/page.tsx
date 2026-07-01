'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { animate } from 'framer-motion'
import { useInView } from 'framer-motion'
import { fetchProducts, fetchStores } from '@/lib/api'
import { ProductCard } from '@/components/ProductCard'
import { StoreCard } from '@/components/StoreCard'
import { ProductCardSkeleton, StoreCardSkeleton } from '@/components/ui/Skeleton'
import { Shirt, Footprints, Sparkles, Monitor, Truck, BadgeCheck, RotateCcw, Flame, Store, Zap, Star } from 'lucide-react'
import { fadeUp, staggerContainer } from '@/components/motion/variants'

// ─── Count-up stat ────────────────────────────────────────────────────────────

function CountUpStat({ label, value }: { label: string; value: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const numericMatch = value.match(/^[\d,]+/)
  const numericVal = numericMatch ? parseInt(numericMatch[0].replace(/,/g, ''), 10) : 0
  const suffix = value.replace(/^[\d,]+/, '')
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!isInView) return
    const controls = animate(0, numericVal, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v).toLocaleString('en-IN')),
    })
    return controls.stop
  }, [isInView, numericVal])

  return (
    <div ref={ref}>
      <div className="text-brand-saffron font-heading text-3xl font-bold">{display}{suffix}</div>
      <div className="text-white/60 text-xs uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'trending'],
    queryFn: () => fetchProducts({ limit: 8, sortBy: 'views', sortOrder: 'desc' }),
  })

  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['stores', 'featured'],
    queryFn: () => fetchStores({ limit: 6 }),
  })

  return (
    <div>

      {/* ── Section 1: Hero ─────────────────────────────────────────────────── */}
      <section className="bg-brand-cream px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="pixel-border bg-brand-cream relative overflow-hidden lg:flex lg:items-center lg:gap-0">

            {/* Left: text + CTAs — stagger in */}
            <motion.div
              className="lg:w-1/2 p-8 md:p-12 relative"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.p variants={fadeUp} className="font-heading text-5xl md:text-7xl font-black text-brand-purple leading-none uppercase">
                GOOD CLOTHES.
              </motion.p>
              <motion.p variants={fadeUp} className="font-heading text-5xl md:text-7xl font-black text-brand-saffron leading-none uppercase">
                GOOD KARMA.
              </motion.p>
              <motion.p variants={fadeUp} className="font-heading text-2xl md:text-3xl font-bold text-gray-700 uppercase tracking-widest mt-2">
                THRIFT BAZAAR.
              </motion.p>

              {/* Scattered decorative icons */}
              <span className="absolute top-4 right-4 pointer-events-none select-none opacity-30"><Shirt size={36} /></span>
              <span className="absolute bottom-16 left-4 pointer-events-none select-none opacity-30"><Footprints size={28} /></span>
              <span className="absolute top-1/2 right-8 pointer-events-none select-none opacity-30"><Sparkles size={24} /></span>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mt-8">
                <Link href="/products" className="pixel-btn font-bold px-6 py-3">
                  SHOP NOW →
                </Link>
                <Link href="/auth/register" className="pixel-btn-rust font-bold px-6 py-3">
                  SELL YOUR CLOSET
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: WinXP window frame */}
            <motion.div
              className="lg:w-1/2 p-8 md:p-12"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            >
              <div className="pixel-border">
                {/* Title bar */}
                <div
                  style={{ background: 'linear-gradient(to right, #2C2A28, #3B7A57)' }}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span className="text-white text-xs font-bold tracking-wide flex items-center gap-1.5"><Monitor size={12} /> Thrift Mode — On</span>
                  <div className="flex gap-1">
                    <span className="w-3 h-3 bg-golden inline-block" />
                    <span className="w-3 h-3 bg-moss inline-block" />
                    <span className="w-3 h-3 bg-rust inline-block" />
                  </div>
                </div>
                {/* Content */}
                <div className="bg-brand-cream p-4">
                  <img
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"
                    alt="Trending thrift find"
                    className="w-full aspect-[4/3] object-cover pixel-border"
                  />
                </div>
                {/* Status bar */}
                <div
                  style={{ borderTop: '2px solid #2C2A28' }}
                  className="bg-sand flex gap-2 px-3 py-1 text-xs text-charcoal"
                >
                  <span className="flex items-center gap-1"><Shirt size={12} /> 1,247 items</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Star size={12} /> 4.9 avg</span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Section 2: Features bar ─────────────────────────────────────────── */}
      <section className="bg-brand-purple py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-6 text-center">
          <span className="text-brand-cream font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <Truck size={16} /> PAN INDIA SHIPPING
          </span>
          <span className="hidden sm:inline text-brand-cream/40 font-bold">|</span>
          <span className="text-brand-cream font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <BadgeCheck size={16} /> QUALITY CHECKED
          </span>
          <span className="hidden sm:inline text-brand-cream/40 font-bold">|</span>
          <span className="text-brand-cream font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <RotateCcw size={16} /> EASY RETURNS
          </span>
        </div>
      </section>

      {/* ── Section 3: Stats strip — count-up on scroll ─────────────────────── */}
      <section className="bg-charcoal text-white py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-10 text-center">
          {[
            { label: 'Curated Items', value: '10,000+' },
            { label: 'Thrift Stores', value: '500+' },
            { label: 'Happy Buyers', value: '25,000+' },
            { label: 'Cities', value: '50+' },
          ].map(({ label, value }) => (
            <CountUpStat key={label} label={label} value={value} />
          ))}
        </div>
      </section>

      {/* ── Section 4: Trending Finds ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="pixel-border p-1">
          {/* Section header */}
          <div className="pixel-section-header flex items-center justify-between px-4 py-2">
            <span className="flex items-center gap-2"><Flame size={20} /> TRENDING FINDS</span>
            <Link href="/products" className="pixel-btn-sm bg-white text-brand-purple px-4 py-1 font-bold">
              View All →
            </Link>
          </div>

          <div className="p-4">
            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                {productsData?.data.map((product) => (
                  <motion.div key={product.id} variants={fadeUp}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            <div className="mt-8 text-center sm:hidden">
              <Link href="/products" className="text-brand-purple font-medium hover:underline">
                View all products →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Featured Stores ──────────────────────────────────────── */}
      <section className="bg-brand-cream py-16 px-4">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide mb-1 flex items-center gap-2">
                <Store size={24} /> FEATURED STORES
              </h2>
              <p className="text-brand-saffron text-xs font-bold uppercase tracking-widest">
                Discover independent sellers
              </p>
            </div>
            <Link href="/stores" className="pixel-btn-sm bg-white text-brand-purple px-4 py-1 font-bold hidden sm:inline-block">
              All stores →
            </Link>
          </div>

          {storesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <StoreCardSkeleton key={i} />)}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {storesData?.data.map((store) => (
                <motion.div key={store.id} variants={fadeUp}>
                  <StoreCard store={store} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Section 6: Newsletter ───────────────────────────────────────────── */}
      <section className="bg-brand-purple py-16 px-4 text-center">
        <h2 className="font-heading text-3xl font-bold text-brand-saffron uppercase flex items-center justify-center gap-2">
          JOIN THE THRIFT CULT <Zap size={24} />
        </h2>
        <p className="text-brand-cream/80 text-sm mt-2 mb-6">
          Get early access to drops, vintage finds &amp; exclusive deals.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <input
            type="email"
            placeholder="your@email.com"
            className="pixel-input bg-white px-4 py-3 text-sm w-full max-w-sm"
          />
          <button className="pixel-btn-rust font-bold px-6 py-3">
            SUBSCRIBE
          </button>
        </div>
      </section>

    </div>
  )
}
