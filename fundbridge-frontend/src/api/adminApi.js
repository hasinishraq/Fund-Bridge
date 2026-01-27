import client from './client'

export const fetchAdminActions = async (params = {}) => {
  const { data } = await client.get('/admin/actions', { params })
  return data
}

export const createAdminAction = async (payload) => {
  const { data } = await client.post('/admin/actions', payload)
  return data
}

export const fetchAdminAuditLogs = async (params = {}) => {
  const { data } = await client.get('/admin/audit-logs', { params })
  return data
}

export const createAdminAuditLog = async (payload) => {
  const { data } = await client.post('/admin/audit-logs', payload)
  return data
}

export const fetchAdminDashboardOverview = async (params = {}) => {
  const { data } = await client.get('/admin/dashboard/overview', { params })
  return data
}
