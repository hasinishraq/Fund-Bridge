import { useEffect, useState } from 'react'
import { fetchTransactions } from '../../api/walletApi'
import { CURRENCY_FORMATTER } from '../../utils/constants'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [status, setStatus] = useState('LOADING')
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchTransactions({ userId: user?.id })
        setTransactions(response || [])
        setStatus('SUCCESS')
      } catch (error) {
        console.error(error)
        setStatus('ERROR')
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'LOADING') {
    return (
      <div className="page-center">
        <Loader />
      </div>
    )
  }

  if (status === 'ERROR') {
    return (
      <section className="card error-card">
        <p>Unable to load transactions</p>
      </section>
    )
  }

  return (
    <section className="card">
      <h2>Transactions</h2>
      {transactions.length ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.type}</td>
                <td>{tx.status}</td>
                <td>{CURRENCY_FORMATTER.format(tx.amount)}</td>
                <td>{tx.currency}</td>
                <td>
                  {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No transactions to display.</p>
      )}
    </section>
  )
}

export default Transactions
