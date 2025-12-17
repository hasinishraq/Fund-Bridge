import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import ReCAPTCHA from 'react-google-recaptcha'
import { validateLogin } from '../../utils/validators'

const initialState = { email: '', password: '', captchaToken: '' }
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

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

const LoginForm = ({ onSubmit, loading }) => {
  const [values, setValues] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const recaptchaRef = useRef(null)
  const isCaptchaEnabled = Boolean(recaptchaSiteKey)
  const isSubmitDisabled = loading || (isCaptchaEnabled && !values.captchaToken)

  const handleChange = (event) => {
    setValues((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }))
  }

  const handleCaptchaChange = (token) => {
    setValues((prev) => ({
      ...prev,
      captchaToken: token || '',
    }))
    if (token) {
      setErrors((prev) => {
        if (!prev.captchaToken) {
          return prev
        }
        const next = { ...prev }
        delete next.captchaToken
        return next
      })
    }
  }

  const resetCaptcha = () => {
    if (!isCaptchaEnabled) {
      return
    }
    recaptchaRef.current?.reset()
    setValues((prev) => ({
      ...prev,
      captchaToken: '',
    }))
  }

  const handleCaptchaError = () => {
    resetCaptcha()
    setErrors((prev) => ({
      ...prev,
      captchaToken: 'Captcha could not be verified. Please try again.',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validateLogin(values, { requireCaptcha: isCaptchaEnabled })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    try {
      setFormError('')
      await onSubmit({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        captchaToken: values.captchaToken,
      })
    } catch (error) {
      resetCaptcha()
      const serverErrors = extractFieldErrors(error)
      if (serverErrors) {
        setErrors((prev) => ({ ...prev, ...serverErrors }))
        setFormError('')
        return
      }
      setErrors({})
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to login. Please try again.'
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
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            placeholder="********"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-indigo-700"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.password && (
          <span className="text-xs font-medium text-rose-600">{errors.password}</span>
        )}
      </div>
      {isCaptchaEnabled && (
        <div className="space-y-1.5">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={recaptchaSiteKey}
            onChange={handleCaptchaChange}
            onExpired={resetCaptcha}
            onErrored={handleCaptchaError}
          />
          {errors.captchaToken && (
            <span className="text-xs font-medium text-rose-600">{errors.captchaToken}</span>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
}

export default LoginForm
