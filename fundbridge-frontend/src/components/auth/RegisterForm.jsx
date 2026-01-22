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
  const isVerifyPhase = phase === 'verify'
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

  const handleEditDetails = () => {
    setPhase('details')
    setFormError('')
    setOtpStatus('')
    setValues((prev) => ({ ...prev, otp: '' }))
    setErrors((prev) => ({ ...prev, otp: undefined }))
    if (isCaptchaEnabled) {
      resetCaptcha()
    }
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

    let kycPopup = null
    try {
      setFormError('')
      if (phase === 'verify') {
        kycPopup = window.open('', '_blank', 'noopener')
      }
      const result = await onSubmit({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
        otp: values.otp.trim(),
      })
      const reviewUrl = result?.user?.kycReviewUrl
      if (reviewUrl) {
        if (kycPopup && !kycPopup.closed) {
          kycPopup.location.href = reviewUrl
        } else {
          const opened = window.open(reviewUrl, '_blank', 'noopener')
          if (!opened) {
            window.location.assign(reviewUrl)
          }
        }
      } else if (kycPopup && !kycPopup.closed) {
        kycPopup.close()
      }
    } catch (error) {
      if (kycPopup && !kycPopup.closed) {
        kycPopup.close()
      }
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

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
              isVerifyPhase ? 'bg-emerald-100 text-emerald-700' : 'bg-[#1f2a5b] text-white'
            }`}
          >
            1
          </div>
          <div className={`h-px flex-1 ${isVerifyPhase ? 'bg-emerald-200' : 'bg-slate-200'}`} />
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
              isVerifyPhase ? 'bg-[#1f2a5b] text-white' : 'bg-slate-200 text-slate-500'
            }`}
          >
            2
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold">
          <span className={isVerifyPhase ? 'text-slate-500' : 'text-slate-900'}>
            Account details
          </span>
          <span className={isVerifyPhase ? 'text-slate-900' : 'text-slate-500'}>
            Verify email
          </span>
        </div>
      </div>

      {!isVerifyPhase && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
            We will email a 6-digit verification code after you submit these details.
          </div>

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
              <span className="text-xs font-medium text-rose-600">
                {errors.confirmPassword}
              </span>
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
        </>
      )}

      {isVerifyPhase && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">
                  Review
                </p>
                <h3 className="text-lg font-semibold text-slate-900">Confirm your details</h3>
                <p className="text-sm text-slate-600">
                  We sent a code to{' '}
                  <span className="font-semibold text-slate-900">
                    {values.email || 'your email'}
                  </span>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={handleEditDetails}
                className="text-xs font-semibold text-[#1f2a5b] hover:text-[#23306b]"
              >
                Edit details
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-slate-500">Name</span>
                <span className="font-semibold text-slate-900">{values.name || '--'}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-slate-500">Email</span>
                <span className="font-semibold text-slate-900">{values.email || '--'}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-slate-500">Role</span>
                <span className="font-semibold text-slate-900">{values.role}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800" htmlFor="otp">
                Email verification code
              </label>
              <button
                type="button"
                onClick={sendOtp}
                disabled={requestingOtp || loading}
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
        </>
      )}

      {isCaptchaEnabled && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
          <div className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span>Security check</span>
            <span>{isVerifyPhase ? 'Required to resend' : 'Required'}</span>
          </div>
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
          {isVerifyPhase && (
            <p className="text-xs text-slate-500">
              Complete this only if you need to resend the verification code.
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f2a5b] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {!isVerifyPhase
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
