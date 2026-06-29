import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, AuthTokens } from './types'

interface AuthState {
  user:            AuthUser | null
  accessToken:     string | null
  refreshToken:    string | null
  isAuthenticated: boolean
  vendorStoreId:   string | null

  setAuth:         (user: AuthUser, tokens: AuthTokens) => void
  setVendorStoreId:(id: string) => void
  logout:          () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,
      vendorStoreId:   null,

      setAuth: (user, tokens) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', tokens.accessToken)
        }
        set({
          user,
          accessToken:     tokens.accessToken,
          refreshToken:    tokens.refreshToken,
          isAuthenticated: true,
        })
      },

      setVendorStoreId: (id) => set({ vendorStoreId: id }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
        }
        set({
          user:            null,
          accessToken:     null,
          refreshToken:    null,
          isAuthenticated: false,
          vendorStoreId:   null,
        })
      },
    }),
    {
      name: 'thrift-auth',
      partialize: (state) => ({
        user:            state.user,
        accessToken:     state.accessToken,
        refreshToken:    state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        vendorStoreId:   state.vendorStoreId,
      }),
    },
  ),
)
