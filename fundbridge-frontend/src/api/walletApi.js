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

export const createStripeTopUpIntent = async ({
  amount,
  userId,
  currency,
  idempotencyKey,
  referenceId,
  metadata,
} = {}) => {
  if (!userId) {
    throw new Error('userId is required to create a Stripe top up intent')
  }
  const { data } = await client.post('/payments/stripe/top-up', {
    amount,
    userId,
    currency,
    idempotencyKey,
    referenceId,
    metadata,
  })
  return data
}

export const confirmStripePayment = async ({ paymentIntentId, userId } = {}) => {
  if (!paymentIntentId || !userId) {
    throw new Error('paymentIntentId and userId are required to confirm Stripe payment')
  }
  const { data } = await client.post('/payments/stripe/confirm', {
    paymentIntentId,
    userId,
  })
  return data
}

export const createSslcommerzTopUpIntent = async ({
  amount,
  userId,
  currency,
  idempotencyKey,
  referenceId,
  customerName,
  customerEmail,
  customerPhone,
} = {}) => {
  if (!userId) {
    throw new Error('userId is required to create an SSLCommerz top up intent')
  }
  const { data } = await client.post('/payments/sslcommerz/top-up', {
    amount,
    userId,
    currency,
    idempotencyKey,
    referenceId,
    customerName,
    customerEmail,
    customerPhone,
  })
  return data
}

export const validateSslcommerzPayment = async ({ tranId, userId } = {}) => {
  if (!tranId || !userId) {
    throw new Error('tranId and userId are required to confirm SSLCommerz payment')
  }
  const { data } = await client.post('/payments/sslcommerz/validate', {
    tranId,
    userId,
  })
  return data
}
