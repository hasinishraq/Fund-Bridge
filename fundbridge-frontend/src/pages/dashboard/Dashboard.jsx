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

const heroTrend = [72, 110, 60, 140, 95, 160, 120, 150]

const humanizeStatus = (status) => (status ? status.replace(/_/g, ' ') : 'N/A')

const statusToneMap = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  REQUESTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  FUNDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
  RESUBMIT_REQUIRED: 'bg-amber-50 text-amber-700 border border-amber-200',
  DISBURSED: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  FUNDED: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  ACTIVE: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  default: 'bg-slate-50 text-slate-700 border border-slate-200',
}

const getStatusTone = (status) => statusToneMap[status] || statusToneMap.default

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'No date'

const padSeries = (values, fallback, length = 8) => {
  const source = values.length ? values : fallback
  if (!source.length) {
    return new Array(length).fill(50)
  }
  const padded = [...source]
  let index = 0
  while (padded.length < length) {
    padded.push(source[index % source.length])
    index += 1
  }
  return padded.slice(0, length)
}

const buildSeries = (values, fallback, length = 8) => {
  if (!values.length) {
    return padSeries([], fallback, length)
  }
  const max = Math.max(...values, 1)
  const scaled = values.map((value) => Math.round((value / max) * 100))
  return padSeries(scaled, fallback, length)
}

const buildChartPoints = (series, width, height) => {
  const max = Math.max(...series, 1)
  const step = series.length > 1 ? width / (series.length - 1) : width
  return series.map((value, index) => {
    const x = Number((step * index).toFixed(2))
    const y = Number((height - (value / max) * (height - 6) - 3).toFixed(2))
    return { x, y }
  })
}

const toLinePoints = (points) => points.map((point) => `${point.x},${point.y}`).join(' ')

const toAreaPath = (points, width, height) => {
  if (!points.length) {
    return ''
  }
  const line = points.map((point) => `${point.x},${point.y}`).join(' L ')
  return `M ${line} L ${width},${height} L 0,${height} Z`
}

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
          fetchLoans({ borrowerId: user?.id }),
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
    () =>
      state.loans?.filter((loan) =>
        ['ACTIVE', 'DISBURSED'].includes(loan.status),
      ) || [],
    [state.loans],
  )
  const pendingLoans = useMemo(
    () =>
      state.loans?.filter((loan) =>
        ['REQUESTED', 'PENDING'].includes(loan.status),
      ) || [],
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
  const historyLoans = loanTimeline.slice(0, 4)
  const portfolioLoans = loanTimeline.slice(0, 6)
  const today = new Date()
  const startDate = new Date()
  startDate.setDate(today.getDate() - 7)
  const dateFormatter = new Intl.DateTimeFormat('en-GB')
  const dateRangeLabel = `${dateFormatter.format(startDate)} to ${dateFormatter.format(today)}`
  const loanAmounts = loanTimeline
    .map((loan) => Number(loan.amount || 0))
    .filter((value) => value > 0)
  const activitySeries = buildSeries(loanAmounts, heroTrend)
  const barSeries = buildSeries(heroTrend, heroTrend)
  const healthSeries = activitySeries.map((value, index) =>
    Math.max(20, value - (index % 2) * 12),
  )
  const borrowedPoints = buildChartPoints(activitySeries, 120, 40)
  const borrowedLine = toLinePoints(borrowedPoints)
  const borrowedArea = toAreaPath(borrowedPoints, 120, 40)
  const healthPoints = buildChartPoints(healthSeries, 120, 40)
  const healthLine = toLinePoints(healthPoints)
  const healthArea = toAreaPath(healthPoints, 120, 40)
  const activityPoints = buildChartPoints(activitySeries, 320, 120)
  const activityLine = toLinePoints(activityPoints)
  const activityArea = toAreaPath(activityPoints, 320, 120)

  return (
    <div className="flowdash space-y-6 text-slate-900">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Home / Dashboard
          </p>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Good to see you, {heroName}. Track loans, wallet movement, and funding progress.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {dateRangeLabel}
        </div>
      </section>

      {!isKycApproved && (
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-800 shadow-sm">
          <div className="space-y-1">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-600">
              KYC status
            </p>
            <h3 className="font-display text-lg font-semibold">{humanizeStatus(kycStatus)}</h3>
            <p className="max-w-3xl text-sm text-amber-700">{kycMessage}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.kycReviewUrl && (
              <a
                href={user.kycReviewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1f2a5b] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                Continue verification
              </a>
            )}
            <button
              type="button"
              onClick={handleRefreshKyc}
              disabled={kycRefreshing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1f2a5b] transition hover:-translate-y-[1px] hover:border-[#1f2a5b] hover:text-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {kycRefreshing ? 'Refreshing...' : 'Refresh status'}
            </button>
          </div>
        </div>
      )}

      <section className="flow-stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Total borrowed
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-slate-900">
                {CURRENCY_FORMATTER.format(totalBorrowed)}
              </p>
            </div>
            <Link to="/loans" className="text-xs font-semibold text-slate-400 hover:text-slate-700">
              View
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Utilization</span>
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden="true">
                <path d="M10 4l5 6h-3v6H8v-6H5l5-6Z" fill="currentColor" />
              </svg>
              {borrowUtilization}%
            </span>
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2">
            <svg viewBox="0 0 120 40" className="h-14 w-full" aria-hidden="true">
              <defs>
                <linearGradient id="borrowedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4c6fff" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#4c6fff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={borrowedArea} fill="url(#borrowedGradient)" />
              <polyline points={borrowedLine} fill="none" stroke="#3458f5" strokeWidth="2" />
            </svg>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <p>Wallet ready</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {CURRENCY_FORMATTER.format(walletBalance)}
              </p>
            </div>
            <div>
              <p>Pending queue</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {CURRENCY_FORMATTER.format(pendingAmount)}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Active loans
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-slate-900">
                {disbursedLoans.length}
              </p>
            </div>
            <Link to="/loans" className="text-xs font-semibold text-slate-400 hover:text-slate-700">
              View
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Pending requests</span>
            <span className="font-semibold text-rose-600">{pendingLoans.length}</span>
          </div>
          <div className="mt-4 flex items-end gap-2 rounded-lg bg-slate-50 px-3 py-2">
            {barSeries.map((value, index) => (
              <span
                key={`bar-${value}-${index}`}
                className={`w-2 rounded-full ${
                  index === barSeries.length - 1 ? 'bg-emerald-400' : 'bg-blue-500/70'
                }`}
                style={{ height: `${Math.max(12, (value / 100) * 44)}px` }}
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <p>Disbursed</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {CURRENCY_FORMATTER.format(totalBorrowed)}
              </p>
            </div>
            <div>
              <p>Portfolio total</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {CURRENCY_FORMATTER.format(portfolioTotal)}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Utilization rate
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-slate-900">
                {borrowUtilization}%
              </p>
            </div>
            <Link to="/wallet" className="text-xs font-semibold text-slate-400 hover:text-slate-700">
              View
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Credit pulse</span>
            <span className="font-semibold text-blue-600">{creditHealth}</span>
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2">
            <svg viewBox="0 0 120 40" className="h-14 w-full" aria-hidden="true">
              <defs>
                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={healthArea} fill="url(#healthGradient)" />
              <polyline points={healthLine} fill="none" stroke="#0ea5e9" strokeWidth="2" />
            </svg>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <p>Pending share</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{pendingShare}%</p>
            </div>
            <div>
              <p>Loans live</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{pendingLoans.length}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Loan activity
              </p>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Funding flow over time
              </h2>
            </div>
            <Link to="/loans" className="text-xs font-semibold text-slate-400 hover:text-slate-700">
              View
            </Link>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Loan requests</span>
                <span>{loanTimeline.length} updates</span>
              </div>
              <svg viewBox="0 0 320 120" className="mt-3 h-32 w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={activityArea} fill="url(#activityGradient)" />
                <polyline points={activityLine} fill="none" stroke="#4338ca" strokeWidth="2" />
              </svg>
              <div className="mt-3 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
                <div>
                  <p>Wallet ready</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {CURRENCY_FORMATTER.format(walletBalance)}
                  </p>
                </div>
                <div>
                  <p>Pending amount</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {CURRENCY_FORMATTER.format(pendingAmount)}
                  </p>
                </div>
                <div>
                  <p>Disbursed loans</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {disbursedLoans.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Latest request
              </p>
              {highlightedLoan ? (
                <>
                  <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
                    {highlightedLoan.purpose || 'Funding request'}
                  </h3>
                  <p className="text-xs text-slate-500">{formatDate(highlightedLoan.createdAt)}</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Amount</span>
                      <span className="font-semibold text-slate-900">
                        {CURRENCY_FORMATTER.format(highlightedLoan.amount || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tenure</span>
                      <span className="font-semibold text-slate-900">
                        {highlightedLoan.tenureMonths || '--'} months
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(
                          highlightedLoan.status,
                        )}`}
                      >
                        {humanizeStatus(highlightedLoan.status)}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={highlightedLoan?.id ? `/loans/${highlightedLoan.id}` : '/loans'}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#1f2a5b] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    View loan
                  </Link>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Post a loan request to start tracking activity.
                </p>
              )}
            </div>
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  History
                </p>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  Latest loan updates
                </h3>
              </div>
              <Link to="/loans" className="text-xs font-semibold text-slate-400 hover:text-slate-700">
                See all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {historyLoans.length ? (
                historyLoans.map((loan) => (
                  <div
                    key={loan.id || loan.createdAt}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {loan.purpose || 'Untitled request'}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(loan.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {CURRENCY_FORMATTER.format(loan.amount || 0)}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${getStatusTone(
                          loan.status,
                        )}`}
                      >
                        {humanizeStatus(loan.status)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No loans yet. Post a loan to get started.</p>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Marketplace
                </p>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  Lending snapshot
                </h3>
              </div>
              <Link to="/loans" className="text-xs font-semibold text-slate-400 hover:text-slate-700">
                Browse
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {lendingOpportunities.length ? (
                lendingOpportunities.map((loan, index) => (
                  <div
                    key={`op-${loan.id || index}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatDate(loan.createdAt)}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${getStatusTone(
                          loan.status,
                        )}`}
                      >
                        {humanizeStatus(loan.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {loan.purpose || 'General purpose loan'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {CURRENCY_FORMATTER.format(loan.amount || 0)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No opportunities yet. Invite borrowers to post requests.
                </p>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Borrowing pipeline
              </p>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Track every request
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/loans"
                className="text-xs font-semibold text-slate-400 hover:text-slate-700"
              >
                View all
              </Link>
              <Link
                to="/loans/apply"
                className="rounded-full bg-[#1f2a5b] px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#23306b]"
              >
                New request
              </Link>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <th className="pb-2">Loan</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Tenure</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {portfolioLoans.length ? (
                  portfolioLoans.map((loan) => (
                    <tr
                      key={`pipeline-${loan.id || loan.createdAt}`}
                      className="border-t border-slate-100"
                    >
                      <td className="py-2 text-slate-900">
                        {loan.purpose || (loan.id ? `Loan #${loan.id}` : 'Loan request')}
                      </td>
                      <td className="py-2 text-slate-700">
                        {CURRENCY_FORMATTER.format(loan.amount || 0)}
                      </td>
                      <td className="py-2 text-slate-700">{loan.tenureMonths || '--'} mo</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${getStatusTone(
                            loan.status,
                          )}`}
                        >
                          {humanizeStatus(loan.status)}
                        </span>
                      </td>
                      <td className="py-2 text-slate-500">{formatDate(loan.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-sm text-slate-500" colSpan={5}>
                      No loans yet. Submit a new request to start building your pipeline.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Post a loan
              </p>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Instant loan request
              </h3>
            </div>
            <Link
              to="/wallet/transactions"
              className="text-xs font-semibold text-slate-400 hover:text-slate-700"
            >
              Wallet history
            </Link>
          </div>
          {quickLoanMessage && (
            <p
              className={`mt-3 rounded-lg border px-3 py-2 text-xs font-semibold ${
                quickLoanStatus === API_STATUS.error
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {quickLoanMessage}
            </p>
          )}
          <form className="mt-4 grid gap-3" onSubmit={handleQuickLoanSubmit}>
            <label htmlFor="quick-amount" className="space-y-1 text-xs font-semibold text-slate-600">
              Amount
              <input
                type="number"
                id="quick-amount"
                name="amount"
                min="1"
                value={quickLoanValues.amount}
                onChange={handleQuickLoanChange}
                placeholder="5000"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              {quickLoanErrors.amount && (
                <span className="text-xs font-medium text-rose-600">{quickLoanErrors.amount}</span>
              )}
            </label>
            <label
              htmlFor="quick-tenure"
              className="space-y-1 text-xs font-semibold text-slate-600"
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
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              {quickLoanErrors.tenureMonths && (
                <span className="text-xs font-medium text-rose-600">
                  {quickLoanErrors.tenureMonths}
                </span>
              )}
            </label>
            <label htmlFor="quick-purpose" className="space-y-1 text-xs font-semibold text-slate-600">
              Purpose
              <textarea
                id="quick-purpose"
                name="purpose"
                rows="3"
                value={quickLoanValues.purpose}
                onChange={handleQuickLoanChange}
                placeholder="Working capital, equipment purchase, ..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              {quickLoanErrors.purpose && (
                <span className="text-xs font-medium text-rose-600">
                  {quickLoanErrors.purpose}
                </span>
              )}
            </label>
            <div>
              <button
                type="submit"
                disabled={quickLoanStatus === API_STATUS.loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f2a5b] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {quickLoanStatus === API_STATUS.loading ? 'Posting...' : 'Post loan request'}
              </button>
            </div>
          </form>
        </article>
      </section>
    </div>
  )
}

export default Dashboard
