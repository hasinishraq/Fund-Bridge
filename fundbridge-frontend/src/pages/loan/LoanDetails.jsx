import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchLoanDetails } from '../../api/loanApi'
import Loader from '../../components/common/Loader'
import { API_STATUS, CURRENCY_FORMATTER } from '../../utils/constants'

const statusToneMap = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  FUNDING: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  DISBURSED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ACTIVE: 'bg-sky-50 text-sky-700 border border-sky-200',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
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

const LoanDetails = () => {
  const { id } = useParams()
  const [loan, setLoan] = useState(null)
  const [status, setStatus] = useState(API_STATUS.loading)

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

  const summary = useMemo(
    () => [
      {
        label: 'Amount',
        value: CURRENCY_FORMATTER.format(loan?.amount || 0),
      },
      {
        label: 'Tenure',
        value: loan?.tenureMonths ? `${loan.tenureMonths} months` : '—',
      },
      {
        label: 'Status',
        value: loan?.status || '—',
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
              {loan.status?.replace(/_/g, ' ') || '—'}
            </span>
            <Link
              to="/loans"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-[1px] hover:border-indigo-200 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              Back to list
            </Link>
          </div>
        </div>
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
    </div>
  )
}

export default LoanDetails
