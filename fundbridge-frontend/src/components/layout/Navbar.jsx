import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getRoleHomePath } from '../../utils/constants'

const Navbar = () => {
  const { user, logout } = useAuth()
  const brandDestination = getRoleHomePath(user?.role)
  const initials = user?.name?.[0]?.toUpperCase() || 'U'
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationsRef = useRef(null)

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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
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
              placeholder="Search loans, borrowers, transactions..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden sm:block" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-slate-700"
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
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-sm font-semibold text-slate-900">No new notifications</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Updates about funding, repayments, and wallet activity will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
          {user && (
            <span className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
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
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition hover:border-blue-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
