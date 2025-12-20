import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import * as authApi from '../api/authApi'

const STORAGE_KEYS = {
  token: 'fb_token',
  refreshToken: 'fb_refresh_token',
  user: 'fb_user',
}

const AuthContext = createContext(null)
AuthContext.displayName = 'AuthContext'

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.warn('Unable to parse stored user', error)
    return null
  }
}

const persistAuth = ({ token, refreshToken, user }) => {
  if (!token || !refreshToken || !user) {
    throw new Error('Invalid auth payload')
  }
  localStorage.setItem(STORAGE_KEYS.token, token)
  localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken)
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
}

const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.token)
  localStorage.removeItem(STORAGE_KEYS.refreshToken)
  localStorage.removeItem(STORAGE_KEYS.user)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser())
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.token)
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken)
    if (!token && !refreshToken) {
      setBootstrapping(false)
      return
    }

    let cancelled = false
    const loadProfile = async () => {
      try {
        if (token) {
          const profile = await authApi.fetchProfile()
          if (cancelled) return
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile))
          setUser(profile)
          return
        }
        if (refreshToken) {
          const refreshed = await authApi.refreshSession({ refreshToken })
          if (cancelled) return
          persistAuth(refreshed)
          setUser(refreshed.user)
        }
      } catch (error) {
        console.error('Unable to fetch profile', error)
        clearStoredAuth()
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false)
        }
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAuthSuccess = useCallback(({ token, refreshToken, user: nextUser }) => {
    persistAuth({ token, refreshToken, user: nextUser })
    setUser(nextUser)
  }, [])

  const login = useCallback(
    async (credentials) => {
      setLoading(true)
      try {
        const data = await authApi.login(credentials)
        handleAuthSuccess(data)
        return data
      } finally {
        setLoading(false)
      }
    },
    [handleAuthSuccess],
  )

  const register = useCallback(
    async (payload) => {
      setLoading(true)
      try {
        const data = await authApi.completeRegistration(payload)
        handleAuthSuccess(data)
        return data
      } finally {
        setLoading(false)
      }
    },
    [handleAuthSuccess],
  )

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.fetchProfile()
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile))
    setUser(profile)
    return profile
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      bootstrapping,
      login,
      register,
      refreshProfile,
      logout,
    }),
    [bootstrapping, loading, login, logout, refreshProfile, register, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
