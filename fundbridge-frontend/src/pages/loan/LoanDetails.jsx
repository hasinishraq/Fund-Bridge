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

  const summary = useMemo(
    () => [
      {
        label: 'Amount',
        value: CURRENCY_FORMATTER.format(loan?.amount || 0),
      },
      {
        label: 'Tenure',
        value: loan?.tenureMonths ? `${loan.tenureMonths} months` : 'N/A',
      },
      {
        label: 'Status',
        value: loan?.status || 'N/A',
        tone: getStatusTone(loan?.status),
      },
      {
        label: 'Created',
        value: formatDate(loan?.createdAt),
      },
    ],
    [loan?.amount, loan?.createdAt, loan?.status, loan?.tenureMonths],
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
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">Loan</p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">#{loan.id}</h1>
            <p className="text-sm text-slate-600">
              {loan.purpose || 'General purpose loan request.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${getStatusTone(
                loan.status,
              )}`}
            >
              {loan.status?.replace(/_/g, ' ') || 'N/A'}
            </span>
            {canAccept && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                onClick={handleAcceptLoan}
                disabled={actionStatus === API_STATUS.loading}
              >
                {actionStatus === API_STATUS.loading ? 'Accepting...' : 'Accept loan'}
              </button>
            )}
            <Link
              to="/loans"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-[1px] hover:border-indigo-200 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              Back to list
            </Link>
          </div>
        </div>
        {actionMessage && (
          <p
            className={`mt-3 text-sm ${
              actionStatus === API_STATUS.error ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {actionMessage}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
            {item.tone ? (
              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.tone}`}>
                {item.value}
              </span>
            ) : (
              <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
            )}
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">Purpose</p>
            <h2 className="text-xl font-semibold text-slate-900">Use of funds</h2>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-700">
          {loan.purpose || 'No purpose provided.'}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">
              Offers
            </p>
            <h2 className="text-xl font-semibold text-slate-900">Lender offers</h2>
            <p className="text-sm text-slate-600">
              Review every pledge submitted against this loan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="stat-chip">{offers.length} offers</span>
            <span className="stat-chip">
              Pledged {CURRENCY_FORMATTER.format(loan?.pledgedAmount || 0)}
            </span>
            <span className="stat-chip">
              Captured {CURRENCY_FORMATTER.format(loan?.capturedAmount || 0)}
            </span>
          </div>
        </div>

        {offers.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Lender
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Pledged at
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Captured at
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offers.map((offer) => (
                  <tr key={offer.id || `${offer.lenderId}-${offer.createdAt}`}>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {offer.lenderId ? `Lender ${offer.lenderId}` : 'Lender'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {CURRENCY_FORMATTER.format(offer.amount || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      <span className={`status-chip status-${offer.status}`}>
                        {offer.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {formatDate(offer.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {offer.capturedAt ? formatDate(offer.capturedAt) : 'Not captured'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            No offers yet. Share your loan or check back later for lender activity.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">
              Repayments
            </p>
            <h2 className="text-xl font-semibold text-slate-900">EMI schedule</h2>
            <p className="text-sm text-slate-600">
              Installment dates and total amounts after acceptance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="stat-chip">{installments.length} installments</span>
          </div>
        </div>

        {installments.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Installment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Due date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {installments.map((installment) => (
                  <tr key={installment.id || `${installment.installmentNo}-${installment.dueDate}`}>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      #{installment.installmentNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {formatDueDate(installment.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {CURRENCY_FORMATTER.format(installment.totalAmount || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      <span className={`status-chip status-${installment.status}`}>
                        {installment.status || 'DUE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
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
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paymentMessage && (
              <p
                className={`mt-3 text-sm ${
                  paymentStatus === API_STATUS.error ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {paymentMessage}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            The EMI schedule will appear once the loan is accepted.
          </div>
        )}
      </section>
    </div>
  )
}

export default LoanDetails
