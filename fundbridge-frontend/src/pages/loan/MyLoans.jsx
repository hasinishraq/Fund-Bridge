import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchLoans } from '../../api/loanApi'
import { API_STATUS, CURRENCY_FORMATTER, LOAN_STATUS } from '../../utils/constants'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'

const statusToneMap = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  FUNDING: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  DISBURSED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ACTIVE: 'bg-sky-50 text-sky-700 border border-sky-200',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  REQUESTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  FUNDED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
  DEFAULTED: 'bg-rose-50 text-rose-700 border border-rose-200',
  CLOSED: 'bg-slate-50 text-slate-700 border border-slate-200',
  default: 'bg-slate-50 text-slate-700 border border-slate-200',
}

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A'

const MyLoans = () => {
  const { user } = useAuth()
  const [loans, setLoans] = useState([])
  const [status, setStatus] = useState(API_STATUS.loading)
  const [filters, setFilters] = useState({
    status: 'ALL',
    query: '',
    minAmount: '',
    maxAmount: '',
    sort: 'NEWEST',
  })

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setStatus(API_STATUS.error)
        return
      }
      setStatus(API_STATUS.loading)
      try {
        const response = await fetchLoans({ borrowerId: user.id })
        setLoans(response || [])
        setStatus(API_STATUS.success)
      } catch (err) {
        console.error(err)
        setStatus(API_STATUS.error)
      }
    }
    load()
  }, [user?.id])

  const filterOptions = useMemo(() => {
    const dynamicStatuses = loans.map((loan) => loan.status).filter(Boolean)
    const uniqueStatuses = Array.from(new Set([...LOAN_STATUS, ...dynamicStatuses]))
    return ['ALL', 'PENDING', ...uniqueStatuses]
  }, [loans])

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const pendingStatuses = ['REQUESTED', 'PENDING', 'APPROVED', 'FUNDING']
      const matchesStatus =
        filters.status === 'ALL' ||
        (filters.status === 'PENDING'
          ? pendingStatuses.includes(loan.status)
          : loan.status === filters.status)
      const matchesQuery =
        filters.query.trim().length === 0 ||
        (loan.purpose && loan.purpose.toLowerCase().includes(filters.query.toLowerCase())) ||
        (loan.id && String(loan.id).toLowerCase().includes(filters.query.toLowerCase()))

      const minOk =
        !filters.minAmount || Number(loan.amount) >= Number(filters.minAmount || 0)
      const maxOk =
        !filters.maxAmount || Number(loan.amount) <= Number(filters.maxAmount || Infinity)

      return matchesStatus && matchesQuery && minOk && maxOk
    })
  }, [filters.maxAmount, filters.minAmount, filters.query, filters.status, loans])

  const sortedLoans = useMemo(() => {
    const collection = [...filteredLoans]
    const getDateValue = (loan) => (loan?.createdAt ? new Date(loan.createdAt).getTime() : 0)
    const getAmount = (loan) => Number(loan?.amount || 0)

    switch (filters.sort) {
      case 'OLDEST':
        return collection.sort((a, b) => getDateValue(a) - getDateValue(b))
      case 'AMOUNT_ASC':
        return collection.sort((a, b) => getAmount(a) - getAmount(b))
      case 'AMOUNT_DESC':
        return collection.sort((a, b) => getAmount(b) - getAmount(a))
      case 'NEWEST':
      default:
        return collection.sort((a, b) => getDateValue(b) - getDateValue(a))
    }
  }, [filteredLoans, filters.sort])

  const quickFilters = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Funding', value: 'FUNDING' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Closed', value: 'CLOSED' },
  ]

  const sortOptions = [
    { label: 'Newest first', value: 'NEWEST' },
    { label: 'Oldest first', value: 'OLDEST' },
    { label: 'Amount high to low', value: 'AMOUNT_DESC' },
    { label: 'Amount low to high', value: 'AMOUNT_ASC' },
  ]

  const canResetFilters =
    filters.status !== 'ALL' ||
    filters.query ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.sort !== 'NEWEST'


  const stats = useMemo(() => {
    const total = loans.length
    const active = loans.filter((loan) => ['ACTIVE', 'DISBURSED'].includes(loan.status)).length
    const pending = loans.filter((loan) => ['REQUESTED', 'PENDING', 'FUNDING', 'APPROVED'].includes(loan.status)).length
    const totalAmount = loans.reduce((sum, loan) => sum + Number(loan.amount || 0), 0)

    return [
      { label: 'Total requests', value: total },
      { label: 'Active loans', value: active },
      { label: 'Pending approvals', value: pending },
      { label: 'Portfolio value', value: CURRENCY_FORMATTER.format(totalAmount) },
    ]
  }, [loans])

  if (status === API_STATUS.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (status === API_STATUS.error) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-rose-400/30 bg-rose-50 px-6 py-5 text-rose-800 shadow">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-rose-600">Loans</p>
        <p className="mt-2 text-lg font-semibold">Unable to load your loans</p>
        <Link to="/loans/apply" className="btn btn-primary mt-4">
          Apply for a loan
        </Link>
      </div>
    )
  }

  return (
    <div className="borrower-loans">
      <header className="loans-hero loan-animate" style={{ '--delay': '0ms' }}>
        <div className="loans-hero__row">
          <div>
            <p className="loan-eyebrow">Borrower portfolio</p>
            <h1 className="loans-title">My loans</h1>
            <p className="loans-subtitle">
              Review requests, funding progress, and repayment status in one place.
            </p>
          </div>
          <div className="loans-hero__actions">
            <Link to="/loans/apply" className="btn btn-primary">
              Apply for new loan
            </Link>
          </div>
        </div>

        <div className="loans-stats-grid">
          {stats.map((item, index) => (
            <div
              key={item.label}
              className="loans-stat loan-animate"
              style={{ '--delay': `${120 + index * 70}ms` }}
            >
              <p className="loans-stat__label">{item.label}</p>
              <p className="loans-stat__value">{item.value}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="loans-filters loan-animate" style={{ '--delay': '320ms' }}>
        <div className="loans-chip-row">
          {quickFilters.map((chip) => (
            <button
              key={chip.value}
              type="button"
              className={`loans-chip ${filters.status === chip.value ? 'is-active' : ''}`}
              onClick={() => setFilters((prev) => ({ ...prev, status: chip.value }))}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="loans-filter-grid">
          <div className="loans-filter">
            <label className="loans-label" htmlFor="loanQuery">
              Search
            </label>
            <input
              id="loanQuery"
              type="search"
              placeholder="Search by ID or purpose"
              value={filters.query}
              onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
              className="loans-input"
            />
          </div>
          <div className="loans-filter">
            <label className="loans-label" htmlFor="loanStatus">
              Status
            </label>
            <select
              id="loanStatus"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="loans-select"
            >
              {filterOptions.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusOption === 'ALL'
                  ? 'All statuses'
                  : statusOption === 'PENDING'
                    ? 'Pending (all)'
                    : statusOption}
              </option>
            ))}
            </select>
          </div>
          <div className="loans-filter loans-filter--range">
            <label className="loans-label" htmlFor="minAmount">
              Amount range
            </label>
            <div className="loans-range">
              <input
                id="minAmount"
                type="number"
                min="0"
                placeholder="Min"
                value={filters.minAmount}
                onChange={(e) => setFilters((prev) => ({ ...prev, minAmount: e.target.value }))}
                className="loans-input"
              />
              <input
                id="maxAmount"
                type="number"
                min="0"
                placeholder="Max"
                value={filters.maxAmount}
                onChange={(e) => setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))}
                className="loans-input"
              />
            </div>
          </div>
          <div className="loans-filter">
            <label className="loans-label" htmlFor="loanSort">
              Sort by
            </label>
            <select
              id="loanSort"
              value={filters.sort}
              onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
              className="loans-select"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="loans-filter loans-filter--action">
            <button
              type="button"
              className="loans-clear"
              disabled={!canResetFilters}
              onClick={() =>
                setFilters({
                  status: 'ALL',
                  query: '',
                  minAmount: '',
                  maxAmount: '',
                  sort: 'NEWEST',
                })
              }
            >
              Clear filters
            </button>
          </div>
        </div>
      </section>

      <div className="loans-summary">
        <p>
          Showing <strong>{sortedLoans.length}</strong> of <strong>{loans.length}</strong> loans
        </p>
        {filters.status !== 'ALL' && (
          <span className="loans-summary__pill">
            {filters.status === 'PENDING' ? 'Pending' : filters.status.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      <section className="loans-list loan-animate" style={{ '--delay': '420ms' }}>
        {sortedLoans.length ? (
          <div className="loans-grid">
            {sortedLoans.map((loan) => {
              const amount = Number(loan.amount || 0)
              const pledged = Number(loan.pledgedAmount || 0)
              const captured = Number(loan.capturedAmount || 0)
              const fundingProgress = amount ? Math.min(100, Math.round((pledged / amount) * 100)) : 0
              const remaining = Math.max(amount - pledged, 0)
              const statusLabel = loan.status ? loan.status.replace(/_/g, ' ') : 'N/A'

              return (
                <article
                  key={loan.id || loan.createdAt}
                  className={`loan-card-item status-${loan.status || 'default'}`}
                >
                  <header className="loan-card-item__header">
                    <div>
                      <p className="loan-card-item__id">Loan #{loan.id || 'New'}</p>
                      <h3 className="loan-card-item__title">
                        {loan.purpose || 'General purpose loan request'}
                      </h3>
                    </div>
                    <div className="loan-card-item__amount">
                      <span className="loan-card-item__amount-label">Amount</span>
                      <span className="loan-card-item__amount-value">
                        {CURRENCY_FORMATTER.format(amount)}
                      </span>
                    </div>
                  </header>

                  <div className="loan-card-item__meta">
                    <span
                      className={`loan-status-pill ${statusToneMap[loan.status] || statusToneMap.default}`}
                    >
                      {statusLabel}
                    </span>
                    <span className="loan-card-item__meta-text">
                      Created {formatDate(loan.createdAt)} |{' '}
                      {loan.tenureMonths ? `${loan.tenureMonths} months` : '--'}
                    </span>
                  </div>

                  <div className="loan-card-item__progress">
                    <div className="loan-progress__track">
                      <div className="loan-progress__fill" style={{ width: `${fundingProgress}%` }} />
                    </div>
                    <div className="loan-card-item__funding">
                      <span>Pledged {CURRENCY_FORMATTER.format(pledged)}</span>
                      <span>Captured {CURRENCY_FORMATTER.format(captured)}</span>
                    </div>
                  </div>

                  <div className="loan-card-item__metrics">
                    <div>
                      <p className="loan-card-item__label">Funding</p>
                      <p className="loan-card-item__value">{fundingProgress}%</p>
                    </div>
                    <div>
                      <p className="loan-card-item__label">Remaining</p>
                      <p className="loan-card-item__value">
                        {CURRENCY_FORMATTER.format(remaining)}
                      </p>
                    </div>
                    <div>
                      <p className="loan-card-item__label">Captured</p>
                      <p className="loan-card-item__value">
                        {CURRENCY_FORMATTER.format(captured)}
                      </p>
                    </div>
                  </div>

                  <div className="loan-card-item__actions">
                    <Link to={`/loans/${loan.id}`} className="btn btn-secondary">
                      View details
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="loans-empty">
            <h3>No loans match your filters</h3>
            <p>
              Adjust filters or{' '}
              <Link to="/loans/apply" className="loans-empty__link">
                create a new loan request
              </Link>
              .
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

export default MyLoans
