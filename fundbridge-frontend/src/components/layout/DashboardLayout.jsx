import PropTypes from 'prop-types'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

const DashboardLayout = ({ children }) => (
  <div className="app-shell">
    <Navbar />
    <div className="shell-body">
      <Sidebar />
      <main className="shell-content">{children}</main>
    </div>
  </div>
)

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default DashboardLayout
