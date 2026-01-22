export const ROLE = {
  BORROWER: 'BORROWER',
  LENDER: 'LENDER',
  ADMIN: 'ADMIN',
}

export const ROLE_HOME_PATH = {
  [ROLE.BORROWER]: '/dashboard/borrower',
  [ROLE.LENDER]: '/dashboard/lender',
  [ROLE.ADMIN]: '/admin/overview',
}

export const getRoleHomePath = (role) =>
  ROLE_HOME_PATH[role] || ROLE_HOME_PATH[ROLE.BORROWER]

export const LOAN_STATUS = [
  'REQUESTED',
  'APPROVED',
  'FUNDING',
  'FUNDED',
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
  { to: '/loans/marketplace', label: 'Loan Marketplace', roles: [ROLE.LENDER], exact: true },
  { to: '/loans/offers', label: 'My Offers', roles: [ROLE.LENDER], exact: true },
  { to: '/loans/apply', label: 'Apply Loan', roles: [ROLE.BORROWER], exact: true },
  { to: '/loans', label: 'My Loans', roles: [ROLE.BORROWER], exact: true },
  { to: '/wallet', label: 'Wallet', roles: [ROLE.BORROWER, ROLE.LENDER], exact: true },
  {
    to: '/wallet/transactions',
    label: 'Transactions',
    roles: [ROLE.BORROWER, ROLE.LENDER],
    exact: true,
  },
  { to: '/admin/overview', label: 'Admin Dashboard', roles: [ROLE.ADMIN], exact: true },
]

export const ADMIN_NAV_GROUPS = [
  {
    title: 'Overview',
    items: [{ to: '/admin/overview', label: 'Overview' }],
  },
  {
    title: 'Users & KYC',
    items: [{ to: '/admin/users', label: 'Users & KYC' }],
  },
  {
    title: 'Loans',
    items: [
      { to: '/admin/loans/applications', label: 'Applications' },
      { to: '/admin/loans/active', label: 'Active loans' },
      { to: '/admin/loans/defaults', label: 'Defaults' },
    ],
  },
  {
    title: 'Wallets & Transactions',
    items: [
      { to: '/admin/wallets', label: 'Wallets' },
      { to: '/admin/transactions', label: 'Transactions' },
    ],
  },
  {
    title: 'Disputes',
    items: [{ to: '/admin/disputes', label: 'Disputes & Chargebacks' }],
  },
  {
    title: 'Notifications',
    items: [{ to: '/admin/notifications', label: 'Notifications' }],
  },
  {
    title: 'Risk & Fraud',
    items: [{ to: '/admin/risk', label: 'Risk & Fraud' }],
  },
  {
    title: 'Reports',
    items: [{ to: '/admin/reports', label: 'Reports' }],
  },
  {
    title: 'System',
    items: [
      { to: '/admin/system/services', label: 'Services' },
      { to: '/admin/system/config', label: 'Config' },
      { to: '/admin/system/audit-logs', label: 'Audit logs' },
    ],
  },
]

export const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BDT',
})

export const MIN_PASSWORD_LENGTH = 8
