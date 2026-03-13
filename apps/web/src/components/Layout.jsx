import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { BarChart2, Brain, GitCompare, Key, LayoutDashboard, Files, Search, MessageSquare, LogOut, Sun, Moon, Menu, X, BookOpenCheck } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import ProfilePopup from './ProfilePopup'
import { authApi } from '../api/auth'
import toast from 'react-hot-toast'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/documents', icon: Files, label: 'Documents' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/chat', icon: MessageSquare, label: 'Ask AI' },
  { to: '/knowledge-chat', icon: BookOpenCheck, label: 'Knowledge Chat' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/compare', icon: GitCompare, label: 'Compare Docs' },
  { to: '/apikeys', icon: Key, label: 'API Keys' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, org, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Brain size={16} className="text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">AI File Intelligence</p>
            <p className="text-xs text-muted-foreground truncate">{org?.name}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`
              }>
              <Icon size={16} />
              {label}
              {to === '/knowledge-chat' && (
                <span className="ml-auto text-xs bg-violet-500/20 text-violet-500 border border-violet-500/30 px-1.5 py-0.5 rounded-full font-semibold">New</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <ProfilePopup />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary capitalize">{org?.plan} plan</span>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  )
}