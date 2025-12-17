import { useState } from 'react'
import { applyForLoan } from '../../api/loanApi'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'
import { validateLoanPayload } from '../../utils/validators'
import { CURRENCY_FORMATTER } from '../../utils/constants'

const initialState = {
  amount: '',
  tenureMonths: '',
  purpose: '',
}

const ApplyLoan = () => {
  const { user } = useAuth()
  const [values, setValues] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('IDLE')
  const [message, setMessage] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validateLoanPayload(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) {
      return
    }
    setStatus('LOADING')
    setMessage('')
    try {
      const payload = {
        amount: Number(values.amount),
        tenureMonths: Number(values.tenureMonths),
        purpose: values.purpose,
        borrowerId: user?.id,
      }
      const response = await applyForLoan(payload)
      setMessage(
        `Loan request submitted (ID: ${response?.id ?? 'pending'}) with status ${response?.status ?? 'PENDING'}`,
      )
      setValues(initialState)
      setStatus('SUCCESS')
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to submit right now')
      setStatus('ERROR')
    }
  }

  const showBanner = status === 'SUCCESS' || status === 'ERROR'

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">Apply</p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Request a loan</h1>
            <p className="text-sm text-slate-600">
              Share how much you need and how long you need it. We’ll route it for review.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">
                Application
              </p>
              <h2 className="text-xl font-semibold text-slate-900">Loan details</h2>
            </div>
          </div>

          {showBanner && (
            <p
              className={`mt-3 rounded-xl border px-3 py-2 text-sm font-semibold ${
                status === 'ERROR'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {message}
            </p>
          )}

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="amount">
                Amount
              </label>
              <div className="relative">
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="1000"
                  step="100"
                  value={values.amount}
                  onChange={handleChange}
                  placeholder="5000"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm font-semibold text-slate-500">
                  USD
                </span>
              </div>
              {errors.amount && (
                <span className="text-xs font-medium text-rose-600">{errors.amount}</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="tenureMonths">
                Tenure (months)
              </label>
              <input
                id="tenureMonths"
                name="tenureMonths"
                type="number"
                min="1"
                value={values.tenureMonths}
                onChange={handleChange}
                placeholder="12"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              {errors.tenureMonths && (
                <span className="text-xs font-medium text-rose-600">{errors.tenureMonths}</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="purpose">
                Purpose
              </label>
              <textarea
                id="purpose"
                name="purpose"
                rows="4"
                value={values.purpose}
                onChange={handleChange}
                placeholder="Working capital, inventory, equipment purchase, ..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              {errors.purpose && (
                <span className="text-xs font-medium text-rose-600">{errors.purpose}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={status === 'LOADING'}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'LOADING' ? 'Submitting...' : 'Submit application'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">
                Preview
              </p>
              <h2 className="text-xl font-semibold text-slate-900">Application summary</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="font-semibold text-slate-800">Amount</span>
              <span className="font-semibold text-slate-900">
                {values.amount ? CURRENCY_FORMATTER.format(Number(values.amount)) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="font-semibold text-slate-800">Tenure</span>
              <span className="font-semibold text-slate-900">
                {values.tenureMonths ? `${values.tenureMonths} months` : '—'}
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Purpose</p>
              <p className="text-sm font-semibold text-slate-900">
                {values.purpose?.length ? values.purpose : 'Describe how you plan to use the funds.'}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Submitting will share this information with lenders and compliance. You can edit details
            until the loan is funded.
          </p>
        </section>
      </div>

      {status === 'LOADING' && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <Loader />
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplyLoan
