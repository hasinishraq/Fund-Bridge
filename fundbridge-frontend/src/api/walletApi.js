import client from './client'

export const fetchWalletBalance = async ({ userId, currency } = {}) => {
  const { data } = await client.get('/wallet', {
    params: {
      userId,
      currency,
    },
  })
  return data
}

export const fetchTransactions = async ({ userId, currency } = {}) => {
  const { data } = await client.get('/wallet/transactions', {
    params: {
      userId,
      currency,
    },
  })
  return data
}

export const topUpWallet = async ({ amount, userId, currency, idempotencyKey } = {}) => {
  const { data } = await client.post('/wallet/top-up', {
    amount,
    userId,
    currency,
    idempotencyKey,
  })
  return data
}
