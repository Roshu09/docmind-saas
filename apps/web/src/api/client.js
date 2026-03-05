import axios from 'axios'
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const client = axios.create({ baseURL: BASE, withCredentials: true, timeout: 60000 })
client.interceptors.request.use(config => {
  const raw = localStorage.getItem('aifi-auth')
  if (raw) { try { const { state } = JSON.parse(raw); if (state?.accessToken) config.headers.Authorization = `Bearer ${state.accessToken}` } catch {} }
  return config
})
client.interceptors.response.use(res => res, async err => {
  if (err.response?.status === 401 && !err.config._retry) {
    err.config._retry = true
    try {
      const { data } = await axios.post(`${BASE}/api/auth/refresh`, {}, { withCredentials: true })
      const raw = localStorage.getItem('aifi-auth')
      if (raw) { const p = JSON.parse(raw); p.state.accessToken = data.data.accessToken; p.state.isAuthenticated = true; localStorage.setItem('aifi-auth', JSON.stringify(p)) }
      err.config.headers.Authorization = `Bearer ${data.data.accessToken}`
      return client.request(err.config)
    } catch { localStorage.removeItem('aifi-auth'); window.location.href = '/login' }
  }
  return Promise.reject(err)
})
export default client
