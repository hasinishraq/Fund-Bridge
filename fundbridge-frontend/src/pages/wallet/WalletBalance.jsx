import { useEffect, useState } from 'react'
import { fetchWalletBalance, topUpWallet } from '../../api/walletApi'
import Button from '../../components/common/Button'
import { CURRENCY_FORMATTER } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

const WalletBalance = () => {
  const [wallet, setWallet] = useState(null)
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('LOADING')
  const [message, setMessage] = useState('')
  const { user } = useAuth()

  const loadWallet = async () => {
    try {
      const response = await fetchWalletBalance({ userId: user?.id })
      setWallet(response)
      setStatus('SUCCESS')
    } catch (error) {
      console.error(error)
      setStatus('ERROR')
    }
  }

  useEffect(() => {
    loadWallet()
    // We intentionally skip user as a dependency to avoid refetch loops while the profile bootstraps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTopUp = async (event) => {
    event.preventDefault()
    if (!amount || Number(amount) <= 0) {
      setMessage('Enter an amount greater than 0')
      return
    }
    setStatus('LOADING')
    setMessage('')
    try {
      await topUpWallet({
        amount: Number(amount),
        userId: user?.id,
        currency: wallet?.currency,
      })
      setAmount('')
      setMessage('Wallet funded successfully')
      await loadWallet()
    } catch (error) {
      console.error(error)
      setMessage('Unable to top up wallet')
      setStatus('SUCCESS')
    }
  }

  if (status === 'LOADING') {
    return (
      <section className="card">
        <p>Loading wallet...</p>
      </section>
    )
  }

  if (status === 'ERROR') {
    return (
      <section className="card error-card">
        <p>Unable to load wallet information</p>
      </section>
    )
  }

  return (
    <section className="card">
      <h2>Wallet</h2>
      <p className="muted">
        {wallet?.currency || '---'} • Status: <strong>{wallet?.status || 'UNKNOWN'}</strong>
      </p>
      <h1>{CURRENCY_FORMATTER.format(wallet?.balance ?? 0)}</h1>
      <p className="muted">
        Held: {CURRENCY_FORMATTER.format(wallet?.held ?? 0)} • Updated:{' '}
        {wallet?.updatedAt ? new Date(wallet.updatedAt).toLocaleString() : '—'}
      </p>
      <form className="wallet-topup" onSubmit={handleTopUp}>
        <label htmlFor="topupAmount" className="visually-hidden">
          Top up amount
        </label>
        <input
          id="topupAmount"
          type="number"
          min="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Enter amount"
        />
        <Button type="submit">Top Up</Button>
      </form>
      {message && <p className="form-message success">{message}</p>}
    </section>
  )
}

export default WalletBalance
