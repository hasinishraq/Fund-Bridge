import client from './client'

export const fetchAdminStats = async () => {
  const { data } = await client.get('/admin/stats')
  return data
}

export const fetchUsers = async () => {
  const { data } = await client.get('/admin/users')
  return data
}

export const fetchPendingLoans = async () => {
  const { data } = await client.get('/admin/loans/pending')
  return data
}
