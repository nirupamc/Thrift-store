'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuthStore } from '@/lib/authStore'
import { fetchOrders, fetchFollowedStores } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { OrderStatus, PaymentStatus } from '@/lib/types'
import { Package, Heart, ShoppingBasket, ChevronRight } from 'lucide-react'

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:   'bg-yellow-400 text-black',
  CONFIRMED: 'bg-blue-400 text-black',
  SHIPPED:   'bg-brand-purple text-white',
  DELIVERED: 'bg-green-400 text-black',
  CANCELLED: 'bg-red-400 text-white',
}

export default function ProfilePage() {
  const { isAuthenticated, hydrated } = useRequireAuth()
  const user = useAuthStore((s) => s.user)

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrders({ limit: 3 }),
    enabled: isAuthenticated,
  })

  const { data: followingData } = useQuery({
    queryKey: ['following'],
    queryFn: () => fetchFollowedStores({ limit: 50 }),
    enabled: isAuthenticated,
  })

  if (!hydrated) return null
  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Redirecting...</div>
  }

  const displayName = user?.displayName || user?.email || 'ThriftBazaar User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const totalOrders = ordersData?.meta?.total ?? ordersData?.data?.length ?? 0
  const totalFollowing = followingData?.meta?.total ?? 0
  const recentOrders = ordersData?.data?.slice(0, 3) ?? []

  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

        {/* Profile header */}
        <div className="pixel-card p-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div
              className="pixel-border w-16 h-16 flex items-center justify-center bg-brand-purple text-white font-heading text-xl font-bold flex-shrink-0 overflow-hidden"
              style={{ borderRadius: '50%' }}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-xl font-bold text-gray-900 uppercase tracking-wide truncate">
                {displayName}
              </h1>
              {user?.email && (
                <p className="text-sm text-gray-400 truncate">{user.email}</p>
              )}
              <div className="mt-2">
                <span className="inline-block px-3 py-0.5 bg-brand-saffron text-white text-xs font-bold pixel-border-sm uppercase">
                  {user?.role ?? 'BUYER'}
                </span>
              </div>
            </div>
          </div>

          {/* Vendor shortcuts */}
          {user?.role === 'VENDOR' && (
            <div className="mt-5 pt-5 border-t-2 border-gray-200 flex flex-wrap gap-3">
              <Link href="/vendor/dashboard" className="pixel-btn bg-brand-purple text-white font-bold px-4 py-2 text-sm">
                Vendor Dashboard
              </Link>
              <Link href="/vendor/products" className="pixel-btn-sm bg-white text-brand-purple font-bold px-4 py-2 text-sm pixel-border-purple">
                My Store
              </Link>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="pixel-card p-5 text-center">
            <p className="font-heading text-3xl font-bold text-brand-purple">{totalOrders}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Orders Placed</p>
          </div>
          <div className="pixel-card p-5 text-center">
            <p className="font-heading text-3xl font-bold text-brand-saffron">{totalFollowing}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Stores Following</p>
          </div>
          {user?.role === 'BUYER' && (
            <div className="pixel-card p-5 text-center col-span-2 sm:col-span-1">
              <p className="font-heading text-3xl font-bold text-gray-700">0</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Reviews Written</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-gray-900 uppercase tracking-wide">Recent Orders</h2>
            <Link href="/orders" className="text-xs text-brand-purple font-medium hover:underline">
              <span className="flex items-center gap-1">View all <ChevronRight size={12} /></span>
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="pixel-card p-8 text-center">
              <div className="mb-3"><Package size={48} className="mx-auto text-gray-300" /></div>
              <p className="font-bold text-gray-700 uppercase text-sm">No orders yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Your purchases will appear here.</p>
              <Link href="/products" className="pixel-btn bg-brand-purple text-white font-bold px-6 py-2 text-sm">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const itemCount = order.subOrders.reduce((sum, s) => sum + (s._count?.items ?? 0), 0)
                return (
                  <div key={order.id} className="pixel-card p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold pixel-border-sm ${ORDER_STATUS_STYLES[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono">
                        #{order.id.slice(-8).toUpperCase()} &middot; {itemCount} item{itemCount !== 1 ? 's' : ''} &middot;{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="font-bold text-brand-saffron">{formatPrice(Number(order.totalAmount))}</p>
                      <Link
                        href={`/orders/${order.id}`}
                        className="pixel-btn-sm bg-brand-purple text-white font-bold px-3 py-1 text-xs"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {recentOrders.length > 0 && (
            <div className="mt-4">
              <Link href="/orders" className="pixel-btn bg-brand-purple text-white font-bold px-6 py-2.5 text-sm w-full block text-center">
                View All Orders
              </Link>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="pixel-card p-5">
          <h2 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/following" className="pixel-btn-sm bg-white text-brand-purple font-bold px-4 py-2 text-sm pixel-border-purple">
              <span className="flex items-center gap-1"><Heart size={14} /> Stores I Follow</span>
            </Link>
            <Link href="/cart" className="pixel-btn-sm bg-white text-brand-saffron font-bold px-4 py-2 text-sm pixel-border-saffron">
              <span className="flex items-center gap-1"><ShoppingBasket size={14} /> My Cart</span>
            </Link>
            <Link href="/products" className="pixel-btn-sm bg-white text-gray-700 font-bold px-4 py-2 text-sm">
              Browse Products
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
