import axios from 'axios'

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').trim()
const sanitizedBaseUrl = rawBaseUrl.replace(/\/+$/, '')
const API_BASE_URL = /\/api(\/|$)/i.test(sanitizedBaseUrl)
  ? sanitizedBaseUrl
  : `${sanitizedBaseUrl}/api`

const STORAGE_KEYS = {
  token: 'fb_token',
  refreshToken: 'fb_refresh_token',
  user: 'fb_user',
}

const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.token)
  localStorage.removeItem(STORAGE_KEYS.refreshToken)
  localStorage.removeItem(STORAGE_KEYS.user)
}

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
  const token = localStorage.getItem(STORAGE_KEYS.token)
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }
  return config
})

let refreshPromise = null

const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise
  }
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken)
  if (!refreshToken) {
    return null
  }
  refreshPromise = axios
    .post(`${API_BASE_URL}/auth/token/refresh`, { refreshToken })
    .then((response) => {
      const { token, refreshToken: nextRefresh, user } = response.data || {}
      if (token) {
        localStorage.setItem(STORAGE_KEYS.token, token)
        client.defaults.headers.common.Authorization = `Bearer ${token}`
      }
      if (nextRefresh) {
        localStorage.setItem(STORAGE_KEYS.refreshToken, nextRefresh)
      }
      if (user) {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
      }
      return token
    })
    .catch((error) => {
      clearStoredAuth()
      throw error
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true
      try {
        const newToken = await refreshAccessToken()
        if (newToken) {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          }
          return client(originalRequest)
        }
      } catch (refreshError) {
        // fall through to clear auth below
      }
    }

    if (status === 401) {
      clearStoredAuth()
    }
    return Promise.reject(error)
  },
)

export default client
