import client from './client'

export const fetchWalletBalance = async () => {
  const { data } = await client.get('/wallet')
  return data
}

export const fetchTransactions = async () => {
  const { data } = await client.get('/wallet/transactions')
  return data
}

export const topUpWallet = async ({ amount }) => {
  const { data } = await client.post('/wallet/top-up', { amount })
  return data
}
