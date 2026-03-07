import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Search from './pages/Search'
import Chat from './pages/Chat'
import Layout from './components/Layout'
import Summarize from './pages/Summarize'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 300000, retry: 2, refetchOnWindowFocus: false } } })
const Guard = ({ children }) => { const ok = useAuthStore(s => s.isAuthenticated); return ok ? children : <Navigate to="/login" replace /> }
const Public = ({ children }) => { const ok = useAuthStore(s => s.isAuthenticated); return ok ? <Navigate to="/dashboard" replace /> : children }

export default function App() {
  const initTheme = useThemeStore(s => s.initTheme)
  useEffect(() => { initTheme() }, [initTheme])
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Public><Login /></Public>} />
          <Route path="/register" element={<Public><Register /></Public>} />
          <Route element={<Guard><Layout /></Guard>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/search" element={<Search />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/documents/:documentId/summarize" element={<Summarize />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ className: 'dark:bg-card dark:text-foreground dark:border-border border', duration: 4000 }} />
    </QueryClientProvider>
  )
}
