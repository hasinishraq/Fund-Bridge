import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getRoleHomePath } from '../../utils/constants'

const Navbar = () => {
  const { user, logout } = useAuth()
  const brandDestination = getRoleHomePath(user?.role)
  const initials = user?.name?.[0]?.toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link to={brandDestination} className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-indigo-700">
          <span className="inline-flex h-3 w-3 rounded-sm bg-gradient-to-br from-indigo-500 to-sky-400 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]" aria-hidden="true" />
          FundBridge
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <span className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-sm font-semibold uppercase text-white">
                {initials}
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-slate-900">{user.name}</span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  {user.role}
                </span>
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:border-indigo-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
