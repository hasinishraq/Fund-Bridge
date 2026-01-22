import { Navigate, Link } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'
import { useAuth } from '../../context/AuthContext'
import { getRoleHomePath } from '../../utils/constants'

const LoginPage = () => {
  const { login, isAuthenticated, loading, user } = useAuth()

  const destination = getRoleHomePath(user?.role)

  if (isAuthenticated) {
    return <Navigate to={destination} replace />
  }

  return (
    <section className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid gap-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:grid-cols-[1.05fr,0.95fr] md:p-10">
        <div className="space-y-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            FundBridge
          </span>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Welcome back</h1>
          <p className="text-slate-600">
            Sign in to keep your lending and borrowing in one calm, focused workspace.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-500">Status</p>
              <p className="text-sm text-slate-700">Secure sessions with monitored uptime.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-500">Visibility</p>
              <p className="text-sm text-slate-700">Track balances, loans, and approvals easily.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="mb-5 space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-600">Use your email and password to continue.</p>
          </div>
          <LoginForm onSubmit={login} loading={loading} />
          <p className="mt-4 text-sm text-slate-600">
            Forgot your password?{' '}
            <Link to="/forgot-password" className="font-semibold text-[#1f2a5b] hover:text-[#23306b]">
              Reset it
            </Link>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Need an account?{' '}
            <Link to="/register" className="font-semibold text-[#1f2a5b] hover:text-[#23306b]">
              Register
            </Link>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Admin onboarding?{' '}
            <Link to="/admin/register" className="font-semibold text-[#1f2a5b] hover:text-[#23306b]">
              Register as admin
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
