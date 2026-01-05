import client from './client'

export const fetchLoans = async ({
  borrowerId,
  scope,
  statuses,
  query,
  minAmount,
  maxAmount,
  minRate,
  maxRate,
  minTenure,
  maxTenure,
} = {}) => {
  const params = {}
  if (borrowerId) {
    params.borrowerId = borrowerId
  }
  if (scope) {
    params.scope = scope
  }
  if (statuses?.length) {
    params.status = Array.isArray(statuses) ? statuses.join(',') : statuses
  }
  if (query) {
    params.query = query
  }
  if (minAmount !== undefined && minAmount !== null && minAmount !== '') {
    params.minAmount = minAmount
  }
  if (maxAmount !== undefined && maxAmount !== null && maxAmount !== '') {
    params.maxAmount = maxAmount
  }
  if (minRate !== undefined && minRate !== null && minRate !== '') {
    params.minRate = minRate
  }
  if (maxRate !== undefined && maxRate !== null && maxRate !== '') {
    params.maxRate = maxRate
  }
  if (minTenure !== undefined && minTenure !== null && minTenure !== '') {
    params.minTenure = minTenure
  }
  if (maxTenure !== undefined && maxTenure !== null && maxTenure !== '') {
    params.maxTenure = maxTenure
  }
  const { data } = await client.get('/loans', { params })
  return data
}

export const fetchLoanDetails = async (loanId) => {
  const { data } = await client.get(`/loans/${loanId}`)
  return data
}

export const applyForLoan = async (payload) => {
  const { data } = await client.post('/loans', payload)
  return data
}

export const updateLoanStatus = async ({ loanId, status }) => {
  const { data } = await client.patch(`/loans/${loanId}`, { status })
  return data
}
