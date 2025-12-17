import { NavLink } from 'react-router-dom'
import { NAV_LINKS } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

const Sidebar = () => {
  const { user } = useAuth()

  const links = NAV_LINKS.filter(
    (link) => !link.roles || (user && link.roles.includes(user.role)),
  )

  return (
    <nav className="sticky top-20 h-[calc(100vh-5rem)] w-full max-w-[260px] space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-md">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Workspace
      </div>
      <div className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition',
                isActive
                  ? 'border-indigo-100 bg-indigo-50 text-indigo-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-800 hover:-translate-y-[1px] hover:border-indigo-100 hover:text-slate-900',
              ].join(' ')
            }
          >
            <span
              className={[
                'h-2.5 w-2.5 rounded-sm',
                'bg-slate-400',
              ].join(' ')}
              aria-hidden="true"
            />
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default Sidebar
