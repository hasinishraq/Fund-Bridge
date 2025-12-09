import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import * as authApi from '../api/authApi'

const STORAGE_KEYS = {
  token: 'fb_token',
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

const persistAuth = ({ token, user }) => {
  if (!token || !user) {
    throw new Error('Invalid auth payload')
  }
  localStorage.setItem(STORAGE_KEYS.token, token)
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
}

const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.token)
  localStorage.removeItem(STORAGE_KEYS.user)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser())
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.token)
    if (!token) {
      setBootstrapping(false)
      return
    }

    let cancelled = false
    const loadProfile = async () => {
      try {
        const profile = await authApi.fetchProfile()
        if (cancelled) return
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile))
        setUser(profile)
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

  const handleAuthSuccess = useCallback(({ token, user: nextUser }) => {
    persistAuth({ token, user: nextUser })
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
        const data = await authApi.register(payload)
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
