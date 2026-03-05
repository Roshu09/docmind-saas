import { create } from 'zustand'
import { persist } from 'zustand/middleware'
export const useThemeStore = create(persist(
  (set, get) => ({
    theme: 'dark',
    toggleTheme: () => {
      const next = get().theme === 'dark' ? 'light' : 'dark'
      set({ theme: next })
      document.documentElement.classList.toggle('dark', next === 'dark')
    },
    initTheme: () => { document.documentElement.classList.toggle('dark', get().theme === 'dark') },
  }),
  { name: 'aifi-theme' }
))
