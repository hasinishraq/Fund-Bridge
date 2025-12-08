import { MIN_PASSWORD_LENGTH } from './constants'

export const isEmailValid = (value) => /\S+@\S+\.\S+/.test(String(value).toLowerCase())

export const isAmountValid = (value) => typeof value === 'number' && value > 0

export const isRequired = (value) =>
  value !== null && value !== undefined && String(value).trim().length > 0

export const validateLogin = ({ email, password }) => {
  const errors = {}
  if (!isEmailValid(email)) {
    errors.email = 'Enter a valid email'
  }
  if (!isRequired(password)) {
    errors.password = 'Password is required'
  }
  return errors
}

export const validateRegister = ({ name, email, password, confirmPassword }) => {
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
  return errors
}

export const validateLoanPayload = ({ amount, tenureMonths, purpose }) => {
  const errors = {}
  if (!isAmountValid(Number(amount))) {
    errors.amount = 'Amount must be a positive number'
  }
  if (!Number(tenureMonths) || Number(tenureMonths) <= 0) {
    errors.tenureMonths = 'Tenure should be greater than 0 months'
  }
  if (!isRequired(purpose)) {
    errors.purpose = 'Purpose is required'
  }
  return errors
}
