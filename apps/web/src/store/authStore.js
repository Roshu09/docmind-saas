import { create } from 'zustand'
import { persist } from 'zustand/middleware'
export const useAuthStore = create(persist(
  (set) => ({
    user: null, org: null, accessToken: null, isAuthenticated: false,
    setAuth: (user, org, accessToken) => set({ user, org, accessToken, isAuthenticated: true }),
    setTokens: (accessToken) => set({ accessToken }),
    logout: () => set({ user: null, org: null, accessToken: null, isAuthenticated: false }),
  }),
  { name: 'aifi-auth', partialize: (s) => ({ user: s.user, org: s.org, accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }) }
))
