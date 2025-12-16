export const ROLE = {
  BORROWER: 'BORROWER',
  ADMIN: 'ADMIN',
}

export const LOAN_STATUS = [
  'PENDING',
  'APPROVED',
  'FUNDING',
  'DISBURSED',
  'ACTIVE',
  'REJECTED',
  'DEFAULTED',
  'CLOSED',
]

export const API_STATUS = {
  idle: 'IDLE',
  loading: 'LOADING',
  success: 'SUCCESS',
  error: 'ERROR',
}

export const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', roles: [ROLE.BORROWER, ROLE.ADMIN] },
  { to: '/loans/apply', label: 'Apply Loan', roles: [ROLE.BORROWER] },
  { to: '/loans', label: 'My Loans', roles: [ROLE.BORROWER] },
  { to: '/wallet', label: 'Wallet', roles: [ROLE.BORROWER] },
  { to: '/wallet/transactions', label: 'Transactions', roles: [ROLE.BORROWER] },
  { to: '/admin', label: 'Admin Dashboard', roles: [ROLE.ADMIN] },
]

export const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export const MIN_PASSWORD_LENGTH = 8
