import client from './client'

export const fetchWalletBalance = async ({ userId, currency } = {}) => {
  if (!userId) {
    throw new Error('userId is required to load wallet')
  }
  const { data } = await client.get('/wallet', {
    params: {
      userId,
      currency,
    },
  })
  return data
}

export const fetchTransactions = async ({ userId, currency } = {}) => {
  if (!userId) {
    throw new Error('userId is required to load transactions')
  }
  const { data } = await client.get('/wallet/transactions', {
    params: {
      userId,
      currency,
    },
  })
  return data
}

export const topUpWallet = async ({ amount, userId, currency, idempotencyKey } = {}) => {
  if (!userId) {
    throw new Error('userId is required to top up wallet')
  }
  const { data } = await client.post('/wallet/top-up', {
    amount,
    userId,
    currency,
    idempotencyKey,
  })
  return data
}
