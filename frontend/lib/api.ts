import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// API methods
export const authAPI = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
}

export const tenantAPI = {
  getAll: () => api.get('/tenants'),
  getOne: (id: string) => api.get(`/tenants/${id}`),
  create: (data: {
    storeName: string
    storeUrl: string
    apiKey: string
    apiSecret: string
    accessToken?: string
  }) => api.post('/tenants', data),
  update: (id: string, data: any) => api.put(`/tenants/${id}`, data),
  sync: (id: string) => api.post(`/tenants/${id}/sync`),
  delete: (id: string) => api.delete(`/tenants/${id}`),
}

export const insightsAPI = {
  getDashboard: (tenantId: string, params?: { startDate?: string; endDate?: string }) =>
    api.get(`/insights/tenant/${tenantId}/dashboard`, { params }),
}

export const customersAPI = {
  getByTenant: (tenantId: string, params?: any) =>
    api.get(`/customers/tenant/${tenantId}`, { params }),
  getTop: (tenantId: string, limit?: number) =>
    api.get(`/customers/tenant/${tenantId}/top`, { params: { limit } }),
}

export const ordersAPI = {
  getByTenant: (tenantId: string, params?: any) =>
    api.get(`/orders/tenant/${tenantId}`, { params }),
}

export const productsAPI = {
  getByTenant: (tenantId: string, params?: any) =>
    api.get(`/products/tenant/${tenantId}`, { params }),
}

