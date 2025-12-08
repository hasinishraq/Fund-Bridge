import { useEffect, useState } from 'react'
import { fetchLoans } from '../../api/loanApi'
import { fetchWalletBalance } from '../../api/walletApi'
import { API_STATUS, CURRENCY_FORMATTER } from '../../utils/constants'
import Loader from '../../components/common/Loader'

const Dashboard = () => {
  const [status, setStatus] = useState(API_STATUS.idle)
  const [error, setError] = useState('')
  const [state, setState] = useState({
    loans: [],
    wallet: null,
  })

  useEffect(() => {
    const loadDashboard = async () => {
      setStatus(API_STATUS.loading)
      try {
        const [loans, wallet] = await Promise.all([
          fetchLoans(),
          fetchWalletBalance(),
        ])
        setState({ loans, wallet })
        setStatus(API_STATUS.success)
      } catch (err) {
        console.error(err)
        setError('Unable to load dashboard')
        setStatus(API_STATUS.error)
      }
    }
    loadDashboard()
  }, [])

  if (status === API_STATUS.loading) {
    return (
      <div className="page-center">
        <Loader />
      </div>
    )
  }

  if (status === API_STATUS.error) {
    return (
      <div className="card error-card">
        <p>{error}</p>
      </div>
    )
  }

  const disbursedLoans =
    state.loans?.filter((loan) => loan.status === 'DISBURSED') || []
  const pendingLoans =
    state.loans?.filter((loan) => loan.status === 'PENDING') || []
  const walletBalance = state.wallet?.balance ?? 0

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="card stat-card">
          <p>Total Loans</p>
          <h3>{state.loans?.length || 0}</h3>
        </div>
        <div className="card stat-card">
          <p>Active Loans</p>
          <h3>{disbursedLoans.length}</h3>
        </div>
        <div className="card stat-card">
          <p>Pending Approvals</p>
          <h3>{pendingLoans.length}</h3>
        </div>
        <div className="card stat-card">
          <p>Wallet Balance</p>
          <h3>{CURRENCY_FORMATTER.format(walletBalance)}</h3>
        </div>
      </div>

      <section className="card">
        <h3>Recent Loans</h3>
        {state.loans?.length ? (
          <table>
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {state.loans.slice(0, 5).map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.id}</td>
                  <td>{CURRENCY_FORMATTER.format(loan.amount)}</td>
                  <td>
                    <span className={`status-chip status-${loan.status}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td>
                    {loan.createdAt
                      ? new Date(loan.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No loans yet. Apply for your first loan.</p>
        )}
      </section>
    </div>
  )
}

export default Dashboard
