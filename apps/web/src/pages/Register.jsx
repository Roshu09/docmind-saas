import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, Sun, Moon } from 'lucide-react'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', orgName: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const setField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) return toast.error('Password must be 8+ characters')
    setLoading(true)
    try {
      const { data } = await authApi.register(form)
      setAuth(data.data.user, data.data.org, data.data.accessToken)
      toast.success('Workspace created!')
      console.log('NAVIGATING TO VERIFY EMAIL')
      setTimeout(() => navigate('/verify-email'), 100)
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  const fields = [
    { k: 'fullName', l: 'Full Name', t: 'text', p: 'John Doe' },
    { k: 'email', l: 'Email', t: 'email', p: 'you@example.com' },
    { k: 'orgName', l: 'Organization Name', t: 'text', p: 'My Company' },
    { k: 'password', l: 'Password', t: 'password', p: '8+ characters' },
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <button onClick={toggleTheme} className="fixed top-4 right-4 p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
            <Brain size={24} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your workspace</h1>
          <p className="text-muted-foreground mt-1 text-sm">Start analyzing documents with AI</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ k, l, t, p }) => (
              <div key={k} className="space-y-1.5">
                <label className="text-sm font-medium">{l}</label>
                <input type={t} placeholder={p} value={form[k]} onChange={setField(k)} required
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors" />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors mt-2">
              {loading ? 'Creating workspace...' : 'Create workspace'}
            </button>
          </form>
        </div>
        <p className="text-center mt-6 text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
