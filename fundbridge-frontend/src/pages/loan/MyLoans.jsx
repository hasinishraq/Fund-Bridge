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
    return ['ALL', ...uniqueStatuses]
  }, [loans])

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesStatus = filters.status === 'ALL' || loan.status === filters.status
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
        <Link
          to="/loans/apply"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-200"
        >
          Apply for a loan
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">
              My Loans
            </p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {filteredLoans.length} active records
            </h1>
            <p className="text-sm text-slate-600">
              Track every loan from submission to settlement with filters that help you focus.
            </p>
          </div>
          <Link
            to="/loans/apply"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            Apply for new loan
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1.2fr,1fr,1fr]">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <input
              type="search"
              placeholder="Search by ID or purpose"
              value={filters.query}
              onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {filterOptions.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusOption === 'ALL' ? 'All statuses' : statusOption}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="flex flex-col text-xs text-slate-600">
              <label className="font-semibold" htmlFor="minAmount">
                Min amount
              </label>
              <input
                id="minAmount"
                type="number"
                min="0"
                value={filters.minAmount}
                onChange={(e) => setFilters((prev) => ({ ...prev, minAmount: e.target.value }))}
                className="rounded border border-slate-200 px-2 py-1 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex flex-col text-xs text-slate-600">
              <label className="font-semibold" htmlFor="maxAmount">
                Max amount
              </label>
              <input
                id="maxAmount"
                type="number"
                min="0"
                value={filters.maxAmount}
                onChange={(e) => setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))}
                className="rounded border border-slate-200 px-2 py-1 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {filteredLoans.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Purpose
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Tenure
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{loan.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      {loan.purpose || 'No purpose provided'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {CURRENCY_FORMATTER.format(loan.amount || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {loan.tenureMonths ? `${loan.tenureMonths} months` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusToneMap[loan.status] || statusToneMap.default}`}
                      >
                        {loan.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{formatDate(loan.createdAt)}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        to={`/loans/${loan.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:border-indigo-200 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 py-10 text-center text-slate-600">
            <p className="text-lg font-semibold text-slate-900">No loans match your filters</p>
            <p className="text-sm">
              Adjust filters or{' '}
              <Link to="/loans/apply" className="font-semibold text-indigo-700 hover:text-indigo-900">
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
