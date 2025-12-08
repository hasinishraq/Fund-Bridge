import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchLoans } from '../../api/loanApi'
import { CURRENCY_FORMATTER, LOAN_STATUS } from '../../utils/constants'
import Loader from '../../components/common/Loader'

const MyLoans = () => {
  const [loans, setLoans] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchLoans()
        setLoans(response || [])
      } catch (err) {
        console.error(err)
        setError('Unable to load loans')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredLoans =
    statusFilter === 'ALL'
      ? loans
      : loans.filter((loan) => loan.status === statusFilter)

  if (loading) {
    return (
      <div className="page-center">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card error-card">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <section className="card">
      <header className="card-header">
        <div>
          <h2>My Loans</h2>
          <p>Track all your loan applications in one place.</p>
        </div>
        <div>
          <label htmlFor="statusFilter" className="visually-hidden">
            Filter by status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            {LOAN_STATUS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </header>

      {filteredLoans.length ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredLoans.map((loan) => (
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
                <td>
                  <Link to={`/loans/${loan.id}`} className="link">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No loans match this filter.</p>
      )}
    </section>
  )
}

export default MyLoans
