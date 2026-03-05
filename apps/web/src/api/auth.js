import client from './client'
export const authApi = {
  login: (email, password) => client.post('/api/auth/login', { email, password }),
  register: (data) => client.post('/api/auth/register', data),
  logout: () => client.post('/api/auth/logout'),
  me: () => client.get('/api/auth/me'),
}
