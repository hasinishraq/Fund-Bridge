import { useState } from 'react'
import PropTypes from 'prop-types'
import { validateRegister } from '../../utils/validators'
import { ROLE } from '../../utils/constants'

const initialState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: ROLE.BORROWER,
}

const ROLE_OPTIONS = [
  { value: ROLE.BORROWER, label: 'Borrower' },
  { value: ROLE.LENDER, label: 'Lender' },
]

const extractFieldErrors = (error) => {
  const violations = error?.response?.data?.errors
  if (!Array.isArray(violations) || violations.length === 0) {
    return null
  }
  const mapped = violations.reduce((acc, violation) => {
    if (violation.field && violation.message) {
      acc[violation.field] = violation.message
    }
    return acc
  }, {})
  return Object.keys(mapped).length > 0 ? mapped : null
}

const RegisterForm = ({ onSubmit, loading }) => {
  const [values, setValues] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validateRegister(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }
    try {
      setFormError('')
      const result = await onSubmit({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
      })
      const reviewUrl = result?.user?.kycReviewUrl
      if (reviewUrl) {
        window.location.assign(reviewUrl)
      }
    } catch (error) {
      const serverErrors = extractFieldErrors(error)
      if (serverErrors) {
        setErrors(serverErrors)
        setFormError('')
        return
      }
      setErrors({})
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to register. Please try again.'
      setFormError(message)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {formError}
        </p>
      )}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          placeholder="Jane Doe"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {errors.name && <span className="text-xs font-medium text-rose-600">{errors.name}</span>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          placeholder="you@email.com"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {errors.email && <span className="text-xs font-medium text-rose-600">{errors.email}</span>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange}
          placeholder="********"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {errors.password && (
          <span className="text-xs font-medium text-rose-600">{errors.password}</span>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800" htmlFor="confirmPassword">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          placeholder="********"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {errors.confirmPassword && (
          <span className="text-xs font-medium text-rose-600">{errors.confirmPassword}</span>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800" htmlFor="role">
          Registering as
        </label>
        <select
          id="role"
          name="role"
          value={values.role}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.role && <span className="text-xs font-medium text-rose-600">{errors.role}</span>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}

RegisterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
}

export default RegisterForm
