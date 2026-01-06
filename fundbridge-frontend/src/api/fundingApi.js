import client from './client'

export const createFunding = async ({
  loanId,
  lenderId,
  amount,
  idempotencyKey,
  walletTxRef,
} = {}) => {
  const { data } = await client.post('/funding', {
    loanId,
    lenderId,
    amount,
    idempotencyKey,
    walletTxRef,
  })
  return data
}

export const fetchFundings = async ({ lenderId, loanId } = {}) => {
  const params = {}
  if (lenderId) {
    params.lenderId = lenderId
  }
  if (loanId) {
    params.loanId = loanId
  }
  const { data } = await client.get('/funding', { params })
  return data
}
