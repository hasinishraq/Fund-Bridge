import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import ReCAPTCHA from 'react-google-recaptcha'
import Button from '../common/Button'
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
        setErrors(serverErrors)
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
    <form className="card auth-form" onSubmit={handleSubmit} noValidate>
      <h2>Welcome Back</h2>
      <p className="auth-form-note">Use your corporate email to access FundBridge securely.</p>
      {formError && <p className="form-error">{formError}</p>}
      <label htmlFor="email">
        Email
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          placeholder="you@email.com"
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </label>
      <label htmlFor="password">
        Password
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          placeholder="********"
        />
        {errors.password && <span className="field-error">{errors.password}</span>}
      </label>
      {isCaptchaEnabled && (
        <div className="recaptcha-field">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={recaptchaSiteKey}
            onChange={handleCaptchaChange}
            onExpired={resetCaptcha}
          />
          {errors.captchaToken && <span className="field-error">{errors.captchaToken}</span>}
        </div>
      )}

      <Button type="submit" disabled={isSubmitDisabled}>
        {loading ? 'Signing in...' : 'Login'}
      </Button>
    </form>
  )
}

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
}

export default LoginForm
