import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchInAppNotifications, markInAppNotificationRead } from '../../api/notificationApi'
import { getRoleHomePath, ROLE } from '../../utils/constants'

const Navbar = () => {
  const { user, logout } = useAuth()
  const brandDestination = getRoleHomePath(user?.role)
  const initials = user?.name?.[0]?.toUpperCase() || 'U'
  const isBorrower = user?.role === ROLE.BORROWER
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState('')
  const notificationsRef = useRef(null)
  const searchInputRef = useRef(null)

  const formatTimestamp = (value) => {
    if (!value) {
      return ''
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    return date.toLocaleString()
  }

  useEffect(() => {
    if (!showNotifications) {
      return undefined
    }

    const handleClick = (event) => {
      if (!notificationsRef.current?.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showNotifications])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented) {
        return
      }
      const tag = event.target?.tagName?.toLowerCase()
      const isEditable =
        tag === 'input' || tag === 'textarea' || event.target?.isContentEditable
      if (isEditable) {
        return
      }
      if (event.key === '/' || (event.ctrlKey && event.key.toLowerCase() === 'k')) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!showNotifications || !user?.id) {
      return undefined
    }
    let isActive = true
    setNotificationsLoading(true)
    setNotificationsError('')
    fetchInAppNotifications({ userId: user.id, unreadOnly: false })
      .then((data) => {
        if (!isActive) {
          return
        }
        setNotifications(Array.isArray(data) ? data : [])
      })
      .catch((error) => {
        console.error('Unable to load notifications', error)
        if (!isActive) {
          return
        }
        setNotificationsError('Unable to load notifications right now.')
      })
      .finally(() => {
        if (isActive) {
          setNotificationsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [showNotifications, user?.id])

  const handleMarkRead = async (notification) => {
    if (!user?.id || !notification?.id || notification.readAt) {
      return
    }
    try {
      const updated = await markInAppNotificationRead({
        userId: user.id,
        notificationId: notification.id,
      })
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, ...updated } : item)),
      )
    } catch (error) {
      console.error('Unable to mark notification as read', error)
    }
  }

  const headerClassName = [
    'sticky top-0 z-40 border-b',
    isBorrower
      ? 'border-white/30 bg-white/40 backdrop-blur-xl shadow-[0_14px_32px_rgba(15,23,42,0.1)]'
      : 'border-slate-200 bg-white/95 backdrop-blur',
  ].join(' ')

  const surfaceClassName = isBorrower
    ? 'border-white/40 bg-white/70 shadow-[0_8px_20px_rgba(15,23,42,0.08)]'
    : 'border-slate-200 bg-white shadow-sm'

  const inputClassName = isBorrower
    ? 'w-full rounded-lg border border-white/60 bg-white/70 py-2 pl-9 pr-12 text-sm text-slate-700 placeholder:text-slate-500 focus:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-100/70'
    : 'w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-12 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100'

  const keycapClassName = isBorrower
    ? 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/60 bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400'
    : 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400'

  return (
    <header className={headerClassName}>
      <div className="flex items-center gap-4 px-5 py-3 lg:px-8">
        <Link
          to={brandDestination}
          className="inline-flex items-center gap-2 text-base font-semibold text-slate-900"
        >
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f2a5b] text-sm font-bold text-white shadow-sm"
            aria-hidden="true"
          >
            F
          </span>
          FundBridge
        </Link>

        <div className="hidden flex-1 items-center md:flex">
          <div className="relative w-full max-w-xl">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M21 20.3 16.65 16a7 7 0 1 0-1.4 1.4L20.3 21 21 20.3ZM5 11a6 6 0 1 1 12 0 6 6 0 0 1-12 0Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search user, loan, txn, reference id..."
              className={inputClassName}
              ref={searchInputRef}
              aria-label="Global search"
            />
            <span className={keycapClassName}>
              /
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden sm:block" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-slate-500 transition hover:border-blue-200 hover:text-slate-700 ${surfaceClassName}`}
              aria-label="Notifications"
              aria-haspopup="dialog"
              aria-expanded={showNotifications}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M12 22a2.3 2.3 0 0 0 2.2-1.7h-4.4A2.3 2.3 0 0 0 12 22Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            {showNotifications && (
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 z-50 mt-3 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Notifications
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-700"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {!user?.id && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-sm font-semibold text-slate-900">Sign in to view notifications</p>
                    </div>
                  )}
                  {user?.id && notificationsLoading && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-sm font-semibold text-slate-900">Loading notifications...</p>
                    </div>
                  )}
                  {user?.id && notificationsError && !notificationsLoading && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-3">
                      <p className="text-sm font-semibold text-rose-600">{notificationsError}</p>
                    </div>
                  )}
                  {user?.id && !notificationsLoading && !notificationsError && notifications.length === 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-sm font-semibold text-slate-900">No new notifications</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Updates about funding, repayments, and wallet activity will appear here.
                      </p>
                    </div>
                  )}
                  {user?.id && !notificationsLoading && !notificationsError && notifications.length > 0 && (
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                      {notifications.map((notification) => {
                        const isRead = Boolean(notification.readAt)
                        return (
                        <div
                          key={notification.id}
                          className={`rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm ${
                            isRead ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {notification.title || notification.templateKey || 'Notification'}
                              </p>
                              <p className="mt-1 text-xs text-slate-600">{notification.body}</p>
                              {notification.createdAt && (
                                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                                  {formatTimestamp(notification.createdAt)}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleMarkRead(notification)}
                              disabled={isRead}
                              className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
                                isRead
                                  ? 'cursor-not-allowed text-slate-400'
                                  : 'text-blue-600 hover:text-blue-700'
                              }`}
                            >
                              {isRead ? 'Read' : 'Mark read'}
                            </button>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {user && (
            <span
              className={`flex items-center gap-3 rounded-full border px-3 py-1.5 ${surfaceClassName}`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-sm font-semibold uppercase text-white">
                {initials}
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-sm font-semibold text-slate-900">{user.name}</span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {user.role}
                </span>
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            className={`inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition hover:border-blue-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 ${surfaceClassName}`}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
