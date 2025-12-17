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
  { to: '/dashboard/borrower', label: 'Dashboard', roles: [ROLE.BORROWER], exact: true },
  { to: '/dashboard/borrower/profile', label: 'Profile', roles: [ROLE.BORROWER], exact: true },
  { to: '/dashboard/lender', label: 'Lender Dashboard', roles: [ROLE.LENDER], exact: true },
  { to: '/loans/apply', label: 'Apply Loan', roles: [ROLE.BORROWER], exact: true },
  { to: '/loans', label: 'My Loans', roles: [ROLE.BORROWER], exact: true },
  { to: '/wallet', label: 'Wallet', roles: [ROLE.BORROWER, ROLE.LENDER], exact: true },
  {
    to: '/wallet/transactions',
    label: 'Transactions',
    roles: [ROLE.BORROWER, ROLE.LENDER],
    exact: true,
  },
  { to: '/admin', label: 'Admin Dashboard', roles: [ROLE.ADMIN], exact: true },
]

export const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export const MIN_PASSWORD_LENGTH = 8
