import client from './client'

export const fetchLoans = async ({ borrowerId } = {}) => {
  const query = borrowerId ? { params: { borrowerId } } : undefined
  const { data } = await client.get('/loans', query)
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
