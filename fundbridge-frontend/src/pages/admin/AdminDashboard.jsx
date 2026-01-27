
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  createAdminAction,
  createAdminAuditLog,
  fetchAdminDashboardOverview,
} from '../../api/adminApi'
import Button from '../../components/common/Button'
import { API_STATUS, CURRENCY_FORMATTER, ROLE, getRoleHomePath } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

const SECTION_ANCHORS = {
  overview: 'overview',
  users: 'users-kyc',
  'loans/applications': 'loan-applications',
  'loans/active': 'loan-active',
  'loans/defaults': 'loan-defaults',
  wallets: 'wallets',
  transactions: 'transactions',
  disputes: 'disputes',
  notifications: 'notifications',
  risk: 'risk-alerts',
  reports: 'reports',
  'system/services': 'system-services',
  'system/config': 'system-config',
  'system/audit-logs': 'system-audit-logs',
}

const PAGE_META = {
  overview: {
    eyebrow: 'Admin console',
    title: 'Operations control room',
    description:
      'Monitor loan health, payments integrity, and escalation queues from one command surface.',
  },
  users: {
    eyebrow: 'User compliance',
    title: 'Users & KYC',
    description: 'Review identity verification, onboarding, and escalated profile checks.',
  },
  'loans/applications': {
    eyebrow: 'Loan review',
    title: 'Loan applications',
    description: 'Approve, request info, or escalate incoming loan requests.',
  },
  'loans/active': {
    eyebrow: 'Portfolio view',
    title: 'Active loans',
    description: 'Track live repayment behavior and risk indicators across the portfolio.',
  },
  'loans/defaults': {
    eyebrow: 'Collections',
    title: 'Defaults & overdue',
    description: 'Prioritize recovery and monitor delinquency hotspots.',
  },
  wallets: {
    eyebrow: 'Wallet operations',
    title: 'Wallets',
    description: 'Monitor wallet balances, inflow trends, and outbound flows.',
  },
  transactions: {
    eyebrow: 'Payments',
    title: 'Transactions',
    description: 'Review gateway performance, failures, and settlement status.',
  },
  disputes: {
    eyebrow: 'Disputes',
    title: 'Disputes & chargebacks',
    description: 'Track chargebacks, claims, and remediation queues.',
  },
  notifications: {
    eyebrow: 'Communications',
    title: 'Notifications',
    description: 'Audit outbound alerts, reminders, and escalation messages.',
  },
  risk: {
    eyebrow: 'Risk & fraud',
    title: 'Risk console',
    description: 'Investigate anomalies, suspicious activity, and risk flags.',
  },
  reports: {
    eyebrow: 'Analytics',
    title: 'Reports',
    description: 'Export performance snapshots and compliance reporting.',
  },
  'system/services': {
    eyebrow: 'System health',
    title: 'Services',
    description: 'Monitor service availability, latency, and uptime.',
  },
  'system/config': {
    eyebrow: 'System config',
    title: 'Config changes',
    description: 'Review configuration updates and approvals.',
  },
  'system/audit-logs': {
    eyebrow: 'Audit trail',
    title: 'Audit logs',
    description: 'Inspect admin actions and service logs.',
  },
}

const DEFAULT_RISK_FILTERS = {
  status: '',
  gateway: '',
  dateFrom: '',
  dateTo: '',
  riskScore: '',
  query: '',
}

const DEFAULT_APPROVAL_FILTERS = {
  type: '',
  status: '',
  riskScore: '',
}

const SAVED_VIEWS = [
  { id: 'all', label: 'All events', filters: DEFAULT_RISK_FILTERS },
  { id: 'overdue-30', label: 'Overdue 30+', filters: { status: 'Overdue 30+' } },
  { id: 'gateway-fail', label: 'Gateway failures', filters: { status: 'Gateway failure' } },
  { id: 'suspicious', label: 'Suspicious activity', filters: { status: 'Suspicious activity' } },
  { id: 'custom', label: 'Custom view', filters: {} },
]

const RISK_ACTIONS = [
  {
    key: 'freeze-wallet',
    label: 'Freeze wallet',
    permission: 'canFreezeWallet',
    actionType: 'FREEZE_WALLET',
    targetType: 'WALLET_ACCOUNT',
    auditEvent: 'WALLET_FREEZE_REQUEST',
  },
  {
    key: 'flag-user',
    label: 'Flag user',
    permission: 'canFlagUser',
    actionType: 'BLOCK_USER',
    targetType: 'USER',
    auditEvent: 'USER_FLAG_REQUEST',
  },
  {
    key: 'refund',
    label: 'Refund',
    permission: 'canRefund',
    actionType: 'LOAN_OVERRIDE',
    targetType: 'LOAN',
    auditEvent: 'REFUND_REQUEST',
  },
  {
    key: 'resend-notice',
    label: 'Resend notice',
    permission: 'canResend',
    actionType: null,
    targetType: null,
    auditEvent: 'RESEND_NOTIFICATION',
  },
]

const RISK_EVENTS = [
  {
    id: 'EVT-9142',
    type: 'Failed payment spike',
    status: 'Gateway failure',
    userId: 'USR-2049',
    userName: 'A Rahman',
    loanId: 'LN-2210',
    walletId: 'WAL-9021',
    gateway: 'SSLCommerz',
    ref: 'txn_4c21',
    amount: 125000,
    riskScore: 88,
    channel: 'Webhook',
    createdAt: '2026-01-21T10:24:00Z',
  },
  {
    id: 'EVT-9143',
    type: 'Overdue installment',
    status: 'Overdue 30+',
    userId: 'USR-1183',
    userName: 'M Hasan',
    loanId: 'LN-2044',
    walletId: 'WAL-4411',
    gateway: 'N/A',
    ref: 'loan_2044',
    amount: 420000,
    riskScore: 76,
    channel: 'Repayments',
    createdAt: '2026-01-21T06:18:00Z',
  },
  {
    id: 'EVT-9144',
    type: 'Chargeback cluster',
    status: 'Chargeback',
    userId: 'USR-3321',
    userName: 'S Saha',
    loanId: 'LN-1999',
    walletId: 'WAL-5532',
    gateway: 'Stripe',
    ref: 'cb_19a8',
    amount: 98000,
    riskScore: 91,
    channel: 'Disputes',
    createdAt: '2026-01-20T16:05:00Z',
  },
  {
    id: 'EVT-9145',
    type: 'Suspicious login attempts',
    status: 'Suspicious activity',
    userId: 'USR-2711',
    userName: 'R Islam',
    loanId: 'LN-1802',
    walletId: 'WAL-3300',
    gateway: 'N/A',
    ref: 'auth_8821',
    amount: 0,
    riskScore: 84,
    channel: 'Auth',
    createdAt: '2026-01-20T11:42:00Z',
  },
  {
    id: 'EVT-9146',
    type: 'Wallet negative balance',
    status: 'Negative balance',
    userId: 'USR-1872',
    userName: 'T Ahmed',
    loanId: 'LN-2094',
    walletId: 'WAL-1008',
    gateway: 'N/A',
    ref: 'wal_1008',
    amount: 3200,
    riskScore: 63,
    channel: 'Wallet',
    createdAt: '2026-01-20T08:10:00Z',
  },
  {
    id: 'EVT-9147',
    type: 'Large disbursement',
    status: 'High value',
    userId: 'USR-9031',
    userName: 'N Chowdhury',
    loanId: 'LN-4021',
    walletId: 'WAL-7432',
    gateway: 'Stripe',
    ref: 'payout_1101',
    amount: 2400000,
    riskScore: 72,
    channel: 'Payouts',
    createdAt: '2026-01-19T15:18:00Z',
  },
  {
    id: 'EVT-9148',
    type: 'Webhook retry storm',
    status: 'Gateway failure',
    userId: 'USR-4410',
    userName: 'J Alam',
    loanId: 'LN-2310',
    walletId: 'WAL-6631',
    gateway: 'SSLCommerz',
    ref: 'wh_1120',
    amount: 76000,
    riskScore: 67,
    channel: 'Webhooks',
    createdAt: '2026-01-19T09:54:00Z',
  },
  {
    id: 'EVT-9149',
    type: 'Overdue early',
    status: 'Overdue 1-7',
    userId: 'USR-2844',
    userName: 'K Roy',
    loanId: 'LN-2147',
    walletId: 'WAL-8820',
    gateway: 'N/A',
    ref: 'loan_2147',
    amount: 54000,
    riskScore: 58,
    channel: 'Repayments',
    createdAt: '2026-01-18T13:33:00Z',
  },
]

const PENDING_APPROVALS = [
  {
    id: 'APP-204',
    type: 'KYC',
    userId: 'USR-3301',
    userName: 'F Khan',
    status: 'Pending review',
    riskScore: 42,
    amount: null,
    loanId: null,
    queue: 'KYC',
    requestedAt: '2026-01-21T09:20:00Z',
  },
  {
    id: 'APP-205',
    type: 'Loan',
    userId: 'USR-4111',
    userName: 'S Ahmed',
    status: 'Escalated',
    riskScore: 77,
    amount: 450000,
    loanId: 'LN-3110',
    queue: 'Risk',
    requestedAt: '2026-01-21T07:45:00Z',
  },
  {
    id: 'APP-206',
    type: 'KYC',
    userId: 'USR-2911',
    userName: 'A Habib',
    status: 'Needs info',
    riskScore: 55,
    amount: null,
    loanId: null,
    queue: 'KYC',
    requestedAt: '2026-01-20T16:12:00Z',
  },
  {
    id: 'APP-207',
    type: 'Loan',
    userId: 'USR-4502',
    userName: 'L Noor',
    status: 'Pending review',
    riskScore: 61,
    amount: 120000,
    loanId: 'LN-3098',
    queue: 'Ops',
    requestedAt: '2026-01-20T12:40:00Z',
  },
  {
    id: 'APP-208',
    type: 'Loan',
    userId: 'USR-1620',
    userName: 'D Karim',
    status: 'Pending review',
    riskScore: 48,
    amount: 76000,
    loanId: 'LN-2801',
    queue: 'Ops',
    requestedAt: '2026-01-20T09:05:00Z',
  },
  {
    id: 'APP-209',
    type: 'KYC',
    userId: 'USR-5202',
    userName: 'P Roy',
    status: 'Escalated',
    riskScore: 82,
    amount: null,
    loanId: null,
    queue: 'Risk',
    requestedAt: '2026-01-19T15:22:00Z',
  },
]

const ALERTS = [
  {
    id: 'alert-1',
    title: 'Payment gateway failures spike',
    detail: 'Last 1h: SSLCommerz 2.4% failure rate',
    severity: 'high',
    time: '1h ago',
    action: 'Investigate',
  },
  {
    id: 'alert-2',
    title: 'Multiple chargebacks from same user',
    detail: '3 chargebacks in 24h for USR-3321',
    severity: 'high',
    time: '2h ago',
    action: 'Open case',
  },
  {
    id: 'alert-3',
    title: 'Failed login attempts',
    detail: '17 attempts from new IP range',
    severity: 'medium',
    time: '3h ago',
    action: 'Review',
  },
  {
    id: 'alert-4',
    title: 'High-risk loan applications pending',
    detail: '9 applications waiting in Risk queue',
    severity: 'high',
    time: '5h ago',
    action: 'Open queue',
  },
  {
    id: 'alert-5',
    title: 'Wallet negative balance anomalies',
    detail: '4 wallets below 0 after reversals',
    severity: 'medium',
    time: 'Today',
    action: 'Audit wallets',
  },
  {
    id: 'alert-6',
    title: 'Notification delivery drop',
    detail: 'Webhook failures increased in last 30m',
    severity: 'low',
    time: 'Today',
    action: 'Check logs',
  },
]

const SERVICE_HEALTH = [
  { name: 'auth-service', status: 'Operational', latency: '210ms' },
  { name: 'wallet-service', status: 'Degraded', latency: '640ms' },
  { name: 'loan-management-service', status: 'Operational', latency: '320ms' },
  { name: 'notification-service', status: 'Incident', latency: '1.2s' },
]

const CONFIG_CHANGES = [
  {
    id: 'cfg-1',
    title: 'Webhook retries increased 3 -> 5',
    admin: 'Admin 12',
    time: '2h ago',
    reason: 'Payment gateway timeouts',
  },
  {
    id: 'cfg-2',
    title: 'Risk score threshold set to 80',
    admin: 'Admin 7',
    time: 'Yesterday',
    reason: 'Fraud spike',
  },
  {
    id: 'cfg-3',
    title: 'Chargeback auto-freeze enabled',
    admin: 'Admin 3',
    time: '2d ago',
    reason: 'Ops policy update',
  },
]

const LOAN_HEALTH_TREND = [
  { label: 'Mon', value: 2.8 },
  { label: 'Tue', value: 3.1 },
  { label: 'Wed', value: 2.9 },
  { label: 'Thu', value: 3.4 },
  { label: 'Fri', value: 3.0 },
  { label: 'Sat', value: 2.6 },
  { label: 'Sun', value: 2.7 },
]

const COLLECTIONS_PIPELINE = [
  { label: 'Due today', count: 482, amount: 4200000, percent: 100 },
  { label: 'Overdue 1-7', count: 216, amount: 3100000, percent: 68 },
  { label: 'Overdue 8-30', count: 98, amount: 1900000, percent: 45 },
  { label: 'Overdue 30+', count: 38, amount: 820000, percent: 22 },
]

const GATEWAY_FAILURES = [
  { label: 'SSLCommerz', rate: 1.8, volume: 12840 },
  { label: 'Stripe', rate: 0.9, volume: 8420 },
]

const USER_FUNNEL = [
  { label: 'Registered', count: 12540, percent: 100 },
  { label: 'KYC submitted', count: 8420, percent: 67 },
  { label: 'Approved', count: 6120, percent: 49 },
  { label: 'Funded', count: 3180, percent: 25 },
]

const COMPACT_FORMATTER = new Intl.NumberFormat('en-US', { notation: 'compact' })

const formatLabel = (value) => {
  if (!value) {
    return 'N/A'
  }
  return value
    .toString()
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ')
}

const formatDateTime = (value) => {
  if (!value) {
    return 'N/A'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }
  return date.toLocaleString()
}

const formatDateShort = (value) => {
  if (!value) {
    return 'N/A'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const normalizeOptional = (value) => {
  if (value === null || value === undefined) {
    return undefined
  }
  const trimmed = value.toString().trim()
  return trimmed ? trimmed : undefined
}

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

const resolveErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback

const formatCurrency = (value) => CURRENCY_FORMATTER.format(value || 0)

const toNumber = (value) => {
  const parsed = parseNumber(value)
  return parsed === undefined ? 0 : parsed
}

const formatMaybeCurrency = (value) => {
  if (value === null || value === undefined || value === '') {
    return '--'
  }
  const parsed = parseNumber(value)
  if (parsed === undefined) {
    return '--'
  }
  return formatCurrency(parsed)
}

const formatPercent = (value) => {
  const parsed = parseNumber(value)
  if (parsed === undefined) {
    return '--'
  }
  const normalized = parsed > 1 ? parsed : parsed * 100
  return `${normalized.toFixed(1)}%`
}

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { '*': sectionPath } = useParams()
  const activeSection = sectionPath ? sectionPath.replace(/\/$/, '') : 'overview'
  const resolvedSection = SECTION_ANCHORS[activeSection] ? activeSection : 'overview'
  const riskTableRef = useRef(null)

  const [pageStatus, setPageStatus] = useState(API_STATUS.loading)
  const [actionsStatus, setActionsStatus] = useState(API_STATUS.idle)
  const [auditStatus, setAuditStatus] = useState(API_STATUS.idle)
  const [actionsError, setActionsError] = useState('')
  const [auditError, setAuditError] = useState('')
  const [actions, setActions] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [riskEventsData, setRiskEventsData] = useState([])
  const [approvalItems, setApprovalItems] = useState([])
  const [alerts, setAlerts] = useState([])
  const [kpiSnapshot, setKpiSnapshot] = useState(null)
  const [overviewCounts, setOverviewCounts] = useState({
    actionCount: 0,
    auditLogCount: 0,
    activeAlerts: 0,
    riskEventCount: 0,
    approvalCount: 0,
    uniqueAdminCount: 0,
  })
  const [refreshing, setRefreshing] = useState(false)
  const [riskFilters, setRiskFilters] = useState({ ...DEFAULT_RISK_FILTERS })
  const [savedView, setSavedView] = useState('all')
  const [riskSort, setRiskSort] = useState({ key: 'createdAt', direction: 'desc' })
  const [riskPage, setRiskPage] = useState(1)
  const [selectedRiskIds, setSelectedRiskIds] = useState([])
  const [approvalFilters, setApprovalFilters] = useState({ ...DEFAULT_APPROVAL_FILTERS })
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [referenceQuery, setReferenceQuery] = useState('')
  const [actionModal, setActionModal] = useState(null)
  const [actionReason, setActionReason] = useState('')
  const [actionSubmitting, setActionSubmitting] = useState(false)
  const [toasts, setToasts] = useState([])
  const [activeMetric, setActiveMetric] = useState('')

  const isOverview = resolvedSection === 'overview'
  const isUsersPage = resolvedSection === 'users'
  const isLoanApplicationsPage = resolvedSection === 'loans/applications'
  const isLoanActivePage = resolvedSection === 'loans/active'
  const isLoanDefaultsPage = resolvedSection === 'loans/defaults'
  const isWalletsPage = resolvedSection === 'wallets'
  const isTransactionsPage = resolvedSection === 'transactions'
  const isDisputesPage = resolvedSection === 'disputes'
  const isNotificationsPage = resolvedSection === 'notifications'
  const isRiskPage = resolvedSection === 'risk'
  const isReportsPage = resolvedSection === 'reports'
  const isSystemServicesPage = resolvedSection === 'system/services'
  const isSystemConfigPage = resolvedSection === 'system/config'
  const isSystemAuditPage = resolvedSection === 'system/audit-logs'

  const approvalTypeLock = isUsersPage ? 'KYC' : isLoanApplicationsPage ? 'Loan' : ''

  const effectiveApprovalFilters = useMemo(
    () => (approvalTypeLock ? { ...approvalFilters, type: approvalTypeLock } : approvalFilters),
    [approvalFilters, approvalTypeLock],
  )

  const showRiskTable =
    isOverview || isRiskPage || isLoanActivePage || isLoanDefaultsPage
  const showApprovalsTable = isOverview || isUsersPage || isLoanApplicationsPage
  const showAlertsPanel =
    isOverview || isRiskPage || isDisputesPage || isNotificationsPage
  const showPipelinePanel = isOverview || isLoanDefaultsPage
  const showChartsGrid = isOverview || isReportsPage
  const showSystemGrid =
    isOverview || isSystemServicesPage || isSystemConfigPage || isSystemAuditPage
  const showSystemServices = isOverview || isSystemServicesPage
  const showSystemConfig = isOverview || isSystemConfigPage
  const showSystemAudit = isOverview || isSystemAuditPage

  const pageMeta = PAGE_META[resolvedSection] || PAGE_META.overview

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, ...toast }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 4200)
  }, [])

  const loadSystemData = useCallback(async () => {
    setActionsStatus(API_STATUS.loading)
    setAuditStatus(API_STATUS.loading)
    setActionsError('')
    setAuditError('')
    try {
      const overview = await fetchAdminDashboardOverview({
        riskLimit: 60,
        approvalLimit: 60,
        alertLimit: 8,
        actionLimit: 40,
        auditLimit: 40,
      })
      setActions(Array.isArray(overview?.actions) ? overview.actions : [])
      setAuditLogs(Array.isArray(overview?.auditLogs) ? overview.auditLogs : [])
      setRiskEventsData(
        Array.isArray(overview?.riskEvents)
          ? overview.riskEvents.map((event) => ({
              ...event,
              ref: event.referenceId || event.ref || event.id,
            }))
          : [],
      )
      setApprovalItems(Array.isArray(overview?.approvals) ? overview.approvals : [])
      setAlerts(
        Array.isArray(overview?.alerts)
          ? overview.alerts.map((alert) => ({
              ...alert,
              severity: alert.severity
                ? alert.severity.toString().toLowerCase()
                : 'low',
              action: alert.actionLabel || 'Review',
              time: formatDateTime(alert.createdAt),
            }))
          : [],
      )
      setKpiSnapshot(overview?.kpis || null)
      setOverviewCounts({
        actionCount: overview?.actionCount ?? 0,
        auditLogCount: overview?.auditLogCount ?? 0,
        activeAlerts: overview?.activeAlerts ?? 0,
        riskEventCount: overview?.riskEventCount ?? 0,
        approvalCount: overview?.approvalCount ?? 0,
        uniqueAdminCount: overview?.uniqueAdminCount ?? 0,
      })
      setActionsStatus(API_STATUS.success)
      setAuditStatus(API_STATUS.success)
    } catch (error) {
      console.error(error)
      setActionsStatus(API_STATUS.error)
      setAuditStatus(API_STATUS.error)
      setActionsError(resolveErrorMessage(error, 'Unable to load admin actions'))
      setAuditError(resolveErrorMessage(error, 'Unable to load audit logs'))
      setActions([])
      setAuditLogs([])
      setRiskEventsData([])
      setApprovalItems([])
      setAlerts([])
      setKpiSnapshot(null)
      setOverviewCounts({
        actionCount: 0,
        auditLogCount: 0,
        activeAlerts: 0,
        riskEventCount: 0,
        approvalCount: 0,
        uniqueAdminCount: 0,
      })
    } finally {
      setPageStatus(API_STATUS.success)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }
    if (user?.role !== ROLE.ADMIN) {
      setPageStatus(API_STATUS.success)
      return
    }
    setPageStatus(API_STATUS.loading)
    loadSystemData()
  }, [user, loadSystemData])

  const handleRefreshAll = useCallback(async () => {
    setRefreshing(true)
    await loadSystemData()
    setRefreshing(false)
    addToast({
      type: 'success',
      title: 'Dashboard refreshed',
      message: `Updated ${new Date().toLocaleTimeString()}`,
    })
  }, [addToast, loadSystemData])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tag = event.target?.tagName?.toLowerCase()
      const isEditable =
        tag === 'input' || tag === 'textarea' || event.target?.isContentEditable
      if (isEditable) {
        return
      }
      if (event.shiftKey && event.key.toLowerCase() === 'r') {
        event.preventDefault()
        handleRefreshAll()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleRefreshAll])

  const riskEvents = useMemo(() => riskEventsData, [riskEventsData])
  const pendingApprovals = useMemo(() => approvalItems, [approvalItems])

  const statusOptions = useMemo(() => {
    return Array.from(new Set(riskEvents.map((event) => event.status).filter(Boolean))).sort()
  }, [riskEvents])

  const gatewayOptions = useMemo(() => {
    return Array.from(new Set(riskEvents.map((event) => event.gateway))).filter(Boolean).sort()
  }, [riskEvents])

  const filteredRiskEvents = useMemo(() => {
    const query = riskFilters.query.trim().toLowerCase()
    const minRisk = parseNumber(riskFilters.riskScore)
    const fromDate = riskFilters.dateFrom ? new Date(riskFilters.dateFrom) : null
    const toDate = riskFilters.dateTo ? new Date(riskFilters.dateTo) : null

    const filtered = riskEvents.filter((event) => {
      if (riskFilters.status && event.status !== riskFilters.status) {
        return false
      }
      if (riskFilters.gateway && event.gateway !== riskFilters.gateway) {
        return false
      }
      if (minRisk !== undefined && event.riskScore < minRisk) {
        return false
      }
      if (fromDate) {
        const createdAt = new Date(event.createdAt)
        if (createdAt < fromDate) {
          return false
        }
      }
      if (toDate) {
        const createdAt = new Date(event.createdAt)
        const endOfDay = new Date(toDate)
        endOfDay.setHours(23, 59, 59, 999)
        if (createdAt > endOfDay) {
          return false
        }
      }
      if (query) {
        const haystack = [
          event.id,
          event.type,
          event.userId,
          event.userName,
          event.loanId,
          event.walletId,
          event.gateway,
          event.ref,
          event.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(query)) {
          return false
        }
      }
      return true
    })

    const sorted = [...filtered]
    if (riskSort.key) {
      sorted.sort((a, b) => {
        const direction = riskSort.direction === 'asc' ? 1 : -1
        if (riskSort.key === 'createdAt') {
          return (
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
            direction
          )
        }
        if (riskSort.key === 'amount') {
          return (a.amount - b.amount) * direction
        }
        if (riskSort.key === 'riskScore') {
          return (a.riskScore - b.riskScore) * direction
        }
        return 0
      })
    }
    return sorted
  }, [riskEvents, riskFilters, riskSort])

  const riskPageSize = 6
  const totalRiskPages = Math.max(1, Math.ceil(filteredRiskEvents.length / riskPageSize))
  const pagedRiskEvents = useMemo(() => {
    const start = (riskPage - 1) * riskPageSize
    return filteredRiskEvents.slice(start, start + riskPageSize)
  }, [filteredRiskEvents, riskPage])

  useEffect(() => {
    if (riskPage > totalRiskPages) {
      setRiskPage(totalRiskPages)
    }
  }, [riskPage, totalRiskPages])

  useEffect(() => {
    setSelectedRiskIds([])
  }, [riskFilters, riskPage])

  const filteredApprovals = useMemo(() => {
    const minRisk = parseNumber(effectiveApprovalFilters.riskScore)
    return pendingApprovals.filter((item) => {
      if (effectiveApprovalFilters.type && item.type !== effectiveApprovalFilters.type) {
        return false
      }
      if (effectiveApprovalFilters.status && item.status !== effectiveApprovalFilters.status) {
        return false
      }
      if (minRisk !== undefined && item.riskScore < minRisk) {
        return false
      }
      return true
    })
  }, [pendingApprovals, effectiveApprovalFilters])

  const sortedActions = useMemo(() => {
    return [...actions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [actions])

  const sortedAuditLogs = useMemo(() => {
    return [...auditLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [auditLogs])

  const uniqueAdmins = useMemo(() => {
    if (overviewCounts && typeof overviewCounts.uniqueAdminCount === 'number') {
      return overviewCounts.uniqueAdminCount
    }
    const ids = new Set(actions.map((action) => action?.adminUserId).filter(Boolean))
    return ids.size
  }, [actions, overviewCounts])

  const latestAuditAt = sortedAuditLogs[0]?.createdAt

  const roleBadges = useMemo(
    () => [
      { label: 'Super Admin', active: true },
      { label: 'Ops', active: true },
      { label: 'Risk', active: true },
      { label: 'Support', active: false },
    ],
    [],
  )

  const permissions = useMemo(() => {
    const hasRole = (label) => roleBadges.some((badge) => badge.label === label && badge.active)
    return {
      canFreezeWallet: hasRole('Super Admin') || hasRole('Ops'),
      canFlagUser: hasRole('Super Admin') || hasRole('Risk'),
      canRefund: hasRole('Super Admin') || hasRole('Ops'),
      canResend: hasRole('Super Admin') || hasRole('Support'),
    }
  }, [roleBadges])

  const kpiCards = useMemo(() => {
    const snapshot = kpiSnapshot || {}
    const inflow = parseNumber(snapshot.walletInflowToday)
    const outflow = parseNumber(snapshot.walletOutflowToday)
    const netFlow = (inflow || 0) - (outflow || 0)
    const netLabel =
      inflow === undefined && outflow === undefined
        ? 'Today net --'
        : `Today net ${formatCurrency(netFlow)}`
    const failed = snapshot.failedPaymentsCount
    const webhook = snapshot.webhookFailuresCount
    const hasFailures = failed !== null && failed !== undefined
    const hasWebhooks = webhook !== null && webhook !== undefined
    const failuresLabel =
      hasFailures || hasWebhooks ? `${failed ?? 0} / ${webhook ?? 0}` : '--'

    return [
      {
        id: 'outstanding',
        label: 'Total outstanding loans',
        value: formatMaybeCurrency(snapshot.totalOutstandingLoans),
        delta: snapshot.createdAt ? `As of ${formatDateShort(snapshot.createdAt)}` : 'Updated',
        filter: { status: 'High value' },
      },
      {
        id: 'disbursements',
        label: 'Today disbursements',
        value: formatMaybeCurrency(snapshot.todaysDisbursements),
        delta: 'Today',
        filter: { status: 'High value' },
      },
      {
        id: 'due-overdue',
        label: 'Due today / overdue',
        value: formatMaybeCurrency(snapshot.dueTodayAmount),
        subValue: formatMaybeCurrency(snapshot.overdueAmount),
        delta: 'Overdue total',
        filter: { status: 'Overdue 30+' },
      },
      {
        id: 'default-rate',
        label: 'Default rate (30d)',
        value: formatPercent(snapshot.defaultRate30d),
        delta: 'Rolling 30d',
        filter: { status: 'Overdue 30+' },
      },
      {
        id: 'wallet-flow',
        label: 'Wallet inflow / outflow',
        value: formatMaybeCurrency(snapshot.walletInflowToday),
        subValue: formatMaybeCurrency(snapshot.walletOutflowToday),
        delta: netLabel,
        filter: { status: 'Negative balance' },
      },
      {
        id: 'failed-payments',
        label: 'Failed payments / webhook',
        value: failuresLabel,
        delta: 'Last 24h',
        filter: { status: 'Gateway failure' },
      },
      {
        id: 'suspicious',
        label: 'Suspicious activity flags',
        value: COMPACT_FORMATTER.format(toNumber(snapshot.suspiciousActivityFlags)),
        delta: 'Action required',
        filter: { status: 'Suspicious activity' },
      },
    ]
  }, [kpiSnapshot])

  const pageKpiCards = useMemo(() => {
    if (isOverview) {
      return kpiCards
    }
    if (isWalletsPage) {
      return kpiCards.filter((card) => card.id === 'wallet-flow')
    }
    if (isTransactionsPage) {
      return kpiCards.filter((card) => card.id === 'failed-payments')
    }
    if (isRiskPage) {
      return kpiCards.filter((card) =>
        ['suspicious', 'failed-payments'].includes(card.id),
      )
    }
    if (isLoanApplicationsPage) {
      return kpiCards.filter((card) =>
        ['disbursements', 'outstanding'].includes(card.id),
      )
    }
    if (isLoanActivePage) {
      return kpiCards.filter((card) =>
        ['outstanding', 'due-overdue'].includes(card.id),
      )
    }
    if (isLoanDefaultsPage) {
      return kpiCards.filter((card) =>
        ['due-overdue', 'default-rate'].includes(card.id),
      )
    }
    return []
  }, [
    kpiCards,
    isOverview,
    isWalletsPage,
    isTransactionsPage,
    isRiskPage,
    isLoanApplicationsPage,
    isLoanActivePage,
    isLoanDefaultsPage,
  ])

  const isAllSelected =
    pagedRiskEvents.length > 0 &&
    pagedRiskEvents.every((event) => selectedRiskIds.includes(event.id))

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedRiskIds(pagedRiskEvents.map((event) => event.id))
    } else {
      setSelectedRiskIds([])
    }
  }

  const toggleSelectOne = (eventId) => {
    setSelectedRiskIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId],
    )
  }

  const handleSort = (key) => {
    setRiskSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'desc' }
    })
  }

  const getSortIndicator = (key) => {
    if (riskSort.key !== key) {
      return ''
    }
    return riskSort.direction === 'asc' ? '^' : 'v'
  }

  const handleRiskFilterChange = (event) => {
    const { name, value } = event.target
    setRiskFilters((prev) => ({ ...prev, [name]: value }))
    setSavedView('custom')
    setRiskPage(1)
  }

  const handleApprovalFilterChange = (event) => {
    const { name, value } = event.target
    if (approvalTypeLock && name === 'type') {
      return
    }
    setApprovalFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleSavedViewChange = (event) => {
    const viewId = event.target.value
    setSavedView(viewId)
    const view = SAVED_VIEWS.find((item) => item.id === viewId)
    if (!view || viewId === 'custom') {
      return
    }
    setRiskFilters({ ...DEFAULT_RISK_FILTERS, ...view.filters })
    setRiskPage(1)
  }

  const handleClearRiskFilters = () => {
    setRiskFilters({ ...DEFAULT_RISK_FILTERS })
    setSavedView('all')
    setRiskPage(1)
  }

  const handleMetricClick = (card) => {
    if (!card?.filter) {
      return
    }
    setActiveMetric(card.id)
    setRiskFilters({ ...DEFAULT_RISK_FILTERS, ...card.filter })
    setSavedView('custom')
    setRiskPage(1)
    if (showRiskTable) {
      riskTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate('/admin/risk')
    }
  }

  const handleReferenceLookup = () => {
    const query = referenceQuery.trim()
    if (!query) {
      addToast({
        type: 'error',
        title: 'Reference required',
        message: 'Enter a reference id to search.',
      })
      return
    }
    setRiskFilters((prev) => ({ ...prev, query }))
    setSavedView('custom')
    setRiskPage(1)
    if (showRiskTable) {
      riskTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate('/admin/risk')
    }
  }

  const handleExportCsv = () => {
    const header = [
      'Event ID',
      'Type',
      'Status',
      'User ID',
      'Loan ID',
      'Wallet ID',
      'Gateway',
      'Reference',
      'Amount',
      'Risk Score',
      'Created At',
    ]
    const rows = filteredRiskEvents.map((event) => [
      event.id,
      event.type,
      event.status,
      event.userId,
      event.loanId,
      event.walletId,
      event.gateway,
      event.ref,
      event.amount,
      event.riskScore,
      event.createdAt,
    ])
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'risk-events.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const getStatusTone = (status) => {
    const normalized = status.toLowerCase()
    if (
      normalized.includes('incident') ||
      normalized.includes('chargeback') ||
      normalized.includes('gateway failure')
    ) {
      return 'status-danger'
    }
    if (
      normalized.includes('degraded') ||
      normalized.includes('suspicious') ||
      normalized.includes('negative') ||
      normalized.includes('overdue') ||
      normalized.includes('escalated')
    ) {
      return 'status-warning'
    }
    if (
      normalized.includes('operational') ||
      normalized.includes('needs info') ||
      normalized.includes('pending') ||
      normalized.includes('high value')
    ) {
      return 'status-info'
    }
    return 'status-neutral'
  }

  const getRiskTone = (score) => {
    if (score >= 80) return 'risk-high'
    if (score >= 65) return 'risk-medium'
    return 'risk-low'
  }

  const openDrawer = (item, kind) => {
    setSelectedEvent({ ...item, kind })
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedEvent(null)
  }

  const handleActionClick = (action, items) => {
    if (!permissions[action.permission]) {
      addToast({
        type: 'error',
        title: 'Permission denied',
        message: `You do not have access to ${action.label}.`,
      })
      return
    }
    const rows = Array.isArray(items) ? items : [items]
    setActionModal({ action, rows })
    setActionReason('')
  }

  const handleConfirmAction = async () => {
    if (!actionModal) {
      return
    }
    const reason = normalizeOptional(actionReason)
    if (!reason) {
      return
    }
    setActionSubmitting(true)
    const { action, rows } = actionModal
    const targetRefs = rows
      .map((row) => row.walletId || row.loanId || row.userId || row.ref || row.id)
      .filter(Boolean)
    const primaryRef = targetRefs[0]
    try {
      await createAdminAuditLog({
        actorUserId: parseNumber(user?.id),
        serviceName: 'admin-console',
        eventType: action.auditEvent,
        eventRef: primaryRef,
        details: `Reason: ${reason}. Targets: ${targetRefs.join(', ')}`,
      })
      if (action.actionType && action.targetType) {
        await Promise.all(
          rows.map((row) =>
            createAdminAction({
              adminUserId: parseNumber(user?.id),
              actionType: action.actionType,
              targetType: action.targetType,
              targetRef: row.walletId || row.loanId || row.userId || row.ref || row.id,
              reason,
            }),
          ),
        )
      }
      addToast({
        type: 'success',
        title: 'Action queued',
        message: `${action.label} logged for ${primaryRef || 'target'}`,
      })
      loadSystemData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Action failed',
        message: resolveErrorMessage(error, 'Unable to record admin action.'),
      })
    } finally {
      setActionSubmitting(false)
      setActionModal(null)
      setActionReason('')
    }
  }

  const handleAlertAction = (alert) => {
    addToast({
      type: 'success',
      title: 'Action queued',
      message: `${alert.title} queued for review.`,
    })
  }

  const auditTrail = useMemo(() => {
    if (!selectedEvent) {
      return []
    }
    const ref = selectedEvent.ref || selectedEvent.id
    const related = auditLogs.filter((log) =>
      [log.eventRef, log.details].some((field) => field && field.toString().includes(ref)),
    )
    if (related.length > 0) {
      return related.slice(0, 4).map((log) => ({
        id: log.id,
        title: formatLabel(log.eventType),
        meta: `Performed by ${log.actorUserId || 'SYSTEM'} - ${formatDateTime(log.createdAt)}`,
        reason: log.details || 'No details provided.',
      }))
    }
    return [
      {
        id: 'audit-1',
        title: 'Flag created',
        meta: `Performed by ${user?.name || 'Admin'} - ${formatDateTime(selectedEvent.createdAt)}`,
        reason: selectedEvent.type || 'Auto-flagged by rules.',
      },
      {
        id: 'audit-2',
        title: 'Review queued',
        meta: `Performed by ${user?.name || 'Admin'} - ${formatDateTime(new Date())}`,
        reason: 'Pending review with reason required.',
      },
    ]
  }, [auditLogs, selectedEvent, user])

  if (user?.role !== ROLE.ADMIN) {
    return <Navigate to={getRoleHomePath(user?.role)} replace />
  }

  if (pageStatus === API_STATUS.loading) {
    return (
      <div className="dashboard admin-dashboard admin-console">
        <section className="admin-header admin-panel admin-skeleton-block">
          <div className="admin-skeleton-line wide" />
          <div className="admin-skeleton-line" />
          <div className="admin-skeleton-line" />
          <div className="admin-skeleton-line short" />
        </section>
        <div className="admin-kpi-grid">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={`kpi-skeleton-${index}`} className="admin-kpi-card admin-skeleton-card" />
          ))}
        </div>
        <div className="admin-focus-grid">
          <div className="panel admin-panel admin-skeleton-block" />
          <div className="panel admin-panel admin-skeleton-block" />
        </div>
        <div className="admin-charts-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`chart-skeleton-${index}`} className="panel admin-panel admin-skeleton-block" />
          ))}
        </div>
        <section className="panel admin-panel admin-skeleton-block" />
        <section className="panel admin-panel admin-skeleton-block" />
      </div>
    )
  }

  return (
    <div className="dashboard admin-dashboard admin-console flowdash">
      {isOverview ? (
        <section className="admin-header admin-panel flow-stagger" id="overview">
          <div className="admin-header-main">
            <p className="eyebrow">Admin console</p>
            <h1>Operations control room</h1>
            <p>
              Monitor loan health, payments integrity, and escalation queues from one
              command surface.
            </p>
            <div className="admin-header-actions">
              <Button variant="primary" onClick={handleRefreshAll} disabled={refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh data'}
              </Button>
              <Button variant="secondary" onClick={handleExportCsv}>
                Export report
              </Button>
            </div>
            <div className="admin-role-badges">
              {roleBadges.map((badge) => (
                <span
                  key={badge.label}
                  className={`role-badge ${badge.active ? 'active' : 'inactive'}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
          <div className="admin-header-side">
            <div className="admin-reference-card">
              <p className="eyebrow">Global search</p>
              <h3>Reference lookup</h3>
              <div className="admin-reference-input">
                <input
                  type="text"
                  value={referenceQuery}
                  onChange={(event) => setReferenceQuery(event.target.value)}
                  placeholder="Reference id, user_id, loan_id, txn_ref, webhook id"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleReferenceLookup()
                    }
                  }}
                />
                <button type="button" onClick={handleReferenceLookup}>
                  Lookup
                </button>
              </div>
              <p className="admin-hint">
                Search by user_id, phone, email, loan_id, wallet_account_id, txn_ref,
                gateway_ref, webhook id.
              </p>
              <p className="admin-shortcuts">
                Shortcuts: / search, Ctrl+K search, Shift+R refresh.
              </p>
            </div>
            <div className="admin-highlights">
              <div className="admin-highlight">
                <small>Actions logged</small>
                <strong>{overviewCounts?.actionCount ?? actions.length}</strong>
              </div>
              <div className="admin-highlight">
                <small>Audit events</small>
                <strong>{overviewCounts?.auditLogCount ?? auditLogs.length}</strong>
              </div>
              <div className="admin-highlight">
                <small>Active admins</small>
                <strong>{uniqueAdmins}</strong>
              </div>
              <div className="admin-highlight">
                <small>Latest audit</small>
                <strong>{formatDateShort(latestAuditAt)}</strong>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="admin-header admin-panel admin-header--compact flow-stagger">
          <div className="admin-header-main">
            <p className="eyebrow">{pageMeta.eyebrow}</p>
            <h1>{pageMeta.title}</h1>
            <p>{pageMeta.description}</p>
            <div className="admin-header-actions">
              <Button variant="primary" onClick={handleRefreshAll} disabled={refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh data'}
              </Button>
              <Button variant="secondary" onClick={handleExportCsv}>
                Export report
              </Button>
            </div>
          </div>
        </section>
      )}

      {pageKpiCards.length > 0 && (
        <div className="admin-kpi-grid flow-stagger">
          {pageKpiCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`admin-kpi-card ${activeMetric === card.id ? 'is-active' : ''}`}
              onClick={() => handleMetricClick(card)}
              aria-pressed={activeMetric === card.id}
            >
              <span className="admin-kpi-label">{card.label}</span>
              <strong className="admin-kpi-value">{card.value}</strong>
              {card.subValue && (
                <span className="admin-kpi-sub">{card.subValue}</span>
              )}
              <span className="admin-kpi-meta">{card.delta}</span>
              <span className="admin-kpi-cta">View list</span>
            </button>
          ))}
        </div>
      )}

      {(showPipelinePanel || showAlertsPanel) && (
        <section className="admin-focus-grid flow-stagger">
          {showPipelinePanel && (
            <article className="panel admin-panel admin-pipeline">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Collections pipeline</p>
                  <h3>Due today to 30+ overdue</h3>
                </div>
                <span className="admin-tag">Decision chart</span>
              </div>
              <div className="admin-pipeline-list">
                {COLLECTIONS_PIPELINE.map((stage) => (
                  <div key={stage.label} className="admin-pipeline-row">
                    <div className="admin-pipeline-meta">
                      <div>
                        <strong>{stage.label}</strong>
                        <span>
                          {COMPACT_FORMATTER.format(stage.count)} accounts
                        </span>
                      </div>
                      <span className="admin-pipeline-amount">
                        {formatCurrency(stage.amount)}
                      </span>
                    </div>
                    <div className="admin-pipeline-bar" title={`${stage.percent}% of due today`}>
                      <span style={{ width: `${stage.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

          {showAlertsPanel && (
            <article className="panel admin-panel admin-alerts">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Action required</p>
                  <h3>Risk and alerts</h3>
                </div>
                <span className="admin-tag">
                  {overviewCounts?.activeAlerts ?? alerts.length} live
                </span>
              </div>
              <div className="admin-alerts-list">
                {alerts.map((alert) => (
                  <div key={alert.id} className="admin-alert-row">
                    <div>
                      <span className={`alert-badge severity-${alert.severity}`}>
                        {alert.severity}
                      </span>
                      <p>{alert.title}</p>
                      <span className="admin-muted">{alert.detail}</span>
                    </div>
                    <div className="admin-alert-actions">
                      <span className="admin-muted">{alert.time}</span>
                      <button type="button" onClick={() => handleAlertAction(alert)}>
                        {alert.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>
      )}

      {showChartsGrid && (
        <section className="admin-charts-grid flow-stagger">
        <article className="panel admin-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Loan health trend</p>
              <h3>Overdue rate (7d)</h3>
            </div>
            <span className="admin-tag">Decision chart</span>
          </div>
          <div className="admin-sparkline">
            {LOAN_HEALTH_TREND.map((point) => (
              <div
                key={point.label}
                className="admin-sparkline-item"
                title={`${point.label}: ${point.value}%`}
              >
                <span style={{ height: `${(point.value / 4) * 100}%` }} />
                <small>{point.label}</small>
              </div>
            ))}
          </div>
          <p className="admin-muted">
            Last value: {LOAN_HEALTH_TREND[LOAN_HEALTH_TREND.length - 1]?.value}%
          </p>
        </article>

        <article className="panel admin-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Transaction failure rate</p>
              <h3>By gateway</h3>
            </div>
            <span className="admin-tag">Decision chart</span>
          </div>
          <div className="admin-gateway-list">
            {GATEWAY_FAILURES.map((gateway) => (
              <div key={gateway.label} className="admin-gateway-row">
                <div>
                  <strong>{gateway.label}</strong>
                  <span className="admin-muted">
                    {COMPACT_FORMATTER.format(gateway.volume)} txns
                  </span>
                </div>
                <div className="admin-gateway-bar" title={`${gateway.rate}% failure rate`}>
                  <span style={{ width: `${Math.min(gateway.rate * 20, 100)}%` }} />
                </div>
                <span className="admin-gateway-rate">{gateway.rate}%</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel admin-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">User funnel</p>
              <h3>Registered to funded</h3>
            </div>
            <span className="admin-tag">Decision chart</span>
          </div>
          <div className="admin-funnel">
            {USER_FUNNEL.map((stage) => (
              <div
                key={stage.label}
                className="admin-funnel-row"
                title={`${stage.label}: ${stage.count}`}
              >
                <div className="admin-funnel-bar" style={{ width: `${stage.percent}%` }}>
                  <span>{stage.label}</span>
                </div>
                <span className="admin-funnel-count">{COMPACT_FORMATTER.format(stage.count)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
      )}

      {showRiskTable && (
        <section ref={riskTableRef} className="panel admin-panel admin-table-panel flow-stagger">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Recent high-risk events</p>
            <h3>Risk console</h3>
          </div>
          <span className="admin-tag">{filteredRiskEvents.length} events</span>
        </div>

        <div className="admin-table-controls">
          <label>
            Status
            <select name="status" value={riskFilters.status} onChange={handleRiskFilterChange}>
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Gateway
            <select name="gateway" value={riskFilters.gateway} onChange={handleRiskFilterChange}>
              <option value="">All gateways</option>
              {gatewayOptions.map((gateway) => (
                <option key={gateway} value={gateway}>
                  {gateway}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date range
            <div className="admin-date-range">
              <input
                type="date"
                name="dateFrom"
                value={riskFilters.dateFrom}
                onChange={handleRiskFilterChange}
              />
              <input
                type="date"
                name="dateTo"
                value={riskFilters.dateTo}
                onChange={handleRiskFilterChange}
              />
            </div>
          </label>
          <label>
            Risk score &gt;=
            <input
              type="number"
              name="riskScore"
              min="0"
              max="100"
              value={riskFilters.riskScore}
              onChange={handleRiskFilterChange}
              placeholder="70"
            />
          </label>
          <label>
            Search
            <input
              type="text"
              name="query"
              value={riskFilters.query}
              onChange={handleRiskFilterChange}
              placeholder="User, loan, reference"
            />
          </label>
        </div>

        <div className="admin-table-actions">
          <div className="admin-saved-views">
            <label>
              Saved views
              <select value={savedView} onChange={handleSavedViewChange}>
                {SAVED_VIEWS.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="admin-muted">
              {selectedRiskIds.length} selected
            </span>
          </div>
          <div className="admin-bulk-actions">
            <button
              type="button"
              className="admin-action-btn danger"
              onClick={() =>
                handleActionClick(
                  RISK_ACTIONS[0],
                  pagedRiskEvents.filter((event) => selectedRiskIds.includes(event.id)),
                )
              }
              disabled={selectedRiskIds.length === 0 || !permissions.canFreezeWallet}
            >
              Freeze wallets
            </button>
            <button
              type="button"
              className="admin-action-btn"
              onClick={() =>
                handleActionClick(
                  RISK_ACTIONS[1],
                  pagedRiskEvents.filter((event) => selectedRiskIds.includes(event.id)),
                )
              }
              disabled={selectedRiskIds.length === 0 || !permissions.canFlagUser}
            >
              Flag users
            </button>
            <button type="button" className="admin-action-btn" onClick={handleExportCsv}>
              Export CSV
            </button>
            <button type="button" className="admin-action-btn" onClick={handleClearRiskFilters}>
              Clear filters
            </button>
          </div>
        </div>

        <div className="table-wrap admin-table-wrap">
          <table className="admin-table admin-table--sticky">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                    aria-label="Select all"
                  />
                </th>
                <th>Event</th>
                <th>User</th>
                <th>
                  <button type="button" onClick={() => handleSort('amount')}>
                    Amount {getSortIndicator('amount')}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => handleSort('riskScore')}>
                    Risk {getSortIndicator('riskScore')}
                  </button>
                </th>
                <th>Status</th>
                <th>Gateway</th>
                <th>
                  <button type="button" onClick={() => handleSort('createdAt')}>
                    Updated {getSortIndicator('createdAt')}
                  </button>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRiskEvents.length === 0 && (
                <tr>
                  <td colSpan={9} className="admin-muted">
                    No high-risk events match these filters. Try clearing filters or widening the date range.
                  </td>
                </tr>
              )}
              {pagedRiskEvents.map((event) => (
                <tr key={event.id} onClick={() => openDrawer(event, 'risk')}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRiskIds.includes(event.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleSelectOne(event.id)
                      }}
                      aria-label={`Select ${event.id}`}
                    />
                  </td>
                  <td>
                    <div className="admin-cell">
                      <strong>{event.type}</strong>
                      <span className="admin-code">{event.ref}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-cell">
                      <strong>{event.userName}</strong>
                      <span className="admin-code">{event.userId}</span>
                    </div>
                  </td>
                  <td>{formatCurrency(event.amount)}</td>
                  <td>
                    <span className={`risk-score ${getRiskTone(event.riskScore)}`}>
                      {event.riskScore}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${getStatusTone(event.status)}`}>
                      {event.status}
                    </span>
                  </td>
                  <td>{event.gateway}</td>
                  <td className="admin-muted">{formatDateTime(event.createdAt)}</td>
                  <td>
                    <div className="admin-row-actions">
                      {RISK_ACTIONS.map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          className={`admin-action-btn ${
                            action.key === 'freeze-wallet' ? 'danger' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleActionClick(action, event)
                          }}
                          disabled={!permissions[action.permission]}
                          title={
                            permissions[action.permission]
                              ? action.label
                              : 'Not permitted for your role'
                          }
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <button
            type="button"
            onClick={() => setRiskPage((prev) => Math.max(1, prev - 1))}
            disabled={riskPage === 1}
          >
            Prev
          </button>
          <div className="admin-page-list">
            {Array.from({ length: totalRiskPages }).map((_, index) => (
              <button
                key={`page-${index + 1}`}
                type="button"
                className={riskPage === index + 1 ? 'active' : ''}
                onClick={() => setRiskPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRiskPage((prev) => Math.min(totalRiskPages, prev + 1))}
            disabled={riskPage === totalRiskPages}
          >
            Next
          </button>
        </div>
        </section>
      )}

      {showApprovalsTable && (
        <section className="panel admin-panel admin-table-panel flow-stagger">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Pending approvals</p>
            <h3>KYC and loan approvals</h3>
          </div>
          <span className="admin-tag">{filteredApprovals.length} pending</span>
        </div>
        <div className="admin-table-controls">
          <label>
            Type
            <select
              name="type"
              value={approvalTypeLock || approvalFilters.type}
              onChange={handleApprovalFilterChange}
              disabled={Boolean(approvalTypeLock)}
            >
              <option value="">All</option>
              <option value="KYC">KYC</option>
              <option value="Loan">Loan</option>
            </select>
          </label>
          <label>
            Status
            <select
              name="status"
              value={approvalFilters.status}
              onChange={handleApprovalFilterChange}
            >
              <option value="">All</option>
              <option value="Pending review">Pending review</option>
              <option value="Escalated">Escalated</option>
              <option value="Needs info">Needs info</option>
            </select>
          </label>
          <label>
            Risk score &gt;=
            <input
              type="number"
              name="riskScore"
              min="0"
              max="100"
              value={approvalFilters.riskScore}
              onChange={handleApprovalFilterChange}
              placeholder="60"
            />
          </label>
        </div>
        <div className="table-wrap admin-table-wrap">
          <table className="admin-table admin-table--sticky">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>User</th>
                <th>Queue</th>
                <th>Risk</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Requested</th>
              </tr>
            </thead>
            <tbody>
              {filteredApprovals.length === 0 && (
                <tr>
                  <td colSpan={8} className="admin-muted">
                    No pending approvals in this view. Check other queues or adjust filters.
                  </td>
                </tr>
              )}
              {filteredApprovals.map((item) => (
                <tr key={item.id} onClick={() => openDrawer(item, 'approval')}>
                  <td className="admin-code">{item.id}</td>
                  <td>{item.type}</td>
                  <td>
                    <div className="admin-cell">
                      <strong>{item.userName}</strong>
                      <span className="admin-code">{item.userId}</span>
                    </div>
                  </td>
                  <td>{item.queue}</td>
                  <td>
                    <span className={`risk-score ${getRiskTone(item.riskScore)}`}>
                      {item.riskScore}
                    </span>
                  </td>
                  <td>{item.amount ? formatCurrency(item.amount) : '--'}</td>
                  <td>
                    <span className={`status-pill ${getStatusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="admin-muted">{formatDateTime(item.requestedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </section>
      )}

      {showSystemGrid && (
        <section className="admin-system-grid flow-stagger">
          {showSystemServices && (
            <article className="panel admin-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Services</p>
                  <h3>System health</h3>
                </div>
                <span className="admin-tag">Live</span>
              </div>
              <div className="admin-service-list">
                {SERVICE_HEALTH.map((service) => (
                  <div key={service.name} className="admin-service-row">
                    <div>
                      <strong>{service.name}</strong>
                      <span className="admin-muted">Latency {service.latency}</span>
                    </div>
                    <span className={`status-pill ${getStatusTone(service.status)}`}>
                      {service.status}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          )}

          {showSystemConfig && (
            <article className="panel admin-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Config</p>
                  <h3>Recent changes</h3>
                </div>
                <span className="admin-tag">Audit</span>
              </div>
              <div className="admin-config-list">
                {CONFIG_CHANGES.map((change) => (
                  <div key={change.id} className="admin-config-row">
                    <strong>{change.title}</strong>
                    <span className="admin-muted">
                      {change.admin} - {change.time}
                    </span>
                    <p className="admin-muted">Reason: {change.reason}</p>
                  </div>
                ))}
              </div>
            </article>
          )}

          {showSystemAudit && (
            <article className="panel admin-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Audit trail</p>
                  <h3>Admin actions and logs</h3>
                </div>
                <span className="admin-tag">
                  {(overviewCounts?.actionCount ?? actions.length) +
                    (overviewCounts?.auditLogCount ?? auditLogs.length)}{' '}
                  events
                </span>
              </div>

              {actionsStatus === API_STATUS.loading && (
                <div className="admin-skeleton-list">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={`action-skel-${index}`} className="admin-skeleton-line" />
                  ))}
                </div>
              )}
              {actionsStatus === API_STATUS.error && (
                <p className="admin-muted">{actionsError || 'Unable to load admin actions.'}</p>
              )}
              {actionsStatus === API_STATUS.success && actions.length === 0 && (
                <p className="admin-muted">No admin actions logged yet.</p>
              )}
              {actionsStatus === API_STATUS.success && actions.length > 0 && (
                <div className="admin-audit-block">
                  <h4>Admin actions</h4>
                  {sortedActions.slice(0, 4).map((action) => (
                    <div key={action.id} className="admin-audit-row">
                      <div>
                        <strong>{formatLabel(action.actionType)}</strong>
                        <span className="admin-muted">
                          Performed by {action.adminUserId || 'Unknown'} -{' '}
                          {formatDateTime(action.createdAt)}
                        </span>
                      </div>
                      <p className="admin-muted">Reason: {action.reason || 'Not provided'}</p>
                    </div>
                  ))}
                </div>
              )}

              {auditStatus === API_STATUS.loading && (
                <div className="admin-skeleton-list">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={`audit-skel-${index}`} className="admin-skeleton-line" />
                  ))}
                </div>
              )}
              {auditStatus === API_STATUS.error && (
                <p className="admin-muted">{auditError || 'Unable to load audit logs.'}</p>
              )}
              {auditStatus === API_STATUS.success && auditLogs.length === 0 && (
                <p className="admin-muted">No audit logs recorded yet.</p>
              )}
              {auditStatus === API_STATUS.success && auditLogs.length > 0 && (
                <div className="admin-audit-block">
                  <h4>Service audit logs</h4>
                  {sortedAuditLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="admin-audit-row">
                      <div>
                        <strong>{formatLabel(log.eventType)}</strong>
                        <span className="admin-muted">
                          {formatLabel(log.serviceName)} - {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                      <p className="admin-muted">Actor: {log.actorUserId || 'SYSTEM'}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          )}
        </section>
      )}

      {drawerOpen && selectedEvent && (
        <div className="admin-drawer-overlay" onClick={closeDrawer}>
          <aside className="admin-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="admin-drawer-header">
              <div>
                <p className="eyebrow">Details</p>
                <h3>{selectedEvent.type || selectedEvent.id}</h3>
              </div>
              <button type="button" onClick={closeDrawer}>
                Close
              </button>
            </div>
            <div className="admin-drawer-meta">
              <span className={`status-pill ${getStatusTone(selectedEvent.status || 'neutral')}`}>
                {selectedEvent.status || 'In review'}
              </span>
              <span className={`risk-score ${getRiskTone(selectedEvent.riskScore || 0)}`}>
                Risk {selectedEvent.riskScore || '--'}
              </span>
            </div>
            <div className="admin-drawer-grid">
              <div>
                <span className="admin-muted">Reference</span>
                <strong>{selectedEvent.ref || selectedEvent.id}</strong>
              </div>
              <div>
                <span className="admin-muted">User</span>
                <strong>{selectedEvent.userId || selectedEvent.userName || 'N/A'}</strong>
              </div>
              <div>
                <span className="admin-muted">Loan</span>
                <strong>{selectedEvent.loanId || 'N/A'}</strong>
              </div>
              <div>
                <span className="admin-muted">Wallet</span>
                <strong>{selectedEvent.walletId || 'N/A'}</strong>
              </div>
              <div>
                <span className="admin-muted">Gateway</span>
                <strong>{selectedEvent.gateway || 'N/A'}</strong>
              </div>
              <div>
                <span className="admin-muted">Amount</span>
                <strong>
                  {selectedEvent.amount !== null && selectedEvent.amount !== undefined
                    ? formatCurrency(selectedEvent.amount)
                    : '--'}
                </strong>
              </div>
              <div>
                <span className="admin-muted">Channel</span>
                <strong>{selectedEvent.channel || selectedEvent.queue || 'N/A'}</strong>
              </div>
              <div>
                <span className="admin-muted">Created</span>
                <strong>
                  {formatDateTime(selectedEvent.createdAt || selectedEvent.requestedAt)}
                </strong>
              </div>
            </div>
            <div className="admin-drawer-actions">
              {RISK_ACTIONS.map((action) => (
                <button
                  key={`drawer-${action.key}`}
                  type="button"
                  className={`admin-action-btn ${
                    action.key === 'freeze-wallet' ? 'danger' : ''
                  }`}
                  onClick={() => handleActionClick(action, selectedEvent)}
                  disabled={!permissions[action.permission]}
                >
                  {action.label}
                </button>
              ))}
            </div>
            <div className="admin-drawer-audit">
              <h4>Audit history</h4>
              {auditTrail.map((entry) => (
                <div key={entry.id} className="admin-audit-row">
                  <strong>{entry.title}</strong>
                  <span className="admin-muted">{entry.meta}</span>
                  <p className="admin-muted">Reason: {entry.reason}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {actionModal && (
        <div className="modal-backdrop" onClick={() => setActionModal(null)}>
          <div className="modal admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm {actionModal.action.label}</h3>
              <button type="button" onClick={() => setActionModal(null)}>
                Close
              </button>
            </div>
            <p>
              This action will be logged to the admin audit trail and requires a reason.
            </p>
            <label className="admin-modal-label">
              Reason
              <textarea
                rows="4"
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                placeholder="Provide a short reason for this action"
              />
            </label>
            <div className="admin-modal-actions">
              <Button variant="secondary" onClick={() => setActionModal(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmAction}
                disabled={!actionReason.trim() || actionSubmitting}
              >
                {actionSubmitting ? 'Saving...' : 'Confirm action'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {toasts.length > 0 && (
        <div className="admin-toast-stack" role="status" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`admin-toast ${toast.type}`}>
              <strong>{toast.title}</strong>
              <p>{toast.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
