import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { createFunding } from '../../api/fundingApi'
import { fetchLoans } from '../../api/loanApi'
import {
  API_STATUS,
  CURRENCY_FORMATTER,
  LOAN_STATUS,
  ROLE,
  getRoleHomePath,
} from '../../utils/constants'
import Loader from '../../components/common/Loader'
import Modal from '../../components/common/Modal'
import { useAuth } from '../../context/AuthContext'

const humanizeStatus = (status) => (status ? status.replace(/_/g, ' ') : 'PENDING')

const buildIdempotencyKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fund-${Date.now()}`

const getPledgedAmount = (loan) => Number(loan?.pledgedAmount ?? loan?.capturedAmount ?? 0)
const getCapturedAmount = (loan) => Number(loan?.capturedAmount ?? 0)
const getOutstandingFunding = (loan) =>
  Math.max(Number(loan?.amount || 0) - getPledgedAmount(loan), 0)

const formatRate = (rate) =>
  rate || rate === 0 ? `${Number(rate).toFixed(2)}%` : '--'

const isOfferable = (loan) =>
  ['PENDING', 'REQUESTED', 'FUNDING', 'APPROVED'].includes(loan?.status) &&
  getOutstandingFunding(loan) > 0

const LoanMarketplace = () => {
  const { user, bootstrapping } = useAuth()
  const [status, setStatus] = useState(API_STATUS.idle)
  const [error, setError] = useState('')
  const [loans, setLoans] = useState([])
  const [offerLoan, setOfferLoan] = useState(null)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerStatus, setOfferStatus] = useState(API_STATUS.idle)
  const [offerMessage, setOfferMessage] = useState('')
  const [filters, setFilters] = useState({
    status: 'ALL',
    query: '',
    minAmount: '',
    maxAmount: '',
    minRate: '',
    maxRate: '',
    minTenure: '',
    maxTenure: '',
  })

  const loadMarketplace = useCallback(
    async ({ silent = false, onCancel } = {}) => {
      if (bootstrapping || user?.role !== ROLE.LENDER || !user?.id) {
        return
      }
      if (!silent) {
        setStatus(API_STATUS.loading)
        setError('')
      }
      try {
        const response = await fetchLoans({ scope: 'LENDER' })
        if (onCancel?.()) return
        setLoans(response || [])
        if (!silent) {
          setStatus(API_STATUS.success)
        }
      } catch (err) {
        console.error(err)
        if (onCancel?.()) return
        if (!silent) {
          setError('Unable to load the marketplace')
          setStatus(API_STATUS.error)
        }
      }
    },
    [bootstrapping, user?.id, user?.role],
  )

  useEffect(() => {
    let cancelled = false
    loadMarketplace({ onCancel: () => cancelled })
    return () => {
      cancelled = true
    }
  }, [loadMarketplace])

  const marketplaceLoans = useMemo(
    () =>
      [...loans].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      ),
    [loans],
  )
  const statusOptions = useMemo(() => {
    const dynamicStatuses = marketplaceLoans.map((loan) => loan.status).filter(Boolean)
    const uniqueStatuses = Array.from(new Set([...LOAN_STATUS, ...dynamicStatuses]))
    return ['ALL', ...uniqueStatuses]
  }, [marketplaceLoans])
  const filteredLoans = useMemo(() => {
    return marketplaceLoans.filter((loan) => {
      const matchesStatus = filters.status === 'ALL' || loan.status === filters.status
      const query = filters.query.trim().toLowerCase()
      const matchesQuery =
        query.length === 0 ||
        (loan.purpose && loan.purpose.toLowerCase().includes(query)) ||
        (loan.id && String(loan.id).toLowerCase().includes(query))

      const minAmountOk =
        !filters.minAmount || Number(loan.amount || 0) >= Number(filters.minAmount || 0)
      const maxAmountOk =
        !filters.maxAmount || Number(loan.amount || 0) <= Number(filters.maxAmount || Infinity)
      const minRateOk =
        !filters.minRate ||
        Number(loan.interestRatePercent || 0) >= Number(filters.minRate || 0)
      const maxRateOk =
        !filters.maxRate ||
        Number(loan.interestRatePercent || 0) <= Number(filters.maxRate || Infinity)
      const minTenureOk =
        !filters.minTenure || Number(loan.tenureMonths || 0) >= Number(filters.minTenure || 0)
      const maxTenureOk =
        !filters.maxTenure || Number(loan.tenureMonths || 0) <= Number(filters.maxTenure || Infinity)

      return (
        matchesStatus &&
        matchesQuery &&
        minAmountOk &&
        maxAmountOk &&
        minRateOk &&
        maxRateOk &&
        minTenureOk &&
        maxTenureOk
      )
    })
  }, [
    filters.maxAmount,
    filters.maxRate,
    filters.maxTenure,
    filters.minAmount,
    filters.minRate,
    filters.minTenure,
    filters.query,
    filters.status,
    marketplaceLoans,
  ])
  const offerRemaining = offerLoan ? getOutstandingFunding(offerLoan) : 0

  const handleOpenOffer = (loan) => {
    setOfferLoan(loan)
    const outstanding = getOutstandingFunding(loan)
    setOfferAmount(outstanding ? String(outstanding) : '')
    setOfferStatus(API_STATUS.idle)
    setOfferMessage('')
  }

  const handleCloseOffer = () => {
    setOfferLoan(null)
    setOfferAmount('')
    setOfferStatus(API_STATUS.idle)
    setOfferMessage('')
  }

  const handleSubmitOffer = async (event) => {
    event.preventDefault()
    if (!offerLoan?.id) {
      return
    }
    const amountValue = Number(offerAmount)
    if (!amountValue || amountValue <= 0) {
      setOfferMessage('Enter a valid offer amount.')
      setOfferStatus(API_STATUS.error)
      return
    }
    const outstanding = getOutstandingFunding(offerLoan)
    if (outstanding && amountValue > outstanding) {
      setOfferMessage('Offer exceeds remaining funding need.')
      setOfferStatus(API_STATUS.error)
      return
    }
    setOfferStatus(API_STATUS.loading)
    setOfferMessage('')
    try {
      await createFunding({
        loanId: offerLoan.id,
        lenderId: user?.id,
        amount: amountValue,
        idempotencyKey: buildIdempotencyKey(),
        walletTxRef: null,
      })
      setOfferStatus(API_STATUS.success)
      setOfferMessage('Offer submitted successfully.')
      await loadMarketplace({ silent: true })
    } catch (err) {
      console.error(err)
      setOfferStatus(API_STATUS.error)
      setOfferMessage(err?.response?.data?.message || 'Unable to submit offer.')
    }
  }

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
        <p>Sign in to view the loan marketplace.</p>
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
            <p className="eyebrow">Marketplace</p>
            <h3>Loan marketplace</h3>
          </div>
          <Link to="/dashboard/lender" className="ghost-link">
            Back to dashboard
          </Link>
        </div>
        <p className="muted">
          Browse every loan posted by borrowers and filter by amount, rate, or tenure.
        </p>
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
          <div className="filter-range">
            <div>
              <label htmlFor="market-min-amount">Min amount</label>
              <input
                id="market-min-amount"
                type="number"
                min="0"
                value={filters.minAmount}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, minAmount: event.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="market-max-amount">Max amount</label>
              <input
                id="market-max-amount"
                type="number"
                min="0"
                value={filters.maxAmount}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, maxAmount: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="filter-range">
            <div>
              <label htmlFor="market-min-rate">Min rate (%)</label>
              <input
                id="market-min-rate"
                type="number"
                min="0"
                step="0.1"
                value={filters.minRate}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, minRate: event.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="market-max-rate">Max rate (%)</label>
              <input
                id="market-max-rate"
                type="number"
                min="0"
                step="0.1"
                value={filters.maxRate}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, maxRate: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="filter-range">
            <div>
              <label htmlFor="market-min-tenure">Min tenure (m)</label>
              <input
                id="market-min-tenure"
                type="number"
                min="0"
                value={filters.minTenure}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, minTenure: event.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="market-max-tenure">Max tenure (m)</label>
              <input
                id="market-max-tenure"
                type="number"
                min="0"
                value={filters.maxTenure}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, maxTenure: event.target.value }))
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Results</p>
            <h3>{filteredLoans.length} loans</h3>
          </div>
          <span className="stat-chip">{marketplaceLoans.length} total</span>
        </div>
        <div className="loan-stream">
          {filteredLoans.length ? (
            filteredLoans.map((loan) => (
              <article key={loan.id || loan.createdAt} className="loan-row">
                <div className="loan-row-main">
                  <h4>{loan.purpose || 'Funding request'}</h4>
                  <p className="muted">
                    {loan.createdAt
                      ? new Date(loan.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'No date'}
                  </p>
                </div>
                <div className="loan-row-details">
                  <div>
                    <small>Amount</small>
                    <strong>{CURRENCY_FORMATTER.format(loan.amount || 0)}</strong>
                  </div>
                  <div>
                    <small>Rate</small>
                    <strong>{formatRate(loan.interestRatePercent)}</strong>
                  </div>
                  <div>
                    <small>Tenure</small>
                    <strong>{loan.tenureMonths || '--'}m</strong>
                  </div>
                  <div>
                    <small>Borrower</small>
                    <strong>{loan.borrowerId ? `#${loan.borrowerId}` : '--'}</strong>
                  </div>
                  <div>
                    <small>Risk score</small>
                    <strong>
                      {loan.creditScore
                        ? `${loan.creditScore}${loan.creditGrade ? ` (${loan.creditGrade})` : ''}`
                        : '--'}
                    </strong>
                  </div>
                  <div>
                    <span className={`status-chip status-${loan.status}`}>
                      {humanizeStatus(loan.status)}
                    </span>
                  </div>
                </div>
                <div className="loan-progress">
                  <small>
                    Committed {CURRENCY_FORMATTER.format(getPledgedAmount(loan))} of{' '}
                    {CURRENCY_FORMATTER.format(loan.amount || 0)} (remaining{' '}
                    {CURRENCY_FORMATTER.format(getOutstandingFunding(loan))})
                  </small>
                  <div className="progress" aria-label="Funding progress">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (getPledgedAmount(loan) / Math.max(Number(loan.amount || 0), 1)) *
                              100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="loan-row-actions">
                  {isOfferable(loan) ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleOpenOffer(loan)}
                    >
                      Submit offer
                    </button>
                  ) : (
                    <button type="button" className="btn btn-secondary" disabled>
                      Offer closed
                    </button>
                  )}
                  <Link to={`/loans/${loan.id}`} className="btn btn-ghost">
                    View details
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p>No loans match your filters. Adjust your search or ranges.</p>
          )}
        </div>
      </section>

      <Modal
        open={Boolean(offerLoan)}
        title="Submit offer"
        onClose={handleCloseOffer}
      >
        {offerLoan && (
          <>
            <div className="details-grid">
              <div>
                <p className="muted">Loan</p>
                <strong>{offerLoan.purpose || `Loan #${offerLoan.id}`}</strong>
              </div>
              <div>
                <p className="muted">Amount</p>
                <strong>{CURRENCY_FORMATTER.format(offerLoan.amount || 0)}</strong>
              </div>
              <div>
                <p className="muted">Remaining</p>
                <strong>{CURRENCY_FORMATTER.format(offerRemaining)}</strong>
              </div>
            </div>
            <form className="grid-form" onSubmit={handleSubmitOffer}>
              <label htmlFor="offer-amount" className="full-width">
                Offer amount
                <input
                  id="offer-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={offerAmount}
                  onChange={(event) => setOfferAmount(event.target.value)}
                  placeholder="Enter amount to pledge"
                />
              </label>
              {offerMessage && (
                <p
                  className={`full-width form-message ${offerStatus === API_STATUS.error ? 'error' : 'success'}`}
                >
                  {offerMessage}
                </p>
              )}
              <div className="form-actions full-width">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCloseOffer}
                  disabled={offerStatus === API_STATUS.loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={offerStatus === API_STATUS.loading}
                >
                  {offerStatus === API_STATUS.loading ? 'Submitting...' : 'Submit offer'}
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  )
}

export default LoanMarketplace
