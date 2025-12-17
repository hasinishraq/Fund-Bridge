import { NavLink } from 'react-router-dom'
import { NAV_LINKS, ROLE } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

const iconMap = {
  dashboard: (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-17v4h6V3h-6Z"
        fill="currentColor"
      />
    </svg>
  ),
  loans: (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Z"
        fill="currentColor"
      />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M4 6h14a2 2 0 0 1 2 2v2h-4a2 2 0 0 0 0 4h4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm16 6v2h-4v-2h4Z"
        fill="currentColor"
      />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M12 2 3 7v5c0 5 4 8.5 9 10 5-1.5 9-5 9-10V7l-9-5Zm0 2.18 7 3.89v3.93c0 3.67-2.9 6.64-7 7.93-4.1-1.29-7-4.26-7-7.93V8.07l7-3.89ZM12 11a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm0 2c-2.67 0-4 1.33-4 3h8c0-1.67-1.33-3-4-3Z"
        fill="currentColor"
      />
    </svg>
  ),
}

const getIcon = (to) => {
  if (to.includes('wallet')) return iconMap.wallet
  if (to.includes('loan')) return iconMap.loans
  if (to.includes('admin')) return iconMap.admin
  return iconMap.dashboard
}

const Sidebar = () => {
  const { user } = useAuth()

  const links = NAV_LINKS.filter(
    (link) => !link.roles || (user && link.roles.includes(user.role)),
  )

  return (
    <aside className="sticky top-20 h-[calc(100vh-5rem)] w-full max-w-[270px] rounded-2xl border border-slate-200 bg-white/90 shadow-lg ring-1 ring-slate-100/60">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">FundBridge</p>
          <p className="text-sm font-semibold text-slate-900">Workspace</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-indigo-700">
          {user?.role === ROLE.LENDER ? 'Lender' : 'Borrower'}
        </span>
      </div>

      <nav className="space-y-2 p-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              [
                'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition',
                isActive
                  ? 'bg-indigo-50 text-indigo-800 shadow-sm ring-1 ring-indigo-100'
                  : 'text-slate-800 hover:-translate-y-[1px] hover:bg-slate-50 hover:text-slate-900',
              ].join(' ')
            }
          >
            <span
              className={[
                'flex h-9 w-9 items-center justify-center rounded-lg border text-slate-500 transition',
                'border-slate-200 bg-white group-hover:border-indigo-200 group-hover:text-indigo-700',
              ].join(' ')}
              aria-hidden="true"
            >
              {getIcon(link.to)}
            </span>
            <span className="truncate">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
