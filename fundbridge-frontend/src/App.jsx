import {
  BrowserRouter,
  Route,
  Routes,
  Outlet,
  Navigate,
} from 'react-router-dom'
import './App.css'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import AdminRegisterPage from './pages/auth/AdminRegisterPage'
import DashboardRouter from './pages/dashboard/DashboardRouter'
import Dashboard from './pages/dashboard/Dashboard'
import LenderDashboard from './pages/dashboard/LenderDashboard'
import ApplyLoan from './pages/loan/ApplyLoan'
import MyLoans from './pages/loan/MyLoans'
import LoanDetails from './pages/loan/LoanDetails'
import LoanMarketplace from './pages/loan/LoanMarketplace'
import LenderOffers from './pages/loan/LenderOffers'
import WalletBalance from './pages/wallet/WalletBalance'
import Transactions from './pages/wallet/Transactions'
import AdminDashboard from './pages/admin/AdminDashboard'
import HomePage from './pages/home/HomePage'
import PrivateRoute from './routes/PrivateRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import BorrowerProfile from './pages/dashboard/BorrowerProfile'

const DashboardShell = () => (
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
)

const NotFound = () => (
  <div className="page-center">
    <div className="card error-card">
      <h2>404</h2>
      <p>The page you are looking for does not exist.</p>
    </div>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/register" element={<AdminRegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<DashboardShell />}>
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/dashboard/borrower" element={<Dashboard />} />
            <Route path="/dashboard/borrower/profile" element={<BorrowerProfile />} />
            <Route path="/dashboard/lender" element={<LenderDashboard />} />
            <Route path="/lender/dashboard" element={<Navigate to="/dashboard/lender" replace />} />
            <Route path="/loans/apply" element={<ApplyLoan />} />
            <Route path="/loans/marketplace" element={<LoanMarketplace />} />
            <Route path="/loans/offers" element={<LenderOffers />} />
            <Route path="/loans" element={<MyLoans />} />
            <Route path="/loans/:id" element={<LoanDetails />} />
            <Route path="/wallet" element={<WalletBalance />} />
            <Route path="/wallet/transactions" element={<Transactions />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
