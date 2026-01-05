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
  const roleLabel =
    user?.role === ROLE.LENDER ? 'Lender' : user?.role === ROLE.ADMIN ? 'Admin' : 'Borrower'
  const walletLinks = links.filter((link) => link.to.includes('wallet'))
  const adminLinks = links.filter((link) => link.to.includes('admin'))
  const mainLinks = links.filter(
    (link) => !link.to.includes('wallet') && !link.to.includes('admin'),
  )

  return (
    <aside className="flex w-full flex-col gap-4 border border-white/10 bg-gradient-to-b from-[#1f2a5b] via-[#1c2450] to-[#141a38] text-slate-200 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-64 lg:min-w-[16rem] lg:rounded-none">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">Menu</p>
          <p className="text-sm font-semibold text-white">FundBridge</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/80">
          {roleLabel}
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-6 px-3 pb-4">
        {mainLinks.length > 0 && (
          <div className="space-y-2">
            <p className="px-3 text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Workspace
            </p>
            <div className="space-y-1">
              {mainLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.exact !== false}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                      isActive
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white',
                    ].join(' ')
                  }
                >
                  <span
                    className={[
                      'flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-200 transition',
                      'group-hover:bg-white/15 group-hover:text-white',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {getIcon(link.to)}
                  </span>
                  <span className="truncate">{link.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {walletLinks.length > 0 && (
          <div className="space-y-2">
            <p className="px-3 text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Wallet
            </p>
            <div className="space-y-1">
              {walletLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.exact !== false}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                      isActive
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white',
                    ].join(' ')
                  }
                >
                  <span
                    className={[
                      'flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-200 transition',
                      'group-hover:bg-white/15 group-hover:text-white',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {getIcon(link.to)}
                  </span>
                  <span className="truncate">{link.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {adminLinks.length > 0 && (
          <div className="space-y-2">
            <p className="px-3 text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Admin
            </p>
            <div className="space-y-1">
              {adminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.exact !== false}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                      isActive
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white',
                    ].join(' ')
                  }
                >
                  <span
                    className={[
                      'flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-200 transition',
                      'group-hover:bg-white/15 group-hover:text-white',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {getIcon(link.to)}
                  </span>
                  <span className="truncate">{link.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="px-4 pb-4">
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-slate-200">
          <p className="font-semibold text-white">Need help?</p>
          <p className="text-slate-300">support@fundbridge.com</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
