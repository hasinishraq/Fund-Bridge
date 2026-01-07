import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { fetchFundings } from '../../api/fundingApi'
import { fetchLoans } from '../../api/loanApi'
import { API_STATUS, CURRENCY_FORMATTER, ROLE, getRoleHomePath } from '../../utils/constants'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : 'N/A'

const LenderOffers = () => {
  const { user, bootstrapping } = useAuth()
  const [status, setStatus] = useState(API_STATUS.idle)
  const [error, setError] = useState('')
  const [offers, setOffers] = useState([])
  const [loanLookup, setLoanLookup] = useState({})
  const [filters, setFilters] = useState({ status: 'ALL', query: '' })

  useEffect(() => {
    if (bootstrapping || user?.role !== ROLE.LENDER || !user?.id) {
      return
    }
    let cancelled = false
    const load = async () => {
      setStatus(API_STATUS.loading)
      setError('')
      try {
        const [fundings, loans] = await Promise.all([
          fetchFundings({ lenderId: user.id }),
          fetchLoans({ scope: 'LENDER' }),
        ])
        if (cancelled) return
        const lookup = (loans || []).reduce((acc, loan) => {
          if (loan?.id) {
            acc[loan.id] = loan
          }
          return acc
        }, {})
        setLoanLookup(lookup)
        setOffers(fundings || [])
        setStatus(API_STATUS.success)
      } catch (err) {
        console.error(err)
        if (cancelled) return
        setError('Unable to load your offers')
        setStatus(API_STATUS.error)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [bootstrapping, user?.id, user?.role])

  const statusOptions = useMemo(() => {
    const dynamicStatuses = offers.map((offer) => offer.status).filter(Boolean)
    return ['ALL', ...Array.from(new Set(dynamicStatuses))]
  }, [offers])

  const filteredOffers = useMemo(() => {
    const query = filters.query.trim().toLowerCase()
    return offers.filter((offer) => {
      const matchesStatus =
        filters.status === 'ALL' || offer.status === filters.status
      if (!query) {
        return matchesStatus
      }
      const loan = offer.loanId ? loanLookup[offer.loanId] : null
      const matchesId =
        offer.loanId && String(offer.loanId).toLowerCase().includes(query)
      const matchesPurpose =
        loan?.purpose && loan.purpose.toLowerCase().includes(query)
      return matchesStatus && (matchesId || matchesPurpose)
    })
  }, [filters.query, filters.status, loanLookup, offers])

  if (bootstrapping) {
    return (
      <div className="page-center">
        <Loader />
      </div>
    )
  }

  if (user?.role && user.role !== ROLE.LENDER) {
    return <Navigate to={getRoleHomePath(user.role)} replace />
  }

  if (!user?.id) {
    return (
      <div className="card error-card">
        <p>Sign in to view your offers.</p>
      </div>
    )
  }

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

  return (
    <div className="dashboard">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Offers</p>
            <h3>My offers</h3>
          </div>
          <Link to="/loans/marketplace" className="ghost-link">
            Browse marketplace
          </Link>
        </div>
        <div className="marketplace-filters">
          <div className="filter-input">
            <input
              type="search"
              placeholder="Search by loan ID or purpose"
              value={filters.query}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, query: event.target.value }))
              }
            />
          </div>
          <div className="filter-select">
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value }))
              }
            >
              {statusOptions.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption === 'ALL' ? 'All statuses' : statusOption}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Results</p>
            <h3>{filteredOffers.length} offers</h3>
          </div>
          <span className="stat-chip">{offers.length} total</span>
        </div>
        {filteredOffers.length ? (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Loan</th>
                  <th>Purpose</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Captured</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer) => {
                  const loan = offer.loanId ? loanLookup[offer.loanId] : null
                  return (
                    <tr key={offer.id || `${offer.loanId}-${offer.createdAt}`}>
                      <td>{offer.loanId || '--'}</td>
                      <td>{loan?.purpose || '--'}</td>
                      <td>{CURRENCY_FORMATTER.format(offer.amount || 0)}</td>
                      <td>
                        <span className={`status-chip status-${offer.status}`}>
                          {offer.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td>{formatDateTime(offer.createdAt)}</td>
                      <td>{formatDateTime(offer.capturedAt)}</td>
                      <td>
                        {offer.loanId ? (
                          <Link to={`/loans/${offer.loanId}`} className="ghost-link">
                            View loan
                          </Link>
                        ) : (
                          '--'
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No offers match your filters.</p>
        )}
      </section>
    </div>
  )
}

export default LenderOffers
