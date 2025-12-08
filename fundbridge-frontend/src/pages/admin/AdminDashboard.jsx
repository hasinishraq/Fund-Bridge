import { useEffect, useState } from 'react'
import {
  fetchAdminStats,
  fetchPendingLoans,
  fetchUsers,
} from '../../api/adminApi'
import Loader from '../../components/common/Loader'
import { CURRENCY_FORMATTER, ROLE } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [pendingLoans, setPendingLoans] = useState([])
  const [status, setStatus] = useState('LOADING')

  useEffect(() => {
    if (user?.role !== ROLE.ADMIN) {
      setStatus('READY')
      return
    }

    const load = async () => {
      try {
        const [statsResponse, usersResponse, pendingLoansResponse] =
          await Promise.all([
            fetchAdminStats(),
            fetchUsers(),
            fetchPendingLoans(),
          ])
        setStats(statsResponse)
        setUsers(usersResponse || [])
        setPendingLoans(pendingLoansResponse || [])
        setStatus('SUCCESS')
      } catch (error) {
        console.error(error)
        setStatus('ERROR')
      }
    }
    load()
  }, [user])

  if (user?.role !== ROLE.ADMIN) {
    return (
      <section className="card error-card">
        <p>Only admins can view this dashboard.</p>
      </section>
    )
  }

  if (status === 'LOADING') {
    return (
      <div className="page-center">
        <Loader />
      </div>
    )
  }

  if (status === 'ERROR') {
    return (
      <section className="card error-card">
        <p>Unable to load admin dashboard</p>
      </section>
    )
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="card stat-card">
          <p>Total Users</p>
          <h3>{stats?.totalUsers ?? 0}</h3>
        </div>
        <div className="card stat-card">
          <p>Total Loans</p>
          <h3>{stats?.totalLoans ?? 0}</h3>
        </div>
        <div className="card stat-card">
          <p>Active Loans</p>
          <h3>{stats?.activeLoans ?? 0}</h3>
        </div>
        <div className="card stat-card">
          <p>Wallet Volume</p>
          <h3>{CURRENCY_FORMATTER.format(stats?.totalWalletVolume ?? 0)}</h3>
        </div>
      </div>

      <section className="card">
        <h3>Pending Loans</h3>
        {pendingLoans.length ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Requested</th>
              </tr>
            </thead>
            <tbody>
              {pendingLoans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.id}</td>
                  <td>{loan.userName || loan.userId}</td>
                  <td>{CURRENCY_FORMATTER.format(loan.amount)}</td>
                  <td>
                    {loan.createdAt
                      ? new Date(loan.createdAt).toLocaleString()
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No pending loans!</p>
        )}
      </section>

      <section className="card">
        <h3>Recent Users</h3>
        {users.length ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 5).map((userItem) => (
                <tr key={userItem.id}>
                  <td>{userItem.name}</td>
                  <td>{userItem.email}</td>
                  <td>{userItem.role}</td>
                  <td>
                    {userItem.createdAt
                      ? new Date(userItem.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No users found.</p>
        )}
      </section>
    </div>
  )
}

export default AdminDashboard
