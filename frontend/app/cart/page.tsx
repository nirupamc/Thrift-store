'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCart, removeFromCart } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useCartStore } from '@/lib/cartStore'
import { ShoppingBasket, ChevronRight } from 'lucide-react'

const PLATFORM_FEE_PERCENT = 10

export default function CartPage() {
  const { isAuthenticated, hydrated } = useRequireAuth()
  const queryClient = useQueryClient()
  const setCartCount = useCartStore((s) => s.setCount)
  const decrementCart = useCartStore((s) => s.decrement)

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (cart) setCartCount(cart.itemCount)
  }, [cart, setCartCount])

  const removeMutation = useMutation({
    mutationFn: (productId: string) => removeFromCart(productId),
    onSuccess: () => {
      decrementCart()
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  if (!hydrated || (!isAuthenticated && hydrated)) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Redirecting...</div>
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-brand-cream min-h-screen">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  const isEmpty = !cart || cart.itemCount === 0

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="mb-4"><ShoppingBasket size={72} className="mx-auto text-gray-300" /></div>
        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2 uppercase tracking-wide">Cart Is Empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven&apos;t added anything yet.</p>
        <Link
          href="/products"
          className="pixel-btn bg-brand-purple text-white font-bold px-8 py-3"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-8 uppercase flex items-center gap-2">
          <ShoppingBasket size={28} /> Your Cart
          <span className="ml-1 text-base font-normal text-gray-400 normal-case">({cart.itemCount} items)</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items grouped by vendor */}
          <div className="lg:col-span-2 space-y-6">
            {cart.groups.map((group) => (
              <div key={group.vendorId} className="pixel-card overflow-hidden">
                {/* Store header */}
                <div className="pixel-section-header px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-brand-cream/70 uppercase tracking-wide">Store</p>
                    <Link
                      href={`/stores/${group.storeId}`}
                      className="font-bold text-brand-cream hover:underline"
                    >
                      {group.storeName}
                    </Link>
                  </div>
                  <p className="text-sm text-brand-cream/80">
                    Subtotal: <span className="font-bold text-brand-cream">{formatPrice(group.subtotal)}</span>
                  </p>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100">
                  {group.items.map((item) => (
                    <div key={item.productId} className="flex gap-4 p-4">
                      <div className="relative w-20 h-20 flex-shrink-0 pixel-border-sm overflow-hidden bg-gray-100">
                        {item.images?.[0] ? (
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">{item.title}</p>
                        {item.brand && <p className="text-xs text-gray-400 mt-0.5">{item.brand}</p>}
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">{item.condition.replace('_', ' ').toLowerCase()}</p>
                        <p className="font-bold text-brand-purple mt-1">{formatPrice(item.sellingPrice)}</p>
                      </div>

                      <button
                        onClick={() => removeMutation.mutate(item.productId)}
                        disabled={removeMutation.isPending}
                        className="self-start text-gray-400 hover:text-red-500 transition-colors text-lg leading-none p-1 font-bold"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div>
            <div className="pixel-card p-6 sticky top-24 space-y-4">
              <h2 className="font-bold text-gray-900 text-lg uppercase tracking-wide">Order Summary</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({cart.itemCount} items)</span>
                  <span className="font-medium">{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
                  <span>included</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Shipping</span>
                  <span>calculated at checkout</span>
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-4 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-brand-saffron text-lg">{formatPrice(cart.total)}</span>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Platform fee of {PLATFORM_FEE_PERCENT}% goes to ThriftBazaar
              </p>

              <Link
                href="/checkout"
                className="pixel-btn bg-brand-saffron text-white font-bold py-3.5 block w-full text-center"
              >
                <span className="flex items-center gap-2 justify-center">Proceed to Checkout <ChevronRight size={16} /></span>
              </Link>

              <Link
                href="/products"
                className="block w-full text-center text-sm text-gray-500 hover:text-brand-purple mt-2"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
