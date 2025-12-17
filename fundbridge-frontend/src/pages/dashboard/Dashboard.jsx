import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { applyForLoan, fetchLoans } from '../../api/loanApi'
import { fetchWalletBalance } from '../../api/walletApi'
import {
  API_STATUS,
  CURRENCY_FORMATTER,
} from '../../utils/constants'
import { validateLoanPayload } from '../../utils/validators'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'

const KYC_MESSAGES = {
  PENDING:
    'We created your verification profile. Complete the short Sumsub flow to unlock loans and payouts.',
  IN_REVIEW:
    'Our compliance partner is reviewing your submission. You will be notified as soon as it clears.',
  RESUBMIT_REQUIRED:
    'Additional documents are required. Click continue to re-open the Sumsub flow and upload the missing files.',
  REJECTED:
    'Verification was rejected. Contact support or restart the process if you have updated documentation.',
}

const heroTrend = [72, 110, 60, 140, 95, 160]

const humanizeStatus = (status) => status.replace(/_/g, ' ')

const Dashboard = () => {
  const [status, setStatus] = useState(API_STATUS.idle)
  const [error, setError] = useState('')
  const [state, setState] = useState({
    loans: [],
    wallet: null,
  })
  const { user, refreshProfile, bootstrapping } = useAuth()
  const [kycRefreshing, setKycRefreshing] = useState(false)
  const [quickLoanValues, setQuickLoanValues] = useState({
    amount: '',
    tenureMonths: '',
    purpose: '',
  })
  const [quickLoanErrors, setQuickLoanErrors] = useState({})
  const [quickLoanStatus, setQuickLoanStatus] = useState(API_STATUS.idle)
  const [quickLoanMessage, setQuickLoanMessage] = useState('')

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!user?.id) {
        if (!silent) {
          setError('Sign in to view your dashboard')
          setStatus(API_STATUS.error)
        }
        return
      }
      if (!silent) {
        setStatus(API_STATUS.loading)
        setError('')
      }
      try {
        const [loans, wallet] = await Promise.all([
          fetchLoans(),
          fetchWalletBalance({ userId: user?.id }),
        ])
        setState({ loans, wallet })
        if (!silent) {
          setStatus(API_STATUS.success)
        }
      } catch (err) {
        console.error(err)
        if (!silent) {
          setError('Unable to load dashboard')
          setStatus(API_STATUS.error)
        }
      }
    },
    [user?.id],
  )

  useEffect(() => {
    if (bootstrapping) {
      return
    }
    loadDashboard()
  }, [bootstrapping, loadDashboard])


  if (bootstrapping) {
    return (
      <div className="page-center">
        <Loader />
      </div>
    )
  }


  const kycStatus = user?.kycStatus || 'PENDING'
  const isKycApproved = kycStatus === 'APPROVED'
  const kycMessage =
    KYC_MESSAGES[kycStatus] ||
    'Complete identity verification to access all FundBridge services.'

  const disbursedLoans = useMemo(
    () => state.loans?.filter((loan) => loan.status === 'DISBURSED') || [],
    [state.loans]
  )
  const pendingLoans = useMemo(
    () => state.loans?.filter((loan) => loan.status === 'PENDING') || [],
    [state.loans]
  )
  const walletBalance = state.wallet?.balance ?? 0
  const totalBorrowed = disbursedLoans.reduce(
    (sum, loan) => sum + Number(loan.amount || 0),
    0
  )
  const pendingAmount = pendingLoans.reduce(
    (sum, loan) => sum + Number(loan.amount || 0),
    0
  )
  const averageTenure = disbursedLoans.length
    ? Math.round(
        disbursedLoans.reduce(
          (sum, loan) => sum + Number(loan.tenureMonths || 0),
          0
        ) / disbursedLoans.length
      )
    : 0
  const assetBase = walletBalance + totalBorrowed
  const borrowUtilization = assetBase
    ? Math.min(100, Math.round((totalBorrowed / assetBase) * 100))
    : 12
  const portfolioTotal = totalBorrowed + pendingAmount
  const pendingShare = portfolioTotal ? Math.round((pendingAmount / portfolioTotal) * 100) : 0
  const creditHealth =
    borrowUtilization < 30 ? 'Pristine' : borrowUtilization < 65 ? 'Healthy' : 'Watchlist'

  const loanTimeline = useMemo(
    () =>
      [...(state.loans || [])]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 6),
    [state.loans]
  )

  const lendingOpportunities = useMemo(() => {
    const collection = pendingLoans.length ? pendingLoans : state.loans || []
    return collection.slice(0, 3)
  }, [pendingLoans, state.loans])

  const handleRefreshKyc = async () => {
    setKycRefreshing(true)
    try {
      await refreshProfile()
    } finally {
      setKycRefreshing(false)
    }
  }

  const handleQuickLoanChange = (event) => {
    const { name, value } = event.target
    setQuickLoanValues((prev) => ({ ...prev, [name]: value }))
    setQuickLoanErrors((prev) => ({ ...prev, [name]: undefined }))
    setQuickLoanMessage('')
  }

  const handleQuickLoanSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validateLoanPayload(quickLoanValues)
    setQuickLoanErrors(validationErrors)
    if (Object.keys(validationErrors).length) {
      return
    }
    setQuickLoanStatus(API_STATUS.loading)
    try {
      await applyForLoan({
        amount: Number(quickLoanValues.amount),
        tenureMonths: Number(quickLoanValues.tenureMonths),
        purpose: quickLoanValues.purpose,
      })
      setQuickLoanMessage('Loan request posted to the marketplace')
      setQuickLoanValues({ amount: '', tenureMonths: '', purpose: '' })
      await loadDashboard({ silent: true })
      setQuickLoanStatus(API_STATUS.success)
    } catch (err) {
      setQuickLoanMessage(err?.response?.data?.message || 'Unable to submit loan')
      setQuickLoanStatus(API_STATUS.error)
    }
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

  const heroName = user?.name?.split(' ')[0] || 'Trailblazer'
  const highlightedLoan = loanTimeline[0]

  return (
    <div className="dashboard">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <p className="eyebrow">Welcome back, {heroName}</p>
          <h1>One control room for lending, borrowing & liquidity</h1>
          <p>
            Balance your capital, fund other members, or post your next request without switching
            screens. Everything updates live with your wallet and KYC status.
          </p>
          <div className="hero-actions">
            <Link to="/loans/apply" className="btn btn-primary hero-btn">
              Borrow now
            </Link>
            <Link to="/loans" className="btn btn-secondary hero-btn">
              Manage portfolio
            </Link>
          </div>
          <div className="hero-highlights">
            <div className="hero-highlight">
              <span>Wallet ready</span>
              <strong>{CURRENCY_FORMATTER.format(walletBalance)}</strong>
              <small className="muted">Available to deploy</small>
            </div>
            <div className="hero-highlight">
              <span>Borrow utilization</span>
              <strong>{borrowUtilization}%</strong>
              <small className="muted">of your total asset base</small>
            </div>
            <div className="hero-highlight">
              <span>Pipeline</span>
              <strong>{pendingLoans.length} live</strong>
              <small className="muted">{CURRENCY_FORMATTER.format(pendingAmount)} awaiting funding</small>
            </div>
          </div>
        </div>
        <div className="hero-balance">
          <div className="hero-balance-card">
            <span>Wallet Balance</span>
            <strong>{CURRENCY_FORMATTER.format(walletBalance)}</strong>
            <div className="hero-meta">
              <p>{CURRENCY_FORMATTER.format(totalBorrowed)} borrowed</p>
              <p>{pendingLoans.length} loans pending funding</p>
            </div>
            <div className="hero-trend" aria-hidden>
              {heroTrend.map((height, index) => (
                <span key={`trend-${index}`} style={{ height: `${height}px` }} />
              ))}
            </div>
          </div>
          {highlightedLoan && (
            <div className="hero-focus">
              <p className="eyebrow">Latest motion</p>
              <h3>{highlightedLoan.purpose || 'Funding request'}</h3>
              <div className="hero-focus-stats">
                <div>
                  <small>Amount</small>
                  <strong>{CURRENCY_FORMATTER.format(highlightedLoan.amount || 0)}</strong>
                </div>
                <div>
                  <small>Status</small>
                  <span className={`status-chip status-${highlightedLoan.status}`}>
                    {highlightedLoan.status}
                  </span>
                </div>
              </div>
              <p className="muted">
                {highlightedLoan.createdAt
                  ? new Date(highlightedLoan.createdAt).toLocaleDateString()
                  : 'Awaiting schedule'}
              </p>
            </div>
          )}
        </div>
      </section>

      {!isKycApproved && (
        <section className="card kyc-card elevated-card">
          <div>
            <p className="kyc-label">KYC Status</p>
            <h3>{humanizeStatus(kycStatus)}</h3>
            <p>{kycMessage}</p>
          </div>
          <div className="kyc-actions">
            {user?.kycReviewUrl && (
              <a
                href={user.kycReviewUrl}
                className="btn btn-primary"
                target="_blank"
                rel="noreferrer"
              >
                Continue in Sumsub
              </a>
            )}
            <Button variant="ghost" onClick={handleRefreshKyc} disabled={kycRefreshing}>
              {kycRefreshing ? 'Refreshing...' : 'Refresh status'}
            </Button>
          </div>
        </section>
      )}

      <div className="dashboard-metrics">
        <article className="metric-card">
          <p>Total Value</p>
          <h3>{CURRENCY_FORMATTER.format(walletBalance + totalBorrowed)}</h3>
          <span>{disbursedLoans.length} active loans</span>
          <div className="progress" aria-label="Borrow utilization">
            <span style={{ width: `${borrowUtilization}%` }} />
          </div>
        </article>
        <article className="metric-card">
          <p>Pending Funding</p>
          <h3>{CURRENCY_FORMATTER.format(pendingAmount)}</h3>
          <span>{pendingShare}% of portfolio</span>
          <div className="stat-chip">{pendingLoans.length} requests live</div>
        </article>
        <article className="metric-card">
          <p>Average Tenure</p>
          <h3>{averageTenure || '--'} months</h3>
          <span>Stay agile with shorter cycles</span>
          <div className="stat-chip">{pendingLoans.length + disbursedLoans.length} total deals</div>
        </article>
        <article className="metric-card">
          <p>Credit Pulse</p>
          <h3>{creditHealth}</h3>
          <span>
            {creditHealth === 'Pristine'
              ? 'Plenty of runway to borrow'
              : creditHealth === 'Healthy'
              ? 'Utilization is balanced'
              : 'Time to add liquidity'}
          </span>
          <div className="progress progress-alt" aria-label="Credit health">
            <span style={{ width: `${Math.min(100, borrowUtilization + 20)}%` }} />
          </div>
        </article>
      </div>

      <div className="quick-actions">
        <article className="quick-action-card">
          <div>
            <p className="eyebrow">Lend capital</p>
            <h3>Back a borrower</h3>
            <p>Deploy idle wallet balance across requests and earn yield instantly.</p>
          </div>
          <Link to="/loans" className="ghost-link">
            Browse loans {'->'}
          </Link>
        </article>
        <article className="quick-action-card">
          <div>
            <p className="eyebrow">Borrow</p>
            <h3>Raise fresh funds</h3>
            <p>Post a new loan ask with your terms and track approvals in real time.</p>
          </div>
          <Link to="/loans/apply" className="ghost-link">
            Post request {'->'}
          </Link>
        </article>
        <article className="quick-action-card">
          <div>
            <p className="eyebrow">Wallet</p>
            <h3>Keep liquidity ready</h3>
            <p>Top up the wallet so you can lend faster or cover repayments.</p>
          </div>
          <Link to="/wallet" className="ghost-link">
            View wallet {'->'}
          </Link>
        </article>
      </div>

      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Borrowing radar</p>
              <h3>Active + pending loans</h3>
            </div>
            <Link to="/loans" className="ghost-link">
              See all
            </Link>
          </div>
          <div className="loan-stream">
            {loanTimeline.length ? (
              loanTimeline.map((loan) => (
                <article key={loan.id || loan.createdAt} className="loan-row">
                  <div className="loan-row-main">
                    <h4>{loan.purpose || 'Untitled request'}</h4>
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
                      <small>Tenure</small>
                      <strong>{loan.tenureMonths || '--'}m</strong>
                    </div>
                    <div>
                      <span className={`status-chip status-${loan.status}`}>
                        {humanizeStatus(loan.status)}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p>No loans yet. Post a loan to get started.</p>
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Marketplace</p>
              <h3>Lending opportunities</h3>
            </div>
            <Link to="/loans" className="ghost-link">
              Fund deals
            </Link>
          </div>
          <div className="opportunity-grid">
            {lendingOpportunities.length ? (
              lendingOpportunities.map((loan, index) => (
                <article key={`op-${loan.id || index}`} className="opportunity-card">
                  <div className="opportunity-top">
                    <span className="badge">{loan.status}</span>
                    <h4>{loan.purpose || 'General purpose loan'}</h4>
                    <p>{CURRENCY_FORMATTER.format(loan.amount || 0)}</p>
                  </div>
                  <div className="opportunity-meta">
                    <div>
                      <small>Tenure</small>
                      <strong>{loan.tenureMonths || '--'} months</strong>
                    </div>
                    <div>
                      <small>Created</small>
                      <strong>
                        {loan.createdAt
                          ? new Date(loan.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </strong>
                    </div>
                  </div>
                  <Link to="/loans" className="btn btn-primary opportunity-btn">
                    Lend to this
                  </Link>
                </article>
              ))
            ) : (
              <p>No opportunities yet. Invite borrowers to post requests.</p>
            )}
          </div>
        </section>
      </div>

      <div className="dashboard-columns secondary">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Wallet pulse</p>
              <h3>Liquidity insights</h3>
            </div>
            <Link to="/wallet/transactions" className="ghost-link">
              See transactions
            </Link>
          </div>
          <ul className="wallet-pulse">
            <li>
              <span>Available for lending</span>
              <strong>{CURRENCY_FORMATTER.format(walletBalance)}</strong>
            </li>
            <li>
              <span>Borrow utilization</span>
              <strong>{borrowUtilization}%</strong>
            </li>
            <li>
              <span>Pending repayments</span>
              <strong>{pendingLoans.length}</strong>
            </li>
          </ul>
        </section>
        <section className="panel quick-loan-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Post a loan</p>
              <h3>Instant loan listing</h3>
            </div>
          </div>
          {quickLoanMessage && (
            <p className={`form-message ${quickLoanStatus === API_STATUS.error ? 'error' : 'success'}`}>
              {quickLoanMessage}
            </p>
          )}
          <form className="quick-loan-form" onSubmit={handleQuickLoanSubmit}>
            <label htmlFor="quick-amount">
              Amount
              <input
                type="number"
                id="quick-amount"
                name="amount"
                min="1"
                value={quickLoanValues.amount}
                onChange={handleQuickLoanChange}
                placeholder="5000"
              />
              {quickLoanErrors.amount && <span className="field-error">{quickLoanErrors.amount}</span>}
            </label>
            <label htmlFor="quick-tenure">
              Tenure (months)
              <input
                type="number"
                id="quick-tenure"
                name="tenureMonths"
                min="1"
                value={quickLoanValues.tenureMonths}
                onChange={handleQuickLoanChange}
                placeholder="12"
              />
              {quickLoanErrors.tenureMonths && (
                <span className="field-error">{quickLoanErrors.tenureMonths}</span>
              )}
            </label>
            <label htmlFor="quick-purpose" className="full-width">
              Purpose
              <textarea
                id="quick-purpose"
                name="purpose"
                rows="3"
                value={quickLoanValues.purpose}
                onChange={handleQuickLoanChange}
                placeholder="Working capital, equipment purchase, ..."
              />
              {quickLoanErrors.purpose && <span className="field-error">{quickLoanErrors.purpose}</span>}
            </label>
            <div className="form-actions full-width">
              <Button type="submit" disabled={quickLoanStatus === API_STATUS.loading}>
                {quickLoanStatus === API_STATUS.loading ? 'Posting...' : 'Post loan to marketplace'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default Dashboard
