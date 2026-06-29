'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'

export function useRequireAuth() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [hydrated, isAuthenticated, router])

  return { isAuthenticated: hydrated && isAuthenticated, user, hydrated }
}
