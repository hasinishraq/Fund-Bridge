import axios from 'axios'

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').trim()
const sanitizedBaseUrl = rawBaseUrl.replace(/\/+$/, '')
const API_BASE_URL = /\/api(\/|$)/i.test(sanitizedBaseUrl)
  ? sanitizedBaseUrl
  : `${sanitizedBaseUrl}/api`

const client = axios.create({
  baseURL: `${API_BASE_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
})

client.interceptors.request.use((config) => {
  if (config.url?.startsWith('/')) {
    config.url = config.url.slice(1)
  }
  const token = localStorage.getItem('fb_token')
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fb_token')
      localStorage.removeItem('fb_user')
    }
    return Promise.reject(error)
  },
)

export default client
