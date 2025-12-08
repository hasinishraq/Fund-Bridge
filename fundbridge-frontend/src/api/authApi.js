import client from './client'

export const login = async (credentials) => {
  const { data } = await client.post('/auth/login', credentials)
  return data
}

export const register = async (payload) => {
  const { data } = await client.post('/auth/register', payload)
  return data
}

export const fetchProfile = async () => {
  const { data } = await client.get('/auth/me')
  return data
}
