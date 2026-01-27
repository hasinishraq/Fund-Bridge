import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { acceptLoan, fetchLoanDetails } from '../../api/loanApi'
import { payInstallment } from '../../api/repaymentApi'
import Loader from '../../components/common/Loader'
import { API_STATUS, CURRENCY_FORMATTER, ROLE } from '../../utils/constants'
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

const getStatusTone = (status) => statusToneMap[status] || statusToneMap.default

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not available'

const formatDueDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not available'

const LoanDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [loan, setLoan] = useState(null)
  const [status, setStatus] = useState(API_STATUS.loading)
  const [actionStatus, setActionStatus] = useState(API_STATUS.idle)
  const [actionMessage, setActionMessage] = useState('')
  const [paymentStatus, setPaymentStatus] = useState(API_STATUS.idle)
  const [paymentMessage, setPaymentMessage] = useState('')
  const [payingInstallmentId, setPayingInstallmentId] = useState(null)

  useEffect(() => {
    const loadLoan = async () => {
      try {
        const response = await fetchLoanDetails(id)
        setLoan(response)
        setStatus(API_STATUS.success)
      } catch (error) {
        console.error(error)
        setStatus(API_STATUS.error)
      }
    }
    loadLoan()
  }, [id])

  const canAccept =
    user?.role === ROLE.BORROWER &&
    user?.id &&
    loan?.borrowerId &&
    user.id === loan.borrowerId &&
    loan.status === 'FUNDED'

  const canPayInstallment =
    user?.role === ROLE.BORROWER &&
    user?.id &&
    loan?.borrowerId &&
    user.id === loan.borrowerId &&
    loan.status === 'ACTIVE'

  const handleAcceptLoan = async () => {
    if (!loan?.id || !canAccept) {
      return
    }
    setActionStatus(API_STATUS.loading)
    setActionMessage('')
    try {
      await acceptLoan({ loanId: loan.id, borrowerId: user?.id })
      const refreshed = await fetchLoanDetails(loan.id)
      setLoan(refreshed)
      setActionStatus(API_STATUS.success)
      setActionMessage('Loan accepted. Funds are now released to your wallet.')
    } catch (error) {
      console.error(error)
      setActionStatus(API_STATUS.error)
      setActionMessage(error?.response?.data?.message || 'Unable to accept this loan.')
    }
  }

  const handlePayInstallment = async (installmentId) => {
    if (!installmentId || !canPayInstallment) {
      return
    }
    setPayingInstallmentId(installmentId)
    setPaymentStatus(API_STATUS.loading)
    setPaymentMessage('')
    try {
      await payInstallment({ installmentId })
      const refreshed = await fetchLoanDetails(loan.id)
      setLoan(refreshed)
      setPaymentStatus(API_STATUS.success)
      setPaymentMessage('Installment paid successfully.')
    } catch (error) {
      console.error(error)
      setPaymentStatus(API_STATUS.error)
      setPaymentMessage(error?.response?.data?.message || 'Unable to pay installment.')
    } finally {
      setPayingInstallmentId(null)
    }
  }

  const offers = useMemo(() => {
    const fundings = Array.isArray(loan?.fundings) ? loan.fundings : []
    return [...fundings].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })
  }, [loan?.fundings])

  const installments = useMemo(() => {
    const schedule = Array.isArray(loan?.installments) ? loan.installments : []
    return [...schedule].sort((a, b) => Number(a.installmentNo || 0) - Number(b.installmentNo || 0))
  }, [loan?.installments])

  const amount = Number(loan?.amount || 0)
  const pledgedAmount = Number(loan?.pledgedAmount || 0)
  const capturedAmount = Number(loan?.capturedAmount || 0)
  const fundingProgress = amount ? Math.min(100, Math.round((pledgedAmount / amount) * 100)) : 0
  const remainingFunding = Math.max(amount - pledgedAmount, 0)

  const nextInstallment = installments.find((installment) =>
    ['DUE', 'LATE'].includes(installment?.status || 'DUE'),
  )
  const paidInstallments = installments.filter(
    (installment) => !['DUE', 'LATE'].includes(installment?.status || 'DUE'),
  ).length

  const statusLabel = loan?.status?.replace(/_/g, ' ') || 'N/A'

  const summary = useMemo(
    () => [
      {
        label: 'Loan amount',
        value: CURRENCY_FORMATTER.format(amount),
        helper: 'Requested principal',
      },
      {
        label: 'Tenure',
        value: loan?.tenureMonths ? `${loan.tenureMonths} months` : 'N/A',
        helper: 'Repayment window',
      },
      {
        label: 'Status',
        value: statusLabel,
        tone: getStatusTone(loan?.status),
      },
      {
        label: 'Created',
        value: formatDate(loan?.createdAt),
        helper: 'Application date',
      },
      {
        label: 'Pledged',
        value: CURRENCY_FORMATTER.format(pledgedAmount),
        helper: 'Total lender commitments',
      },
      {
        label: 'Captured',
        value: CURRENCY_FORMATTER.format(capturedAmount),
        helper: 'Funds ready in wallet',
      },
    ],
    [amount, capturedAmount, loan?.createdAt, loan?.status, loan?.tenureMonths, pledgedAmount, statusLabel],
  )

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
        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-rose-600">Loan</p>
        <p className="mt-2 text-lg font-semibold">Unable to load loan details.</p>
        <Link
          to="/loans"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-200"
        >
          Back to loans
        </Link>
      </div>
    )
  }

  if (!loan) {
    return null
  }

  return (
    <div className="loan-view">
      <header className="loan-hero loan-animate" style={{ '--delay': '0ms' }}>
        <div className="loan-hero__row">
          <div className="loan-hero__intro">
            <p className="loan-eyebrow">Borrower view</p>
            <h1 className="loan-title">Loan #{loan.id}</h1>
            <p className="loan-subtitle">{loan.purpose || 'General purpose loan request.'}</p>
            <div className="loan-hero__meta">
              <span className={`loan-status-pill ${getStatusTone(loan.status)}`}>
                {statusLabel}
              </span>
              <span className="loan-meta-pill">Created {formatDate(loan.createdAt)}</span>
            </div>
          </div>
          <div className="loan-hero__actions">
            <div className="loan-action-group">
              {canAccept && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAcceptLoan}
                  disabled={actionStatus === API_STATUS.loading}
                >
                  {actionStatus === API_STATUS.loading ? 'Accepting...' : 'Accept loan'}
                </button>
              )}
              {canPayInstallment && nextInstallment && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handlePayInstallment(nextInstallment.id)}
                  disabled={payingInstallmentId === nextInstallment.id}
                >
                  {payingInstallmentId === nextInstallment.id
                    ? 'Paying...'
                    : 'Pay next installment'}
                </button>
              )}
              <Link to="/loans" className="btn btn-ghost">
                Back to loans
              </Link>
            </div>
            {actionMessage && (
              <div
                className={`loan-callout ${
                  actionStatus === API_STATUS.error ? 'is-error' : 'is-success'
                }`}
              >
                {actionMessage}
              </div>
            )}
          </div>
        </div>

        <div className="loan-metric-grid">
          {summary.map((item, index) => (
            <div
              key={item.label}
              className="loan-metric loan-animate"
              style={{ '--delay': `${120 + index * 70}ms` }}
            >
              <p className="loan-metric__label">{item.label}</p>
              {item.tone ? (
                <span className={`loan-status-pill ${item.tone}`}>{item.value}</span>
              ) : (
                <p className="loan-metric__value">{item.value}</p>
              )}
              {item.helper && <p className="loan-metric__helper">{item.helper}</p>}
            </div>
          ))}
        </div>
      </header>

      <div className="loan-info-grid">
        <section className="loan-card loan-animate" style={{ '--delay': '520ms' }}>
          <div className="loan-card__header">
            <div>
              <p className="loan-card__eyebrow">Funding</p>
              <h2 className="loan-card__title">Funding progress</h2>
              <p className="loan-card__subtitle">Track commitments as lenders pledge.</p>
            </div>
            <span className="loan-chip">{fundingProgress}% funded</span>
          </div>
          <div className="loan-progress">
            <div className="loan-progress__track">
              <div className="loan-progress__fill" style={{ width: `${fundingProgress}%` }} />
            </div>
            <div className="loan-progress__stats">
              <div>
                <p className="loan-progress__label">Pledged</p>
                <p className="loan-progress__value">
                  {CURRENCY_FORMATTER.format(pledgedAmount)}
                </p>
              </div>
              <div>
                <p className="loan-progress__label">Remaining</p>
                <p className="loan-progress__value">
                  {CURRENCY_FORMATTER.format(remainingFunding)}
                </p>
              </div>
              <div>
                <p className="loan-progress__label">Captured</p>
                <p className="loan-progress__value">
                  {CURRENCY_FORMATTER.format(capturedAmount)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="loan-card loan-animate" style={{ '--delay': '620ms' }}>
          <div className="loan-card__header">
            <div>
              <p className="loan-card__eyebrow">Repayment</p>
              <h2 className="loan-card__title">Next installment</h2>
              <p className="loan-card__subtitle">Your upcoming payment and status.</p>
            </div>
            <span className="loan-chip">
              {installments.length ? `${paidInstallments}/${installments.length} paid` : 'No schedule'}
            </span>
          </div>
          {nextInstallment ? (
            <div className="loan-next">
              <div className="loan-next__row">
                <div>
                  <p className="loan-next__label">Due date</p>
                  <p className="loan-next__value">{formatDueDate(nextInstallment.dueDate)}</p>
                </div>
                <div>
                  <p className="loan-next__label">Amount</p>
                  <p className="loan-next__value">
                    {CURRENCY_FORMATTER.format(nextInstallment.totalAmount || 0)}
                  </p>
                </div>
                <div>
                  <p className="loan-next__label">Status</p>
                  <span className={`status-chip status-${nextInstallment.status || 'DUE'}`}>
                    {nextInstallment.status || 'DUE'}
                  </span>
                </div>
              </div>
              {paymentMessage && (
                <div
                  className={`loan-callout ${
                    paymentStatus === API_STATUS.error ? 'is-error' : 'is-success'
                  }`}
                >
                  {paymentMessage}
                </div>
              )}
              <div className="loan-next__actions">
                {canPayInstallment ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handlePayInstallment(nextInstallment.id)}
                    disabled={payingInstallmentId === nextInstallment.id}
                  >
                    {payingInstallmentId === nextInstallment.id
                      ? 'Paying...'
                      : 'Pay next installment'}
                  </button>
                ) : (
                  <p className="loan-muted">Payments unlock once the loan is active.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="loan-empty">
              No upcoming installment yet. The schedule appears once the loan is active.
            </div>
          )}
        </section>
      </div>

      <section className="loan-card loan-animate" style={{ '--delay': '700ms' }}>
        <div className="loan-card__header">
          <div>
            <p className="loan-card__eyebrow">Purpose</p>
            <h2 className="loan-card__title">Use of funds</h2>
          </div>
        </div>
        <p className="loan-card__body">{loan.purpose || 'No purpose provided.'}</p>
      </section>

      <section className="loan-card loan-animate" style={{ '--delay': '780ms' }}>
        <div className="loan-card__header">
          <div>
            <p className="loan-card__eyebrow">Offers</p>
            <h2 className="loan-card__title">Lender offers</h2>
            <p className="loan-card__subtitle">Review every pledge submitted against this loan.</p>
          </div>
          <div className="loan-chip-group">
            <span className="loan-chip">{offers.length} offers</span>
            <span className="loan-chip">
              Pledged {CURRENCY_FORMATTER.format(pledgedAmount)}
            </span>
            <span className="loan-chip">
              Captured {CURRENCY_FORMATTER.format(capturedAmount)}
            </span>
          </div>
        </div>

        {offers.length ? (
          <div className="loan-table-wrap">
            <table className="loan-table">
              <thead>
                <tr>
                  <th>Lender</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Pledged at</th>
                  <th>Captured at</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <tr key={offer.id || `${offer.lenderId}-${offer.createdAt}`}>
                    <td className="loan-table__primary">
                      {offer.lenderId ? `Lender ${offer.lenderId}` : 'Lender'}
                    </td>
                    <td>{CURRENCY_FORMATTER.format(offer.amount || 0)}</td>
                    <td>
                      <span className={`status-chip status-${offer.status || 'UNKNOWN'}`}>
                        {offer.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>{formatDate(offer.createdAt)}</td>
                    <td>{offer.capturedAt ? formatDate(offer.capturedAt) : 'Not captured'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="loan-empty">
            No offers yet. Share your loan or check back later for lender activity.
          </div>
        )}
      </section>

      <section className="loan-card loan-animate" style={{ '--delay': '860ms' }}>
        <div className="loan-card__header">
          <div>
            <p className="loan-card__eyebrow">Repayments</p>
            <h2 className="loan-card__title">EMI schedule</h2>
            <p className="loan-card__subtitle">
              Installment dates and total amounts after acceptance.
            </p>
          </div>
          <span className="loan-chip">{installments.length} installments</span>
        </div>

        {installments.length ? (
          <div className="loan-table-wrap">
            <table className="loan-table">
              <thead>
                <tr>
                  <th>Installment</th>
                  <th>Due date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((installment) => (
                  <tr key={installment.id || `${installment.installmentNo}-${installment.dueDate}`}>
                    <td className="loan-table__primary">#{installment.installmentNo}</td>
                    <td>{formatDueDate(installment.dueDate)}</td>
                    <td>{CURRENCY_FORMATTER.format(installment.totalAmount || 0)}</td>
                    <td>
                      <span className={`status-chip status-${installment.status || 'DUE'}`}>
                        {installment.status || 'DUE'}
                      </span>
                    </td>
                    <td>
                      {canPayInstallment &&
                      ['DUE', 'LATE'].includes(installment.status || 'DUE') ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handlePayInstallment(installment.id)}
                          disabled={payingInstallmentId === installment.id}
                        >
                          {payingInstallmentId === installment.id ? 'Paying...' : 'Pay now'}
                        </button>
                      ) : (
                        <span className="loan-muted">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paymentMessage && (
              <div
                className={`loan-callout ${
                  paymentStatus === API_STATUS.error ? 'is-error' : 'is-success'
                }`}
              >
                {paymentMessage}
              </div>
            )}
          </div>
        ) : (
          <div className="loan-empty">The EMI schedule will appear once the loan is accepted.</div>
        )}
      </section>
    </div>
  )
}

export default LoanDetails
