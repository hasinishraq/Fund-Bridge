import client from './client'

export const payInstallment = async ({ installmentId, walletTxRef } = {}) => {
  if (!installmentId) {
    throw new Error('installmentId is required')
  }
  const payload = walletTxRef ? { walletTxRef } : undefined
  const { data } = await client.post(
    `/repayments/installments/${installmentId}/pay`,
    payload,
  )
  return data
}
