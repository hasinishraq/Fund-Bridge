import { useEffect, useState } from 'react'
import { fetchTransactions } from '../../api/walletApi'
import { CURRENCY_FORMATTER } from '../../utils/constants'
import Loader from '../../components/common/Loader'

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [status, setStatus] = useState('LOADING')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchTransactions()
        setTransactions(response || [])
        setStatus('SUCCESS')
      } catch (error) {
        console.error(error)
        setStatus('ERROR')
      }
    }
    load()
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
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.type}</td>
                <td>{CURRENCY_FORMATTER.format(tx.amount)}</td>
                <td>
                  {tx.createdAt
                    ? new Date(tx.createdAt).toLocaleString()
                    : 'N/A'}
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
