import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { createFunding } from '../../api/fundingApi'
import { fetchLoans } from '../../api/loanApi'
import { fetchWalletBalance } from '../../api/walletApi'
import {
  API_STATUS,
  CURRENCY_FORMATTER,
  ROLE,
  getRoleHomePath,
} from '../../utils/constants'
import Loader from '../../components/common/Loader'
import Modal from '../../components/common/Modal'
import { useAuth } from '../../context/AuthContext'

const humanizeStatus = (status) => (status ? status.replace(/_/g, ' ') : 'PENDING')

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
  CLOSED: 'bg-slate-50 text-slate-700 border border-slate-200',
  default: 'bg-slate-50 text-slate-700 border border-slate-200',
}

const getStatusTone = (status) => statusToneMap[status] || statusToneMap.default

const buildIdempotencyKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fund-${Date.now()}`

const getPledgedAmount = (loan) => Number(loan?.pledgedAmount ?? loan?.capturedAmount ?? 0)
const getCapturedAmount = (loan) => Number(loan?.capturedAmount ?? 0)
const getOutstandingFunding = (loan) =>
  Math.max(Number(loan?.amount || 0) - getPledgedAmount(loan), 0)
const getNextDueAmount = (loan) => Number(loan?.nextDueAmount ?? 0)
const isOfferable = (loan) =>
  ['PENDING', 'REQUESTED', 'FUNDING', 'APPROVED'].includes(loan?.status) &&
  getOutstandingFunding(loan) > 0

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'No date'

const LenderDashboard = () => {
  const { user, bootstrapping } = useAuth()
  const [status, setStatus] = useState(API_STATUS.idle)
  const [error, setError] = useState('')
  const [state, setState] = useState({ loans: [], wallet: null })
  const [offerLoan, setOfferLoan] = useState(null)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerStatus, setOfferStatus] = useState(API_STATUS.idle)
  const [offerMessage, setOfferMessage] = useState('')

  const loadDashboard = useCallback(
    async ({ silent = false, onCancel } = {}) => {
      if (bootstrapping || user?.role !== ROLE.LENDER || !user?.id) {
        return
      }
      if (!silent) {
        setStatus(API_STATUS.loading)
        setError('')
      }
      try {
        const [loans, wallet] = await Promise.all([
          fetchLoans({ scope: 'LENDER' }),
          fetchWalletBalance({ userId: user?.id }),
        ])
        if (onCancel?.()) return
        setState({ loans: loans || [], wallet })
        if (!silent) {
          setStatus(API_STATUS.success)
        }
      } catch (err) {
        console.error(err)
        if (onCancel?.()) return
        if (!silent) {
          setError('Unable to load lender dashboard')
          setStatus(API_STATUS.error)
        }
      }
    },
    [bootstrapping, user?.id, user?.role],
  )

  useEffect(() => {
    let cancelled = false
    loadDashboard({ onCancel: () => cancelled })
    return () => {
      cancelled = true
    }
  }, [loadDashboard])

  const loans = state.loans || []
  const fundingQueue = useMemo(
    () =>
      loans.filter((loan) =>
        ['PENDING', 'REQUESTED', 'FUNDING', 'APPROVED'].includes(loan.status),
      ),
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
        .sort(
          (a, b) =>
            new Date(b.closedAt || b.updatedAt || 0) - new Date(a.closedAt || a.updatedAt || 0),
        ),
    [loans],
  )
  const walletBalance = state.wallet?.balance ?? 0
  const fundingQueueAmount = fundingQueue.reduce(
    (sum, loan) => sum + getOutstandingFunding(loan),
    0,
  )
  const activeExposure = activeDeals.reduce(
    (sum, loan) => sum + Math.max(getCapturedAmount(loan), Number(loan.amount || 0)),
    0,
  )
  const avgTenure = activeDeals.length
    ? Math.round(
        activeDeals.reduce((sum, loan) => sum + Number(loan.tenureMonths || 0), 0) /
          activeDeals.length,
      )
    : 0
  const monthlyCashflow = activeDeals.reduce(
    (sum, loan) =>
      sum +
      (getNextDueAmount(loan) ||
        (loan.amount && loan.tenureMonths
          ? Number(loan.amount || 0) / Math.max(Number(loan.tenureMonths || 1), 1)
          : 0)),
    0,
  )
  const nextUpcomingInstallment = useMemo(() => {
    const scheduled = loans
      .map((loan) => ({
        loan,
        date: loan.nextDueDate ? new Date(loan.nextDueDate) : null,
        amount: getNextDueAmount(loan),
      }))
      .filter((entry) => entry.date)
      .sort((a, b) => a.date - b.date)
    return scheduled[0]
  }, [loans])
  const nextDueLabel = nextUpcomingInstallment?.date
    ? `${nextUpcomingInstallment.date.toLocaleDateString()} - ${CURRENCY_FORMATTER.format(
        nextUpcomingInstallment.amount || 0,
      )}`
    : 'No dues scheduled'
  const totalInstallments = loans.reduce(
    (sum, loan) => sum + Number(loan.installmentsTotal || 0),
    0,
  )
  const paidInstallments = loans.reduce(
    (sum, loan) => sum + Number(loan.installmentsPaid || 0),
    0,
  )
  const completionRate = totalInstallments
    ? Math.round((paidInstallments / Math.max(totalInstallments, 1)) * 100)
    : loans.length
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
      entry.volume += getCapturedAmount(loan) || Number(loan.amount || 0)
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
  const offerRemaining = offerLoan ? getOutstandingFunding(offerLoan) : 0
  const today = new Date()
  const startDate = new Date()
  startDate.setDate(today.getDate() - 7)
  const dateFormatter = new Intl.DateTimeFormat('en-GB')
  const dateRangeLabel = `${dateFormatter.format(startDate)} to ${dateFormatter.format(today)}`

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
      await loadDashboard({ silent: true })
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

  return (
    <div className="flowdash space-y-6 text-slate-900">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Home / Lender dashboard
          </p>
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            Lender dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Welcome back, {heroName}. Track pipeline health, wallet liquidity, and repayment flow.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {dateRangeLabel}
        </div>
      </section>

      <section className="flow-stagger grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Capital ready
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-slate-900">
                {CURRENCY_FORMATTER.format(walletBalance)}
              </p>
            </div>
            <Link to="/wallet" className="text-xs font-semibold text-slate-400 hover:text-slate-700">
              Wallet
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Coverage ratio</span>
            <span className="font-semibold text-emerald-600">{coverageRatio}%</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.min(100, coverageRatio)}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <p>Active deals</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{activeDeals.length}</p>
            </div>
            <div>
              <p>Queue size</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{fundingQueue.length}</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Active exposure
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-slate-900">
                {CURRENCY_FORMATTER.format(activeExposure)}
              </p>
            </div>
            <Link
              to="/loans/offers"
              className="text-xs font-semibold text-slate-400 hover:text-slate-700"
            >
              Portfolio
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Avg ticket size</span>
            <span className="font-semibold text-blue-600">
              {avgTicket ? CURRENCY_FORMATTER.format(avgTicket) : '--'}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <p>Avg tenure</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {avgTenure || '--'} mo
              </p>
            </div>
            <div>
              <p>Deals in play</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{activeDeals.length}</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Funding queue
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-slate-900">
                {CURRENCY_FORMATTER.format(fundingQueueAmount)}
              </p>
            </div>
            <Link
              to="/loans/marketplace"
              className="text-xs font-semibold text-slate-400 hover:text-slate-700"
            >
              Marketplace
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Queue share</span>
            <span className="font-semibold text-amber-600">{queueShare}%</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${Math.min(100, queueShare)}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <p>Requests live</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{fundingQueue.length}</p>
            </div>
            <div>
              <p>Deals closed</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {completedDeals.length}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Monthly cash yield
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-slate-900">
                {CURRENCY_FORMATTER.format(monthlyCashflow)}
              </p>
            </div>
            <Link
              to="/wallet/transactions"
              className="text-xs font-semibold text-slate-400 hover:text-slate-700"
            >
              History
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Completion rate</span>
            <span className="font-semibold text-emerald-600">{completionRate}%</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${Math.min(100, completionRate)}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <p>Next EMI</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {nextUpcomingInstallment?.date
                  ? nextUpcomingInstallment.date.toLocaleDateString()
                  : '--'}
              </p>
            </div>
            <div>
              <p>Installments paid</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {paidInstallments}/{totalInstallments || '--'}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="flow-stagger grid gap-4 xl:grid-cols-[2fr,1fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Marketplace
              </p>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Funding queue preview
              </h2>
            </div>
            <Link
              to="/loans/marketplace"
              className="text-xs font-semibold text-slate-400 hover:text-slate-700"
            >
              View marketplace
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {highlightedOpportunities.length ? (
              highlightedOpportunities.map((loan) => (
                <div
                  key={loan.id || loan.createdAt}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
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
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {loan.purpose || 'Funding request'}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {CURRENCY_FORMATTER.format(loan.amount || 0)}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Committed {CURRENCY_FORMATTER.format(getPledgedAmount(loan))}</span>
                      <span>
                        Remaining {CURRENCY_FORMATTER.format(getOutstandingFunding(loan))}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-400"
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
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {isOfferable(loan) ? (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg bg-[#1f2a5b] px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        onClick={() => handleOpenOffer(loan)}
                      >
                        Submit offer
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500"
                        disabled
                      >
                        Offer closed
                      </button>
                    )}
                    <Link
                      to={loan.id ? `/loans/${loan.id}` : '/loans/marketplace'}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-700"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No funding requests are pending. Visit the marketplace for all loans.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Portfolio
              </p>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Liquidity radar
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">Coverage {coverageRatio}%</span>
          </div>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span>Available to deploy</span>
              <strong className="text-slate-900">{CURRENCY_FORMATTER.format(walletBalance)}</strong>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span>Projected 30d repayments</span>
              <strong className="text-slate-900">
                {CURRENCY_FORMATTER.format(monthlyCashflow)}
              </strong>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span>Next EMI due</span>
              <strong className="text-slate-900">{nextDueLabel}</strong>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span>Completion rate</span>
              <strong className="text-slate-900">{completionRate}%</strong>
            </li>
          </ul>
        </article>
      </section>

      <section className="flow-stagger grid gap-4 xl:grid-cols-[2fr,1fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Relationships
              </p>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Borrower leaderboard
              </h3>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            {borrowerLeaderboard.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <th className="pb-2">Borrower</th>
                    <th className="pb-2">Deals</th>
                    <th className="pb-2">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowerLeaderboard.map((entry) => (
                    <tr key={entry.borrower} className="border-t border-slate-100">
                      <td className="py-2 text-slate-900">{entry.borrower}</td>
                      <td className="py-2 text-slate-700">{entry.deals}</td>
                      <td className="py-2 text-slate-700">
                        {CURRENCY_FORMATTER.format(entry.volume)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-500">
                Fund a borrower to start tracking relationship health.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Recently closed
              </p>
              <h3 className="font-display text-lg font-semibold text-slate-900">Matured deals</h3>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {recentMaturities.length ? (
              recentMaturities.map((loan) => (
                <div
                  key={`matured-${loan.id || loan.closedAt}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {loan.purpose || 'Loan'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {loan.closedAt ? new Date(loan.closedAt).toLocaleDateString() : 'No timeline'}
                    </p>
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
              <p className="text-sm text-slate-500">No deals have matured yet.</p>
            )}
          </div>
        </article>
      </section>

      <Modal open={Boolean(offerLoan)} title="Submit offer" onClose={handleCloseOffer}>
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
                  className="btn bg-[#1f2a5b] text-white transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100"
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

export default LenderDashboard
