import { MIN_PASSWORD_LENGTH, ROLE } from './constants'

export const isEmailValid = (value) => /\S+@\S+\.\S+/.test(String(value).toLowerCase())

export const isAmountValid = (value) => typeof value === 'number' && value > 0

export const isRequired = (value) =>
  value !== null && value !== undefined && String(value).trim().length > 0

export const validateLogin = ({ email, password, captchaToken }, options = {}) => {
  const errors = {}
  const { requireCaptcha = false } = options
  if (!isEmailValid(email)) {
    errors.email = 'Enter a valid email'
  }
  if (!isRequired(password)) {
    errors.password = 'Password is required'
  }
  if (requireCaptcha && !isRequired(captchaToken)) {
    errors.captchaToken = 'Please complete the captcha challenge'
  }
  return errors
}

const ALLOWED_REGISTER_ROLES = [ROLE.BORROWER, ROLE.LENDER]

export const validateRegister = (
  { name, email, password, confirmPassword, role, otp, captchaToken },
  options = {},
) => {
  const { requireCaptcha = false, requireOtp = true } = options
  const errors = {}
  if (!isRequired(name)) {
    errors.name = 'Name is required'
  }
  if (!isEmailValid(email)) {
    errors.email = 'Enter a valid email'
  }
  if (!isRequired(password) || password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }
  if (!ALLOWED_REGISTER_ROLES.includes(role)) {
    errors.role = 'Select a valid role'
  }
  if (requireOtp && !isRequired(otp)) {
    errors.otp = 'Enter the verification code sent to your email'
  }
  if (requireCaptcha && !isRequired(captchaToken)) {
    errors.captchaToken = 'Please complete the captcha challenge'
  }
  return errors
}

export const validateLoanPayload = ({ amount, tenureMonths, purpose }) => {
  const errors = {}
  if (!isAmountValid(Number(amount)) || Number(amount) < 1000) {
    errors.amount = 'Amount must be at least 1000'
  }
  if (!Number(tenureMonths) || Number(tenureMonths) <= 0) {
    errors.tenureMonths = 'Tenure should be greater than 0 months'
  }
  if (!isRequired(purpose)) {
    errors.purpose = 'Purpose is required'
  }
  return errors
}
