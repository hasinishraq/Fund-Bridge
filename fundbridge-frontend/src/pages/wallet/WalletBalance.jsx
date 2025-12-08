import { useEffect, useState } from 'react'
import { fetchWalletBalance, topUpWallet } from '../../api/walletApi'
import Button from '../../components/common/Button'
import { CURRENCY_FORMATTER } from '../../utils/constants'

const WalletBalance = () => {
  const [wallet, setWallet] = useState(null)
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('LOADING')
  const [message, setMessage] = useState('')

  const loadWallet = async () => {
    try {
      const response = await fetchWalletBalance()
      setWallet(response)
      setStatus('SUCCESS')
    } catch (error) {
      console.error(error)
      setStatus('ERROR')
    }
  }

  useEffect(() => {
    loadWallet()
  }, [])

  const handleTopUp = async (event) => {
    event.preventDefault()
    if (!amount || Number(amount) <= 0) {
      setMessage('Enter an amount greater than 0')
      return
    }
    setStatus('LOADING')
    try {
      await topUpWallet({ amount: Number(amount) })
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
      <p className="muted">Current balance</p>
      <h1>{CURRENCY_FORMATTER.format(wallet?.balance ?? 0)}</h1>
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
