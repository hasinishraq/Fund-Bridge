import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getRoleHomePath } from '../../utils/constants'
import Loader from '../../components/common/Loader'

const DashboardRouter = () => {
  const { user, bootstrapping } = useAuth()

  if (bootstrapping) {
    return (
      <div className="page-center">
        <Loader />
      </div>
    )
  }

  const destination = getRoleHomePath(user?.role)
  return <Navigate to={destination} replace />
}

export default DashboardRouter
