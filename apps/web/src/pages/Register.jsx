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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
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
        <div className="bg-card border border-border rounded-xl p-5 sm:p-8 shadow-sm">
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
          <div className='relative my-4'><div className='absolute inset-0 flex items-center'><div className='w-full border-t border-border'></div></div><div className='relative flex justify-center text-xs'><span className='bg-card px-2 text-muted-foreground'>or continue with</span></div></div>
          <a href='https://docmind.space/api/auth/google' className='flex items-center justify-center gap-3 w-full py-2.5 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium'><svg width='18' height='18' viewBox='0 0 48 48'><path fill='#FFC107' d='M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z'/><path fill='#FF3D00' d='m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z'/><path fill='#4CAF50' d='M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z'/><path fill='#1976D2' d='M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z'/></svg> Continue with Google</a>
        </div>
        <p className="text-center mt-6 text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
