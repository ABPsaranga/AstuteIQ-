import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'admin' | 'user'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  avatarUrl?: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isReady: boolean

  setAuth: (user: AuthUser, token: string) => void
  logout: () => void
  setReady: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isReady: false,

      setAuth: (user, token) =>
        set({
          user,
          token,
          isReady: true,
        }),

      // ✅ Proper logout (used by Navbar)
      logout: () =>
        set({
          user: null,
          token: null,
          isReady: true,
        }),

      setReady: () => set({ isReady: true }),
    }),
    {
      name: 'astuteiq-auth',

      // persist only necessary data
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),

      onRehydrateStorage: () => (state) => {
        state?.setReady()
      },
    }
  )
)