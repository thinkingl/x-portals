import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  check: () => api.get('/auth/check'),
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  setup: (username: string, password: string) =>
    api.post('/auth/setup', { username, password }),
  skill: () => api.get('/auth/skill'),
}

export const portalApi = {
  list: () => api.get('/portals'),
  listPublic: () => api.get('/portals/public'),
  create: (data: any) => api.post('/portals', data),
  update: (id: number, data: any) => api.put(`/portals/${id}`, data),
  delete: (id: number) => api.delete(`/portals/${id}`),
  batchSort: (items: any[]) => api.post('/portals/sort', { items }),
}

export const groupApi = {
  list: () => api.get('/groups'),
  create: (data: any) => api.post('/groups', data),
  update: (id: number, data: any) => api.put(`/groups/${id}`, data),
  delete: (id: number) => api.delete(`/groups/${id}`),
}

export default api
