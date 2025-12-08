import { NavLink } from 'react-router-dom'
import { NAV_LINKS } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

const Sidebar = () => {
  const { user } = useAuth()

  const links = NAV_LINKS.filter(
    (link) => !link.roles || (user && link.roles.includes(user.role)),
  )

  return (
    <nav className="sidebar">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`.trim()
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default Sidebar
