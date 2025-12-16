import { Link } from 'react-router-dom'
import Button from '../common/Button'
import { useAuth } from '../../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()

  return (
    <header className="navbar">
      <Link to="/dashboard" className="brand">
        <span className="brand-mark" aria-hidden="true" />
        FundBridge
      </Link>
      <div className="navbar-actions">
        {user && (
          <span className="user-chip">
            <span className="user-avatar" aria-hidden="true">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </span>
            <span className="user-meta">
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </span>
          </span>
        )}
        <Button variant="ghost" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  )
}

export default Navbar
