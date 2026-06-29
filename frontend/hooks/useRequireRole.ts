'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import type { UserRole } from '@/lib/types'

export function useRequireRole(role: UserRole) {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }
    if (user?.role !== role) {
      router.replace('/')
    }
  }, [hydrated, isAuthenticated, user?.role, role, router])

  return {
    authorized: hydrated && isAuthenticated && user?.role === role,
    user,
    hydrated,
  }
}
