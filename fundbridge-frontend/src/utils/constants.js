export const ROLE = {
  BORROWER: 'BORROWER',
  LENDER: 'LENDER',
  ADMIN: 'ADMIN',
}

export const ROLE_HOME_PATH = {
  [ROLE.BORROWER]: '/dashboard/borrower',
  [ROLE.LENDER]: '/dashboard/lender',
  [ROLE.ADMIN]: '/admin',
}

export const getRoleHomePath = (role) =>
  ROLE_HOME_PATH[role] || ROLE_HOME_PATH[ROLE.BORROWER]

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
  { to: '/dashboard/borrower', label: 'Dashboard', roles: [ROLE.BORROWER] },
  { to: '/dashboard/lender', label: 'Lender Dashboard', roles: [ROLE.LENDER] },
  { to: '/loans/apply', label: 'Apply Loan', roles: [ROLE.BORROWER] },
  { to: '/loans', label: 'My Loans', roles: [ROLE.BORROWER] },
  { to: '/wallet', label: 'Wallet', roles: [ROLE.BORROWER, ROLE.LENDER] },
  {
    to: '/wallet/transactions',
    label: 'Transactions',
    roles: [ROLE.BORROWER, ROLE.LENDER],
  },
  { to: '/admin', label: 'Admin Dashboard', roles: [ROLE.ADMIN] },
]

export const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export const MIN_PASSWORD_LENGTH = 8
