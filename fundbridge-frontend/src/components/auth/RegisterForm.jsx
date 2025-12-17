import { useState } from 'react'
import PropTypes from 'prop-types'
import Button from '../common/Button'
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
    <form className="card auth-form" onSubmit={handleSubmit} noValidate>
      <h2>Create Account</h2>
      <p className="auth-form-note">
        We will automatically trigger Sumsub KYC so you can verify your identity right away.
      </p>
      {formError && <p className="form-error">{formError}</p>}
      <label htmlFor="name">
        Full Name
        <input
          id="name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          placeholder="Jane Doe"
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </label>

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
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange}
          placeholder="********"
        />
        {errors.password && <span className="field-error">{errors.password}</span>}
      </label>

      <label htmlFor="confirmPassword">
        Confirm Password
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          placeholder="********"
        />
        {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
      </label>

      <label htmlFor="role">
        Registering as
        <select id="role" name="role" value={values.role} onChange={handleChange}>
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.role && <span className="field-error">{errors.role}</span>}
      </label>

      <Button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Register'}
      </Button>
    </form>
  )
}

RegisterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
}

export default RegisterForm
