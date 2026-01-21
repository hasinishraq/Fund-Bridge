import { useEffect, useMemo, useState } from 'react'
import {
  createAdminAction,
  createAdminAuditLog,
  fetchAdminActions,
  fetchAdminAuditLogs,
} from '../../api/adminApi'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { API_STATUS, ROLE } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

const ACTION_TYPES = ['FREEZE_WALLET', 'BLOCK_USER', 'LOAN_OVERRIDE']
const TARGET_TYPES = ['USER', 'WALLET_ACCOUNT', 'LOAN']
const SERVICE_SUGGESTIONS = [
  'auth-service',
  'user-service',
  'wallet-service',
  'loan-management-service',
  'notification-service',
]

const DEFAULT_ACTION_FILTERS = {
  adminUserId: '',
  actionType: '',
  targetType: '',
  targetRef: '',
}

const DEFAULT_AUDIT_FILTERS = {
  actorUserId: '',
  serviceName: '',
  eventType: '',
  eventRef: '',
}

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

const truncate = (value, limit = 72) => {
  if (!value) {
    return ''
  }
  if (value.length <= limit) {
    return value
  }
  return `${value.slice(0, limit - 3)}...`
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

const buildActionParams = (filters) => {
  const params = {}
  const adminUserId = parseNumber(filters.adminUserId)
  if (adminUserId !== undefined) {
    params.adminUserId = adminUserId
  }
  const actionType = normalizeOptional(filters.actionType)
  if (actionType) {
    params.actionType = actionType
  }
  const targetType = normalizeOptional(filters.targetType)
  if (targetType) {
    params.targetType = targetType
  }
  const targetRef = normalizeOptional(filters.targetRef)
  if (targetRef) {
    params.targetRef = targetRef
  }
  return params
}

const buildAuditParams = (filters) => {
  const params = {}
  const actorUserId = parseNumber(filters.actorUserId)
  if (actorUserId !== undefined) {
    params.actorUserId = actorUserId
  }
  const serviceName = normalizeOptional(filters.serviceName)
  if (serviceName) {
    params.serviceName = serviceName
  }
  const eventType = normalizeOptional(filters.eventType)
  if (eventType) {
    params.eventType = eventType
  }
  const eventRef = normalizeOptional(filters.eventRef)
  if (eventRef) {
    params.eventRef = eventRef
  }
  return params
}

const resolveErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback

const AdminDashboard = () => {
  const { user } = useAuth()
  const [pageStatus, setPageStatus] = useState(API_STATUS.loading)
  const [actionsStatus, setActionsStatus] = useState(API_STATUS.idle)
  const [auditStatus, setAuditStatus] = useState(API_STATUS.idle)
  const [actionsError, setActionsError] = useState('')
  const [auditError, setAuditError] = useState('')
  const [actions, setActions] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)
  const [auditMessage, setAuditMessage] = useState(null)
  const [actionSubmitting, setActionSubmitting] = useState(false)
  const [auditSubmitting, setAuditSubmitting] = useState(false)
  const [actionFilters, setActionFilters] = useState({ ...DEFAULT_ACTION_FILTERS })
  const [auditFilters, setAuditFilters] = useState({ ...DEFAULT_AUDIT_FILTERS })
  const [actionForm, setActionForm] = useState(() => ({
    adminUserId: user?.id ? String(user.id) : '',
    actionType: ACTION_TYPES[0],
    targetType: TARGET_TYPES[0],
    targetRef: '',
    reason: '',
  }))
  const [auditForm, setAuditForm] = useState(() => ({
    actorUserId: user?.id ? String(user.id) : '',
    serviceName: '',
    eventType: '',
    eventRef: '',
    details: '',
  }))

  useEffect(() => {
    if (user?.id) {
      setActionForm((prev) => ({
        ...prev,
        adminUserId: prev.adminUserId || String(user.id),
      }))
      setAuditForm((prev) => ({
        ...prev,
        actorUserId: prev.actorUserId || String(user.id),
      }))
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      return
    }
    if (user?.role !== ROLE.ADMIN) {
      setPageStatus(API_STATUS.success)
      return
    }
    const loadInitial = async () => {
      setPageStatus(API_STATUS.loading)
      setActionsStatus(API_STATUS.loading)
      setAuditStatus(API_STATUS.loading)
      setActionsError('')
      setAuditError('')
      try {
        const [actionsResponse, auditResponse] = await Promise.all([
          fetchAdminActions(buildActionParams(DEFAULT_ACTION_FILTERS)),
          fetchAdminAuditLogs(buildAuditParams(DEFAULT_AUDIT_FILTERS)),
        ])
        setActions(actionsResponse || [])
        setAuditLogs(auditResponse || [])
        setActionsStatus(API_STATUS.success)
        setAuditStatus(API_STATUS.success)
        setPageStatus(API_STATUS.success)
      } catch (error) {
        console.error(error)
        setActionsStatus(API_STATUS.error)
        setAuditStatus(API_STATUS.error)
        setActionsError(resolveErrorMessage(error, 'Unable to load admin actions'))
        setAuditError(resolveErrorMessage(error, 'Unable to load audit logs'))
        setPageStatus(API_STATUS.error)
      }
    }
    loadInitial()
  }, [user])

  const actionMix = useMemo(() => {
    const totals = ACTION_TYPES.reduce((acc, type) => {
      acc[type] = 0
      return acc
    }, {})
    actions.forEach((action) => {
      if (action?.actionType && totals[action.actionType] !== undefined) {
        totals[action.actionType] += 1
      }
    })
    const totalActions = Math.max(actions.length, 1)
    return ACTION_TYPES.map((type) => ({
      type,
      count: totals[type],
      percent: Math.round((totals[type] / totalActions) * 100),
    }))
  }, [actions])

  const uniqueAdmins = useMemo(() => {
    const ids = new Set(actions.map((action) => action?.adminUserId).filter(Boolean))
    return ids.size
  }, [actions])

  const latestActionAt = actions[0]?.createdAt
  const latestAuditAt = auditLogs[0]?.createdAt

  const loadActions = async (filters = actionFilters) => {
    setActionsStatus(API_STATUS.loading)
    setActionsError('')
    try {
      const data = await fetchAdminActions(buildActionParams(filters))
      setActions(data || [])
      setActionsStatus(API_STATUS.success)
    } catch (error) {
      console.error(error)
      setActionsError(resolveErrorMessage(error, 'Unable to load admin actions'))
      setActionsStatus(API_STATUS.error)
    }
  }

  const loadAuditLogs = async (filters = auditFilters) => {
    setAuditStatus(API_STATUS.loading)
    setAuditError('')
    try {
      const data = await fetchAdminAuditLogs(buildAuditParams(filters))
      setAuditLogs(data || [])
      setAuditStatus(API_STATUS.success)
    } catch (error) {
      console.error(error)
      setAuditError(resolveErrorMessage(error, 'Unable to load audit logs'))
      setAuditStatus(API_STATUS.error)
    }
  }

  const handleRefreshAll = async () => {
    setRefreshing(true)
    await Promise.all([loadActions(actionFilters), loadAuditLogs(auditFilters)])
    setRefreshing(false)
  }

  const handleClearFilters = async () => {
    const clearedActions = { ...DEFAULT_ACTION_FILTERS }
    const clearedAudits = { ...DEFAULT_AUDIT_FILTERS }
    setActionFilters(clearedActions)
    setAuditFilters(clearedAudits)
    await Promise.all([loadActions(clearedActions), loadAuditLogs(clearedAudits)])
  }

  const handleActionFilterChange = (event) => {
    const { name, value } = event.target
    setActionFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleAuditFilterChange = (event) => {
    const { name, value } = event.target
    setAuditFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleActionFilterSubmit = async (event) => {
    event.preventDefault()
    await loadActions(actionFilters)
  }

  const handleAuditFilterSubmit = async (event) => {
    event.preventDefault()
    await loadAuditLogs(auditFilters)
  }

  const resetActionFilters = async () => {
    const cleared = { ...DEFAULT_ACTION_FILTERS }
    setActionFilters(cleared)
    await loadActions(cleared)
  }

  const resetAuditFilters = async () => {
    const cleared = { ...DEFAULT_AUDIT_FILTERS }
    setAuditFilters(cleared)
    await loadAuditLogs(cleared)
  }

  const handleActionFormChange = (event) => {
    const { name, value } = event.target
    setActionForm((prev) => ({ ...prev, [name]: value }))
    setActionMessage(null)
  }

  const handleAuditFormChange = (event) => {
    const { name, value } = event.target
    setAuditForm((prev) => ({ ...prev, [name]: value }))
    setAuditMessage(null)
  }

  const handleCreateAction = async (event) => {
    event.preventDefault()
    setActionMessage(null)
    const adminUserId = parseNumber(actionForm.adminUserId)
    if (!adminUserId || !normalizeOptional(actionForm.targetRef)) {
      setActionMessage({
        type: 'error',
        text: 'Admin user id and target reference are required.',
      })
      return
    }
    setActionSubmitting(true)
    try {
      await createAdminAction({
        adminUserId,
        actionType: actionForm.actionType,
        targetType: actionForm.targetType,
        targetRef: actionForm.targetRef.trim(),
        reason: normalizeOptional(actionForm.reason),
      })
      setActionMessage({ type: 'success', text: 'Action recorded successfully.' })
      setActionForm((prev) => ({
        ...prev,
        targetRef: '',
        reason: '',
      }))
      await loadActions(actionFilters)
    } catch (error) {
      console.error(error)
      setActionMessage({
        type: 'error',
        text: resolveErrorMessage(error, 'Unable to record action.'),
      })
    } finally {
      setActionSubmitting(false)
    }
  }

  const handleCreateAuditLog = async (event) => {
    event.preventDefault()
    setAuditMessage(null)
    const serviceName = normalizeOptional(auditForm.serviceName)
    const eventType = normalizeOptional(auditForm.eventType)
    if (!serviceName || !eventType) {
      setAuditMessage({
        type: 'error',
        text: 'Service name and event type are required.',
      })
      return
    }
    setAuditSubmitting(true)
    try {
      await createAdminAuditLog({
        actorUserId: parseNumber(auditForm.actorUserId),
        serviceName,
        eventType,
        eventRef: normalizeOptional(auditForm.eventRef),
        details: normalizeOptional(auditForm.details),
      })
      setAuditMessage({ type: 'success', text: 'Audit event recorded.' })
      setAuditForm((prev) => ({
        ...prev,
        serviceName: '',
        eventType: '',
        eventRef: '',
        details: '',
      }))
      await loadAuditLogs(auditFilters)
    } catch (error) {
      console.error(error)
      setAuditMessage({
        type: 'error',
        text: resolveErrorMessage(error, 'Unable to record audit event.'),
      })
    } finally {
      setAuditSubmitting(false)
    }
  }

  if (user?.role !== ROLE.ADMIN) {
    return (
      <section className="card error-card">
        <p>Only admins can view this dashboard.</p>
      </section>
    )
  }

  if (pageStatus === API_STATUS.loading) {
    return (
      <div className="page-center">
        <Loader />
      </div>
    )
  }

  if (pageStatus === API_STATUS.error) {
    return (
      <section className="card error-card">
        <p>Unable to load admin dashboard.</p>
      </section>
    )
  }

  return (
    <div className="dashboard admin-dashboard flowdash">
      <section className="dashboard-hero admin-hero flow-stagger">
        <div className="hero-copy">
          <p className="eyebrow">Admin console</p>
          <h1>Operations control room</h1>
          <p>
            Track admin interventions, wallet freezes, and audit events across
            core services.
          </p>
          <div className="hero-actions">
            <Button variant="primary" onClick={handleRefreshAll} disabled={refreshing}>
              {refreshing ? 'Refreshing...' : 'Refresh data'}
            </Button>
            <Button variant="secondary" onClick={handleClearFilters}>
              Clear filters
            </Button>
          </div>
        </div>
        <div className="hero-highlights admin-highlights">
          <div className="hero-highlight">
            <small>Actions logged</small>
            <strong>{actions.length}</strong>
          </div>
          <div className="hero-highlight">
            <small>Audit events</small>
            <strong>{auditLogs.length}</strong>
          </div>
          <div className="hero-highlight">
            <small>Active admins</small>
            <strong>{uniqueAdmins}</strong>
          </div>
          <div className="hero-highlight">
            <small>Last action</small>
            <strong>{formatDateShort(latestActionAt)}</strong>
          </div>
        </div>
        <div className="admin-mix">
          <p className="eyebrow">Action mix</p>
          <div className="admin-mix-list">
            {actionMix.map((entry) => (
              <div key={entry.type} className="admin-mix-row">
                <div className="admin-mix-meta">
                  <span>{formatLabel(entry.type)}</span>
                  <span>{entry.count}</span>
                </div>
                <div className="admin-mix-bar">
                  <span style={{ width: `${entry.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="admin-mix-footnote">
            Latest audit: {formatDateShort(latestAuditAt)}
          </p>
        </div>
      </section>

      <div className="stats-grid admin-stats flow-stagger">
        <div className="card stat-card">
          <p>Total actions</p>
          <h3>{actions.length}</h3>
        </div>
        <div className="card stat-card">
          <p>Audit log volume</p>
          <h3>{auditLogs.length}</h3>
        </div>
        <div className="card stat-card">
          <p>Wallet freezes</p>
          <h3>
            {actions.filter((action) => action?.actionType === 'FREEZE_WALLET').length}
          </h3>
        </div>
        <div className="card stat-card">
          <p>Block requests</p>
          <h3>
            {actions.filter((action) => action?.actionType === 'BLOCK_USER').length}
          </h3>
        </div>
      </div>

      <section className="dashboard-columns flow-stagger">
        <article className="panel admin-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Admin actions</p>
              <h3>Command desk</h3>
            </div>
            <span className="admin-tag admin-tag-action">Record action</span>
          </div>
          {actionMessage && (
            <div className={`admin-message ${actionMessage.type}`}>
              {actionMessage.text}
            </div>
          )}
          <form className="grid-form admin-form" onSubmit={handleCreateAction}>
            <label>
              Admin user id
              <input
                type="number"
                name="adminUserId"
                value={actionForm.adminUserId}
                onChange={handleActionFormChange}
                placeholder="1"
              />
            </label>
            <label>
              Action type
              <select
                name="actionType"
                value={actionForm.actionType}
                onChange={handleActionFormChange}
              >
                {ACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Target type
              <select
                name="targetType"
                value={actionForm.targetType}
                onChange={handleActionFormChange}
              >
                {TARGET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Target reference
              <input
                type="text"
                name="targetRef"
                value={actionForm.targetRef}
                onChange={handleActionFormChange}
                placeholder="wallet_0001"
              />
            </label>
            <label className="full-width">
              Reason
              <textarea
                name="reason"
                rows="3"
                value={actionForm.reason}
                onChange={handleActionFormChange}
                placeholder="Add a short reason for this action"
              />
            </label>
            <div className="form-actions full-width">
              <Button type="submit" disabled={actionSubmitting}>
                {actionSubmitting ? 'Saving...' : 'Record action'}
              </Button>
            </div>
          </form>
        </article>

        <article className="panel admin-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Audit events</p>
              <h3>Event logger</h3>
            </div>
            <span className="admin-tag admin-tag-service">Record audit</span>
          </div>
          {auditMessage && (
            <div className={`admin-message ${auditMessage.type}`}>
              {auditMessage.text}
            </div>
          )}
          <form className="grid-form admin-form" onSubmit={handleCreateAuditLog}>
            <label>
              Actor user id
              <input
                type="number"
                name="actorUserId"
                value={auditForm.actorUserId}
                onChange={handleAuditFormChange}
                placeholder="Optional"
              />
            </label>
            <label>
              Service name
              <input
                type="text"
                name="serviceName"
                value={auditForm.serviceName}
                onChange={handleAuditFormChange}
                placeholder="wallet-service"
                list="admin-service-names"
              />
            </label>
            <label>
              Event type
              <input
                type="text"
                name="eventType"
                value={auditForm.eventType}
                onChange={handleAuditFormChange}
                placeholder="WALLET_FREEZE"
              />
            </label>
            <label>
              Event reference
              <input
                type="text"
                name="eventRef"
                value={auditForm.eventRef}
                onChange={handleAuditFormChange}
                placeholder="wallet_0001"
              />
            </label>
            <label className="full-width">
              Details
              <textarea
                name="details"
                rows="3"
                value={auditForm.details}
                onChange={handleAuditFormChange}
                placeholder="Additional context or payload"
              />
            </label>
            <div className="form-actions full-width">
              <Button type="submit" disabled={auditSubmitting}>
                {auditSubmitting ? 'Saving...' : 'Record audit'}
              </Button>
            </div>
          </form>
          <datalist id="admin-service-names">
            {SERVICE_SUGGESTIONS.map((service) => (
              <option key={service} value={service} />
            ))}
          </datalist>
        </article>
      </section>

      <section className="panel admin-panel flow-stagger">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Action history</p>
            <h3>Recent admin actions</h3>
          </div>
          <span className="admin-tag admin-tag-target">{actions.length} records</span>
        </div>
        <form className="grid-form admin-form" onSubmit={handleActionFilterSubmit}>
          <label>
            Admin user id
            <input
              type="number"
              name="adminUserId"
              value={actionFilters.adminUserId}
              onChange={handleActionFilterChange}
              placeholder="All"
            />
          </label>
          <label>
            Action type
            <select
              name="actionType"
              value={actionFilters.actionType}
              onChange={handleActionFilterChange}
            >
              <option value="">All action types</option>
              {ACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Target type
            <select
              name="targetType"
              value={actionFilters.targetType}
              onChange={handleActionFilterChange}
            >
              <option value="">All target types</option>
              {TARGET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Target reference
            <input
              type="text"
              name="targetRef"
              value={actionFilters.targetRef}
              onChange={handleActionFilterChange}
              placeholder="Search ref"
            />
          </label>
          <div className="form-actions full-width admin-filter-actions">
            <Button
              variant="secondary"
              type="submit"
              disabled={actionsStatus === API_STATUS.loading}
            >
              Apply filters
            </Button>
            <Button variant="ghost" type="button" onClick={resetActionFilters}>
              Reset
            </Button>
          </div>
        </form>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Reason</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {actionsStatus === API_STATUS.loading && (
                <tr>
                  <td colSpan={6}>
                    <div className="table-loader">
                      <Loader />
                    </div>
                  </td>
                </tr>
              )}
              {actionsStatus === API_STATUS.error && (
                <tr>
                  <td colSpan={6} className="admin-muted">
                    {actionsError || 'Unable to load actions.'}
                  </td>
                </tr>
              )}
              {actionsStatus === API_STATUS.success && actions.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-muted">
                    No admin actions found.
                  </td>
                </tr>
              )}
              {actionsStatus === API_STATUS.success &&
                actions.map((action) => (
                  <tr key={action.id}>
                    <td className="admin-code">#{action.id}</td>
                    <td className="admin-code">{action.adminUserId}</td>
                    <td>
                      <span className="admin-tag admin-tag-action">
                        {formatLabel(action.actionType)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-cell">
                        <span className="admin-tag admin-tag-target">
                          {formatLabel(action.targetType)}
                        </span>
                        <span className="admin-code">{action.targetRef}</span>
                      </div>
                    </td>
                    <td title={action.reason || ''}>
                      {truncate(action.reason || 'No reason provided')}
                    </td>
                    <td className="admin-muted">{formatDateTime(action.createdAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel admin-panel flow-stagger">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Audit trail</p>
            <h3>Service audit logs</h3>
          </div>
          <span className="admin-tag admin-tag-event">{auditLogs.length} events</span>
        </div>
        <form className="grid-form admin-form" onSubmit={handleAuditFilterSubmit}>
          <label>
            Actor user id
            <input
              type="number"
              name="actorUserId"
              value={auditFilters.actorUserId}
              onChange={handleAuditFilterChange}
              placeholder="All"
            />
          </label>
          <label>
            Service name
            <input
              type="text"
              name="serviceName"
              value={auditFilters.serviceName}
              onChange={handleAuditFilterChange}
              placeholder="wallet-service"
            />
          </label>
          <label>
            Event type
            <input
              type="text"
              name="eventType"
              value={auditFilters.eventType}
              onChange={handleAuditFilterChange}
              placeholder="EVENT_TYPE"
            />
          </label>
          <label>
            Event reference
            <input
              type="text"
              name="eventRef"
              value={auditFilters.eventRef}
              onChange={handleAuditFilterChange}
              placeholder="Search ref"
            />
          </label>
          <div className="form-actions full-width admin-filter-actions">
            <Button
              variant="secondary"
              type="submit"
              disabled={auditStatus === API_STATUS.loading}
            >
              Apply filters
            </Button>
            <Button variant="ghost" type="button" onClick={resetAuditFilters}>
              Reset
            </Button>
          </div>
        </form>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Service</th>
                <th>Event</th>
                <th>Actor</th>
                <th>Details</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {auditStatus === API_STATUS.loading && (
                <tr>
                  <td colSpan={6}>
                    <div className="table-loader">
                      <Loader />
                    </div>
                  </td>
                </tr>
              )}
              {auditStatus === API_STATUS.error && (
                <tr>
                  <td colSpan={6} className="admin-muted">
                    {auditError || 'Unable to load audit logs.'}
                  </td>
                </tr>
              )}
              {auditStatus === API_STATUS.success && auditLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-muted">
                    No audit logs found.
                  </td>
                </tr>
              )}
              {auditStatus === API_STATUS.success &&
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="admin-code">#{log.id}</td>
                    <td>
                      <span className="admin-tag admin-tag-service">
                        {formatLabel(log.serviceName)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-cell">
                        <span className="admin-tag admin-tag-event">
                          {formatLabel(log.eventType)}
                        </span>
                        {log.eventRef && <span className="admin-code">{log.eventRef}</span>}
                      </div>
                    </td>
                    <td className="admin-code">{log.actorUserId ? log.actorUserId : 'SYSTEM'}</td>
                    <td title={log.details || ''}>
                      {truncate(log.details || 'No details')}
                    </td>
                    <td className="admin-muted">{formatDateTime(log.createdAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
