import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { applyForLoan, fetchLoans } from '../../api/loanApi'
import { fetchWalletBalance } from '../../api/walletApi'
import { API_STATUS, CURRENCY_FORMATTER } from '../../utils/constants'
import { validateLoanPayload } from '../../utils/validators'
import Loader from '../../components/common/Loader'
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

const statusToneMap = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
  RESUBMIT_REQUIRED: 'bg-amber-50 text-amber-700 border border-amber-200',
  DISBURSED: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  default: 'bg-slate-50 text-slate-700 border border-slate-200',
}

const getStatusTone = (status) => statusToneMap[status] || statusToneMap.default

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'No date'

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

  const kycStatus = user?.kycStatus || 'PENDING'
  const isKycApproved = kycStatus === 'APPROVED'
  const kycMessage =
    KYC_MESSAGES[kycStatus] ||
    'Complete identity verification to access all FundBridge services.'

  const disbursedLoans = useMemo(
    () => state.loans?.filter((loan) => loan.status === 'DISBURSED') || [],
    [state.loans],
  )
  const pendingLoans = useMemo(
    () => state.loans?.filter((loan) => loan.status === 'PENDING') || [],
    [state.loans],
  )
  const walletBalance = state.wallet?.balance ?? 0
  const totalBorrowed = disbursedLoans.reduce(
    (sum, loan) => sum + Number(loan.amount || 0),
    0,
  )
  const pendingAmount = pendingLoans.reduce(
    (sum, loan) => sum + Number(loan.amount || 0),
    0,
  )
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
    [state.loans],
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

  if (bootstrapping || status === API_STATUS.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (status === API_STATUS.error) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-rose-400/30 bg-rose-500/10 px-6 py-5 text-rose-50 shadow-lg">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-rose-100/80">Dashboard</p>
        <p className="mt-2 text-lg font-semibold">{error}</p>
      </div>
    )
  }

  const heroName = user?.name?.split(' ')[0] || 'Trailblazer'
  const highlightedLoan = loanTimeline[0]
  const heroStats = [
    {
      label: 'Wallet ready',
      value: CURRENCY_FORMATTER.format(walletBalance),
      hint: 'Available to deploy',
    },
    {
      label: 'Borrow utilization',
      value: `${borrowUtilization}%`,
      hint: 'of your total asset base',
    },
    {
      label: 'Pipeline',
      value: `${pendingLoans.length} live`,
      hint: `${CURRENCY_FORMATTER.format(pendingAmount)} awaiting funding`,
    },
  ]

  return (
    <div className="relative space-y-6 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Dashboard
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Hello, {heroName}</h1>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Wallet {CURRENCY_FORMATTER.format(walletBalance)}
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {pendingLoans.length} pending
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Quick view of balances, loans, and requests. Post a new ask or review activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/loans/apply"
            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            New loan request
          </Link>
          <Link
            to="/loans"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-[1px] hover:border-indigo-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            View all loans
          </Link>
        </div>
      </div>

      {!isKycApproved && (
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800 shadow-sm">
          <div className="space-y-1">
            <p className="text-[0.7rem] uppercase tracking-[0.18em] text-amber-600">KYC status</p>
            <h3 className="text-lg font-semibold">{humanizeStatus(kycStatus)}</h3>
            <p className="max-w-3xl text-sm text-amber-700">{kycMessage}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {user?.kycReviewUrl && (
              <a
                href={user.kycReviewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                Continue in Sumsub
              </a>
            )}
            <button
              type="button"
              onClick={handleRefreshKyc}
              disabled={kycRefreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition hover:-translate-y-[1px] hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {kycRefreshing ? 'Refreshing...' : 'Refresh status'}
            </button>
          </div>
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50 p-6 shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-[0.7rem] uppercase tracking-[0.22em] text-slate-500">
                Welcome back, {heroName}
              </p>
              <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
                One clear view of your borrowing & lending
              </h1>
              <p className="max-w-2xl text-sm text-slate-600">
                Keep an eye on balances, requests, and approvals without hunting through screens.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.75rem] text-slate-600 shadow-sm">
              {isKycApproved ? 'KYC ready' : `KYC: ${humanizeStatus(kycStatus)}`}
            </span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.hint}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Wallet balance</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">
                  {CURRENCY_FORMATTER.format(walletBalance)}
                </p>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-right text-xs text-indigo-700">
                <p>{CURRENCY_FORMATTER.format(totalBorrowed)} borrowed</p>
                <p>{pendingLoans.length} loans pending</p>
              </div>
            </div>
            <div className="mt-4 flex items-end gap-1.5">
              {heroTrend.map((height, index) => (
                <span
                  key={`trend-${index}-${height}`}
                  className="h-14 w-2 rounded-full bg-gradient-to-t from-indigo-200 via-indigo-300 to-sky-200 shadow-[0_6px_16px_rgba(99,102,241,0.18)]"
                  style={{ height: Math.max(32, height * 0.55) }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded-full bg-slate-100 px-2 py-1">Available: {CURRENCY_FORMATTER.format(walletBalance)}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">Borrowed: {CURRENCY_FORMATTER.format(totalBorrowed)}</span>
            </div>
          </div>

          {highlightedLoan && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Latest motion</p>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {highlightedLoan.purpose || 'Funding request'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {highlightedLoan.createdAt
                      ? new Date(highlightedLoan.createdAt).toLocaleDateString()
                      : 'Awaiting schedule'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(
                    highlightedLoan.status,
                  )}`}
                >
                  {humanizeStatus(highlightedLoan.status)}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Amount</p>
                  <p className="text-base font-semibold text-slate-900">
                    {CURRENCY_FORMATTER.format(highlightedLoan.amount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Tenure</p>
                  <p className="text-base font-semibold text-slate-900">
                    {highlightedLoan.tenureMonths || '--'} months
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Timeline</p>
                  <p className="text-base font-semibold text-slate-900">
                    {formatDate(highlightedLoan.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Total value</p>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-600">
              {disbursedLoans.length} active loans
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {CURRENCY_FORMATTER.format(walletBalance + totalBorrowed)}
          </p>
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
              style={{ width: `${borrowUtilization}%` }}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Pending funding</p>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
              {pendingLoans.length} requests live
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {CURRENCY_FORMATTER.format(pendingAmount)}
          </p>
          <p className="text-sm text-slate-500">{pendingShare}% of portfolio</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Credit pulse</p>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-600">
              {creditHealth}
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {creditHealth === 'Pristine'
              ? 'Great runway'
              : creditHealth === 'Healthy'
              ? 'Balanced'
              : 'Add liquidity'}
          </p>
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-300"
              style={{ width: `${Math.min(100, borrowUtilization + 20)}%` }}
            />
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[
          {
            title: 'Back a borrower',
            eyebrow: 'Lend capital',
            copy: 'Deploy idle wallet balance across requests and earn yield instantly.',
            to: '/loans',
          },
          {
            title: 'Raise fresh funds',
            eyebrow: 'Borrow',
            copy: 'Post a new loan ask with your terms and track approvals in real time.',
            to: '/loans/apply',
          },
        ].map((card) => (
          <article
            key={card.title}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-[2px]"
          >
            <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">
              {card.eyebrow}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{card.title}</h3>
            <p className="text-sm text-slate-600">{card.copy}</p>
            <Link
              to={card.to}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 transition group-hover:text-slate-900"
            >
              Go now →
            </Link>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">
                Borrowing radar
              </p>
              <h3 className="text-xl font-semibold text-slate-900">Active + pending loans</h3>
            </div>
            <Link to="/loans" className="text-sm font-semibold text-indigo-700 hover:text-slate-900">
              See all
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {loanTimeline.length ? (
              loanTimeline.map((loan) => (
                <article
                  key={loan.id || loan.createdAt}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">
                        {loan.purpose || 'Untitled request'}
                      </h4>
                      <p className="text-xs text-slate-500">{formatDate(loan.createdAt)}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(
                        loan.status,
                      )}`}
                    >
                      {humanizeStatus(loan.status)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Amount</p>
                      <p className="font-semibold text-slate-900">
                        {CURRENCY_FORMATTER.format(loan.amount || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Tenure</p>
                      <p className="font-semibold text-slate-900">
                        {loan.tenureMonths || '--'} months
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Status</p>
                      <p className="font-semibold text-slate-900">{humanizeStatus(loan.status)}</p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-600">No loans yet. Post a loan to get started.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">
                Marketplace
              </p>
              <h3 className="text-xl font-semibold text-slate-900">Lending opportunities</h3>
            </div>
            <Link to="/loans" className="text-sm font-semibold text-indigo-700 hover:text-slate-900">
              Fund deals
            </Link>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {lendingOpportunities.length ? (
              lendingOpportunities.map((loan, index) => (
                <article
                  key={`op-${loan.id || index}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(
                        loan.status,
                      )}`}
                    >
                      {humanizeStatus(loan.status)}
                    </span>
                    <p className="text-xs text-slate-500">{formatDate(loan.createdAt)}</p>
                  </div>
                  <h4 className="mt-2 text-lg font-semibold text-slate-900">
                    {loan.purpose || 'General purpose loan'}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {CURRENCY_FORMATTER.format(loan.amount || 0)}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Tenure</p>
                      <p className="font-semibold text-slate-900">{loan.tenureMonths || '--'} months</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Status</p>
                      <p className="font-semibold text-slate-900">{humanizeStatus(loan.status)}</p>
                    </div>
                  </div>
                  <Link
                    to="/loans"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    Lend to this
                  </Link>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-600">
                No opportunities yet. Invite borrowers to post requests.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">
                Post a loan
              </p>
              <h3 className="text-xl font-semibold text-slate-900">Instant loan listing</h3>
            </div>
            <Link
              to="/wallet/transactions"
              className="text-sm font-semibold text-indigo-700 hover:text-slate-900"
            >
              Wallet history
            </Link>
          </div>
          {quickLoanMessage && (
            <p
              className={`mt-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                quickLoanStatus === API_STATUS.error
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {quickLoanMessage}
            </p>
          )}
          <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={handleQuickLoanSubmit}>
            <label htmlFor="quick-amount" className="space-y-1 text-sm font-semibold text-slate-900">
              Amount
              <input
                type="number"
                id="quick-amount"
                name="amount"
                min="1"
                value={quickLoanValues.amount}
                onChange={handleQuickLoanChange}
                placeholder="5000"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
              {quickLoanErrors.amount && (
                <span className="text-xs font-medium text-rose-600">{quickLoanErrors.amount}</span>
              )}
            </label>
            <label
              htmlFor="quick-tenure"
              className="space-y-1 text-sm font-semibold text-slate-900"
            >
              Tenure (months)
              <input
                type="number"
                id="quick-tenure"
                name="tenureMonths"
                min="1"
                value={quickLoanValues.tenureMonths}
                onChange={handleQuickLoanChange}
                placeholder="12"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
              {quickLoanErrors.tenureMonths && (
                <span className="text-xs font-medium text-rose-600">
                  {quickLoanErrors.tenureMonths}
                </span>
              )}
            </label>
            <label
              htmlFor="quick-purpose"
              className="space-y-1 text-sm font-semibold text-slate-900 sm:col-span-2"
            >
              Purpose
              <textarea
                id="quick-purpose"
                name="purpose"
                rows="3"
                value={quickLoanValues.purpose}
                onChange={handleQuickLoanChange}
                placeholder="Working capital, equipment purchase, ..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
              {quickLoanErrors.purpose && (
                <span className="text-xs font-medium text-rose-600">
                  {quickLoanErrors.purpose}
                </span>
              )}
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={quickLoanStatus === API_STATUS.loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-[1px] hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {quickLoanStatus === API_STATUS.loading ? 'Posting...' : 'Post loan to marketplace'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default Dashboard
