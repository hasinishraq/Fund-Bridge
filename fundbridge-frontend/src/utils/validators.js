import { MIN_PASSWORD_LENGTH, PASSWORD_REQUIREMENTS_MESSAGE, ROLE } from './constants'

export const isEmailValid = (value) => /\S+@\S+\.\S+/.test(String(value).toLowerCase())

export const isAmountValid = (value) => typeof value === 'number' && value > 0

export const isRequired = (value) =>
  value !== null && value !== undefined && String(value).trim().length > 0

const hasLetter = (value) => /[A-Za-z]/.test(value)
const hasNumber = (value) => /\d/.test(value)
const hasSpecial = (value) => /[^A-Za-z0-9\s]/.test(value)

export const getPasswordChecks = (value = '') => {
  const password = typeof value === 'string' ? value : String(value ?? '')
  return {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    hasLetter: hasLetter(password),
    hasNumber: hasNumber(password),
    hasSpecial: hasSpecial(password),
  }
}

export const isStrongPassword = (value) => {
  const checks = getPasswordChecks(value)
  return checks.minLength && checks.hasLetter && checks.hasNumber && checks.hasSpecial
}

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
  if (!isRequired(password)) {
    errors.password = 'Password is required'
  } else if (!isStrongPassword(password)) {
    errors.password = PASSWORD_REQUIREMENTS_MESSAGE
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

export const validateAdminRegister = (
  { name, email, password, confirmPassword, adminSecret, otp, captchaToken },
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
  if (!isRequired(password)) {
    errors.password = 'Password is required'
  } else if (!isStrongPassword(password)) {
    errors.password = PASSWORD_REQUIREMENTS_MESSAGE
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }
  if (!isRequired(adminSecret)) {
    errors.adminSecret = 'Admin registration secret is required'
  }
  if (requireOtp && !isRequired(otp)) {
    errors.otp = 'Enter the verification code sent to your email'
  }
  if (requireCaptcha && !isRequired(captchaToken)) {
    errors.captchaToken = 'Please complete the captcha challenge'
  }
  return errors
}

export const validatePasswordReset = (
  { email, otp, password, confirmPassword, captchaToken },
  options = {},
) => {
  const { requireOtp = false, requirePasswords = false, requireCaptcha = false } = options
  const errors = {}
  if (!isEmailValid(email)) {
    errors.email = 'Enter a valid email'
  }
  if (requireOtp && !isRequired(otp)) {
    errors.otp = 'Enter the verification code sent to your email'
  }
  if (requirePasswords) {
    if (!isRequired(password)) {
      errors.password = 'Password is required'
    } else if (!isStrongPassword(password)) {
      errors.password = PASSWORD_REQUIREMENTS_MESSAGE
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
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
