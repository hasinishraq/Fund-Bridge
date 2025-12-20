import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import ReCAPTCHA from 'react-google-recaptcha'
import { startRegistration } from '../../api/authApi'
import { isEmailValid, validateRegister } from '../../utils/validators'
import { ROLE } from '../../utils/constants'

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

const initialState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: ROLE.BORROWER,
  otp: '',
  captchaToken: '',
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
  const recaptchaRef = useRef(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [requestingOtp, setRequestingOtp] = useState(false)
  const [otpStatus, setOtpStatus] = useState('')
  const [phase, setPhase] = useState('details') // details -> verify
  const isCaptchaEnabled = Boolean(recaptchaSiteKey)
  const isSubmitDisabled =
    loading || requestingOtp || (isCaptchaEnabled && phase === 'details' && !values.captchaToken)

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
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

  const sendOtp = async () => {
    const nextErrors = { ...errors }
    if (!isEmailValid(values.email)) {
      nextErrors.email = 'Enter a valid email'
    }
    if (isCaptchaEnabled && !values.captchaToken) {
      nextErrors.captchaToken = 'Please complete the captcha challenge to request a code'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }
    try {
      setFormError('')
      setOtpStatus('')
      setRequestingOtp(true)
      await startRegistration({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
        captchaToken: values.captchaToken,
      })
      setPhase('verify')
      setOtpStatus('Verification code sent to your email.')
    } catch (error) {
      const serverErrors = extractFieldErrors(error)
      if (serverErrors) {
        setErrors(serverErrors)
      }
      const message =
        error?.response?.data?.message || error?.message || 'Unable to send code. Please try again.'
      setFormError(message)
    } finally {
      setRequestingOtp(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validateRegister(values, {
      requireCaptcha: isCaptchaEnabled && phase === 'details',
      requireOtp: phase === 'verify',
    })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    if (phase === 'details') {
      await sendOtp()
      return
    }

    try {
      setFormError('')
      const result = await onSubmit({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
        otp: values.otp.trim(),
      })
      const reviewUrl = result?.user?.kycReviewUrl
      if (reviewUrl) {
        window.location.assign(reviewUrl)
      }
    } catch (error) {
      resetCaptcha()
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
          disabled={phase === 'verify'}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
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
          disabled={phase === 'verify'}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
        />
        {errors.email && <span className="text-xs font-medium text-rose-600">{errors.email}</span>}
      </div>

      {phase === 'verify' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-800" htmlFor="otp">
              Email verification code
            </label>
            <button
              type="button"
              onClick={sendOtp}
              disabled={requestingOtp || loading}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {requestingOtp ? 'Sending...' : 'Resend code'}
            </button>
          </div>
          <input
            id="otp"
            name="otp"
            type="text"
            value={values.otp}
            onChange={handleChange}
            placeholder="6-digit code"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {errors.otp && <span className="text-xs font-medium text-rose-600">{errors.otp}</span>}
          {otpStatus && <span className="text-xs font-medium text-emerald-600">{otpStatus}</span>}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            placeholder="********"
            disabled={phase === 'verify'}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-indigo-700"
            disabled={phase === 'verify'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.password && (
          <span className="text-xs font-medium text-rose-600">{errors.password}</span>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800" htmlFor="confirmPassword">
          Confirm password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={handleChange}
            placeholder="********"
            disabled={phase === 'verify'}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-indigo-700"
            disabled={phase === 'verify'}
          >
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        </div>
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
          disabled={phase === 'verify'}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.role && <span className="text-xs font-medium text-rose-600">{errors.role}</span>}
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
        {phase === 'details'
          ? requestingOtp
            ? 'Sending code...'
            : 'Send verification code'
          : loading
            ? 'Verifying...'
            : 'Verify & Create account'}
      </button>
    </form>
  )
}

RegisterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
}

export default RegisterForm
