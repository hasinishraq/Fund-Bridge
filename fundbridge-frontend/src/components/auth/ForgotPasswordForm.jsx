import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ReCAPTCHA from 'react-google-recaptcha'
import { requestPasswordReset, resetPassword } from '../../api/authApi'
import { validatePasswordReset } from '../../utils/validators'

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

const initialState = {
  email: '',
  otp: '',
  password: '',
  confirmPassword: '',
  captchaToken: '',
}

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

const ForgotPasswordForm = () => {
  const [values, setValues] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [otpStatus, setOtpStatus] = useState('')
  const [phase, setPhase] = useState('request') // request -> verify -> success
  const [requestingOtp, setRequestingOtp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const recaptchaRef = useRef(null)
  const isCaptchaEnabled = Boolean(recaptchaSiteKey)

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
    const validationErrors = validatePasswordReset(values, {
      requireCaptcha: isCaptchaEnabled,
    })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }
    try {
      setFormError('')
      setOtpStatus('')
      setRequestingOtp(true)
      await requestPasswordReset({
        email: values.email.trim().toLowerCase(),
        captchaToken: values.captchaToken,
      })
      setPhase('verify')
      setOtpStatus('Reset code sent to your email.')
    } catch (error) {
      resetCaptcha()
      const serverErrors = extractFieldErrors(error)
      if (serverErrors) {
        setErrors((prev) => ({ ...prev, ...serverErrors }))
      }
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to send reset code. Please try again.'
      setFormError(message)
    } finally {
      setRequestingOtp(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (phase === 'request') {
      await sendOtp()
      return
    }
    if (phase === 'success') {
      return
    }

    const validationErrors = validatePasswordReset(values, {
      requireOtp: true,
      requirePasswords: true,
    })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    try {
      setFormError('')
      setSubmitting(true)
      await resetPassword({
        email: values.email.trim().toLowerCase(),
        otp: values.otp.trim(),
        newPassword: values.password,
      })
      setPhase('success')
    } catch (error) {
      const serverErrors = extractFieldErrors(error)
      if (serverErrors) {
        setErrors((prev) => ({ ...prev, ...serverErrors }))
        setFormError('')
      } else {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Unable to reset password. Please try again.'
        setFormError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isSubmitDisabled =
    phase === 'request'
      ? requestingOtp || (isCaptchaEnabled && !values.captchaToken)
      : submitting || requestingOtp

  if (phase === 'success') {
    return (
      <div className="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-800">Password updated</p>
        <p className="text-sm text-emerald-700">
          Your password has been reset. You can now sign in with your new credentials.
        </p>
        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f2a5b] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          Back to login
        </Link>
      </div>
    )
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
          disabled={phase === 'verify'}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
        />
        {errors.email && <span className="text-xs font-medium text-rose-600">{errors.email}</span>}
      </div>

      {phase === 'verify' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-800" htmlFor="otp">
              Reset code
            </label>
            <button
              type="button"
              onClick={sendOtp}
              disabled={requestingOtp || submitting}
              className="text-xs font-semibold text-[#1f2a5b] hover:text-[#23306b] disabled:cursor-not-allowed disabled:opacity-60"
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

      {phase === 'verify' && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800" htmlFor="password">
              New password
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
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-[#1f2a5b] hover:text-[#23306b]"
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
              Confirm new password
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
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-[#1f2a5b] hover:text-[#23306b]"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-xs font-medium text-rose-600">{errors.confirmPassword}</span>
            )}
          </div>
        </>
      )}

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
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f2a5b] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {phase === 'request'
          ? requestingOtp
            ? 'Sending code...'
            : 'Send reset code'
          : submitting
            ? 'Resetting...'
            : 'Reset password'}
      </button>
    </form>
  )
}

export default ForgotPasswordForm
