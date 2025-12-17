import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { fetchLoans } from '../../api/loanApi'
import { fetchWalletBalance } from '../../api/walletApi'
import {
  API_STATUS,
  CURRENCY_FORMATTER,
  ROLE,
  getRoleHomePath,
} from '../../utils/constants'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'

const heroTrend = [65, 120, 80, 150, 110, 170]

const humanizeStatus = (status) => (status ? status.replace(/_/g, ' ') : 'PENDING')

const sumAmounts = (collection = []) =>
  collection.reduce((sum, loan) => sum + Number(loan.amount || 0), 0)

const LenderDashboard = () => {
  const { user, bootstrapping } = useAuth()
  const [status, setStatus] = useState(API_STATUS.idle)
  const [error, setError] = useState('')
  const [state, setState] = useState({ loans: [], wallet: null })

  useEffect(() => {
    if (bootstrapping || user?.role !== ROLE.LENDER || !user?.id) {
      return
    }
    let cancelled = false
    const load = async () => {
      setStatus(API_STATUS.loading)
      setError('')
      try {
        const [loans, wallet] = await Promise.all([
          fetchLoans(),
          fetchWalletBalance({ userId: user?.id }),
        ])
        if (cancelled) return
        setState({ loans: loans || [], wallet })
        setStatus(API_STATUS.success)
      } catch (err) {
        console.error(err)
        if (cancelled) return
        setError('Unable to load lender dashboard')
        setStatus(API_STATUS.error)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [bootstrapping, user?.id, user?.role])

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
        <p>Sign in to view your lender dashboard.</p>
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

  const loans = state.loans || []
  const fundingQueue = useMemo(
    () => loans.filter((loan) => ['PENDING', 'FUNDING'].includes(loan.status)),
    [loans],
  )
  const activeDeals = useMemo(
    () => loans.filter((loan) => ['DISBURSED', 'ACTIVE'].includes(loan.status)),
    [loans],
  )
  const completedDeals = useMemo(
    () =>
      loans
        .filter((loan) => loan.status === 'CLOSED')
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)),
    [loans],
  )
  const walletBalance = state.wallet?.balance ?? 0
  const fundingQueueAmount = sumAmounts(fundingQueue)
  const activeExposure = sumAmounts(activeDeals)
  const avgTenure = activeDeals.length
    ? Math.round(
        activeDeals.reduce((sum, loan) => sum + Number(loan.tenureMonths || 0), 0) /
          activeDeals.length,
      )
    : 0
  const monthlyCashflow = activeDeals.reduce((sum, loan) => {
    const tenure = Number(loan.tenureMonths || 0)
    if (!tenure) {
      return sum
    }
    return sum + Number(loan.amount || 0) / tenure
  }, 0)
  const completionRate = loans.length
    ? Math.round((completedDeals.length / loans.length) * 100)
    : 0
  const queueShare = fundingQueueAmount
    ? Math.round(
        (fundingQueueAmount / Math.max(activeExposure + fundingQueueAmount, 1)) * 100,
      )
    : 0
  const coverageRatio = activeExposure
    ? Math.min(150, Math.round((walletBalance / Math.max(activeExposure, 1)) * 100))
    : walletBalance
    ? 150
    : 0
  const avgTicket = activeDeals.length
    ? Math.round(activeExposure / Math.max(activeDeals.length, 1))
    : 0
  const borrowerLeaderboard = useMemo(() => {
    const summary = new Map()
    activeDeals.forEach((loan) => {
      const borrowerLabel =
        loan.borrowerName ||
        loan.borrower?.name ||
        (loan.borrowerId ? `Borrower ${loan.borrowerId}` : 'Borrower')
      const key = loan.borrowerId || borrowerLabel
      const entry = summary.get(key) || { borrower: borrowerLabel, volume: 0, deals: 0 }
      entry.volume += Number(loan.amount || 0)
      entry.deals += 1
      summary.set(key, entry)
    })
    return Array.from(summary.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 3)
  }, [activeDeals])
  const highlightedOpportunities = fundingQueue.slice(0, 4)
  const recentMaturities = completedDeals.slice(0, 5)
  const heroName = user?.name?.split(' ')[0] || 'Investor'
  const nextOpportunity = highlightedOpportunities[0]

  return (
    <div className="dashboard">
      <section className="dashboard-hero lender-hero">
        <div className="hero-copy">
          <p className="eyebrow">Welcome back, {heroName}</p>
          <h1>Deploy capital with precision</h1>
          <p>
            Evaluate pipeline health, balance wallet liquidity, and stay ahead of repayments
            without jumping between tools.
          </p>
          <div className="hero-actions">
            <Link to="/wallet" className="btn btn-primary hero-btn">
              Manage wallet
            </Link>
            <a href="#funding-queue" className="btn btn-secondary hero-btn">
              Review pipeline
            </a>
          </div>
          <div className="hero-highlights">
            <div className="hero-highlight">
              <span>Capital ready</span>
              <strong>{CURRENCY_FORMATTER.format(walletBalance)}</strong>
              <small className="muted">Liquid to deploy</small>
            </div>
            <div className="hero-highlight">
              <span>Coverage</span>
              <strong>{coverageRatio}%</strong>
              <small className="muted">vs active exposure</small>
            </div>
            <div className="hero-highlight">
              <span>Pipeline</span>
              <strong>{fundingQueue.length} deals</strong>
              <small className="muted">{CURRENCY_FORMATTER.format(fundingQueueAmount)} in queue</small>
            </div>
          </div>
        </div>
        <div className="hero-balance">
          <div className="hero-balance-card">
            <span>Capital ready</span>
            <strong>{CURRENCY_FORMATTER.format(walletBalance)}</strong>
            <div className="hero-meta">
              <p>{activeDeals.length} active deals</p>
              <p>{fundingQueue.length} awaiting commitments</p>
            </div>
            <div className="hero-trend" aria-hidden>
              {heroTrend.map((height, index) => (
                <span key={`trend-${index}`} style={{ height: `${height}px` }} />
              ))}
            </div>
          </div>
          <div className="hero-focus">
            <p className="eyebrow">Next opportunity</p>
            {nextOpportunity ? (
              <>
                <h3>{nextOpportunity.purpose || 'Funding request'}</h3>
                <div className="hero-focus-stats">
                  <div>
                    <small>Amount</small>
                    <strong>{CURRENCY_FORMATTER.format(nextOpportunity.amount || 0)}</strong>
                  </div>
                  <div>
                    <small>Tenure</small>
                    <strong>{nextOpportunity.tenureMonths || '--'}m</strong>
                  </div>
                  <div>
                    <small>Status</small>
                    <span className={`status-chip status-${nextOpportunity.status}`}>
                      {humanizeStatus(nextOpportunity.status)}
                    </span>
                  </div>
                </div>
                <p className="muted">
                  {nextOpportunity.createdAt
                    ? new Date(nextOpportunity.createdAt).toLocaleDateString()
                    : 'Awaiting schedule'}
                </p>
              </>
            ) : (
              <>
                <h3>Fully deployed</h3>
                <p className="muted">
                  Every tracked request has already received commitments. Invite borrowers to
                  publish new deals to keep capital working.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="dashboard-metrics">
        <article className="metric-card">
          <p>Active exposure</p>
          <h3>{CURRENCY_FORMATTER.format(activeExposure)}</h3>
          <span>{activeDeals.length} deals in play</span>
          <div className="progress" aria-label="Utilization">
            <span style={{ width: `${Math.min(100, coverageRatio)}%` }} />
          </div>
        </article>
        <article className="metric-card">
          <p>Pending queue</p>
          <h3>{CURRENCY_FORMATTER.format(fundingQueueAmount)}</h3>
          <span>{queueShare}% of total pipeline</span>
          <div className="stat-chip">{fundingQueue.length} requests live</div>
        </article>
        <article className="metric-card">
          <p>Average ticket size</p>
          <h3>{avgTicket ? CURRENCY_FORMATTER.format(avgTicket) : '--'}</h3>
          <span>{avgTenure || '--'} month average tenure</span>
          <div className="stat-chip">{completedDeals.length} matured deals</div>
        </article>
        <article className="metric-card">
          <p>Monthly cash yield</p>
          <h3>{CURRENCY_FORMATTER.format(monthlyCashflow)}</h3>
          <span>Projected repayments</span>
          <div className="progress progress-alt" aria-label="Completion rate">
            <span style={{ width: `${completionRate}%` }} />
          </div>
        </article>
      </div>

      <div className="dashboard-columns">
        <section className="panel" id="funding-queue">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Marketplace</p>
              <h3>Live funding queue</h3>
            </div>
            <Link to="/wallet" className="ghost-link">
              Manage wallet
            </Link>
          </div>
          <div className="loan-stream">
            {fundingQueue.length ? (
              fundingQueue.map((loan) => (
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
              <p>All monitored requests are fully funded. Stay tuned for the next wave.</p>
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Portfolio</p>
              <h3>Liquidity radar</h3>
            </div>
            <span className="ghost-link">Coverage {coverageRatio}%</span>
          </div>
          <ul className="wallet-pulse">
            <li>
              <span>Available to deploy</span>
              <strong>{CURRENCY_FORMATTER.format(walletBalance)}</strong>
            </li>
            <li>
              <span>Projected 30d repayments</span>
              <strong>{CURRENCY_FORMATTER.format(monthlyCashflow)}</strong>
            </li>
            <li>
              <span>Completion rate</span>
              <strong>{completionRate}%</strong>
            </li>
          </ul>
        </section>
      </div>

      <div className="dashboard-columns secondary">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Relationships</p>
              <h3>Borrower leaderboard</h3>
            </div>
          </div>
          {borrowerLeaderboard.length ? (
            <table>
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Deals</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {borrowerLeaderboard.map((entry) => (
                  <tr key={entry.borrower}>
                    <td>{entry.borrower}</td>
                    <td>{entry.deals}</td>
                    <td>{CURRENCY_FORMATTER.format(entry.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Fund a borrower to start tracking relationship health.</p>
          )}
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Recently closed</p>
              <h3>Matured deals</h3>
            </div>
          </div>
          <div className="loan-stream">
            {recentMaturities.length ? (
              recentMaturities.map((loan) => (
                <article key={`matured-${loan.id || loan.updatedAt}`} className="loan-row">
                  <div className="loan-row-main">
                    <h4>{loan.purpose || 'Loan'}</h4>
                    <p className="muted">
                      {loan.updatedAt
                        ? new Date(loan.updatedAt).toLocaleDateString()
                        : 'No timeline'}
                    </p>
                  </div>
                  <div className="loan-row-details">
                    <div>
                      <small>Amount</small>
                      <strong>{CURRENCY_FORMATTER.format(loan.amount || 0)}</strong>
                    </div>
                    <div>
                      <small>Status</small>
                      <span className={`status-chip status-${loan.status}`}>
                        {humanizeStatus(loan.status)}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p>No deals have matured yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default LenderDashboard
