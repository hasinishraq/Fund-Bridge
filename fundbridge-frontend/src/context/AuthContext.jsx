import { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import * as authApi from '../api/authApi'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('fb_user')
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('fb_token')
    if (!token) {
      setBootstrapping(false)
      return
    }

    const loadProfile = async () => {
      try {
        const profile = await authApi.fetchProfile()
        localStorage.setItem('fb_user', JSON.stringify(profile))
        setUser(profile)
      } catch (error) {
        console.error('Unable to fetch profile', error)
        localStorage.removeItem('fb_token')
        localStorage.removeItem('fb_user')
        setUser(null)
      } finally {
        setBootstrapping(false)
      }
    }

    loadProfile()
  }, [])

  const persistAuth = ({ token, user: nextUser }) => {
    localStorage.setItem('fb_token', token)
    localStorage.setItem('fb_user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const login = async (credentials) => {
    setLoading(true)
    try {
      const data = await authApi.login(credentials)
      persistAuth(data)
      return data
    } finally {
      setLoading(false)
    }
  }

  const register = async (payload) => {
    setLoading(true)
    try {
      const data = await authApi.register(payload)
      persistAuth(data)
      return data
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('fb_token')
    localStorage.removeItem('fb_user')
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    bootstrapping,
    login,
    register,
    logout,
  }

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
