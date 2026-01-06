import { Link, Navigate } from 'react-router-dom'
import RegisterForm from '../../components/auth/RegisterForm'
import { useAuth } from '../../context/AuthContext'
import { getRoleHomePath } from '../../utils/constants'

const RegisterPage = () => {
  const { register, isAuthenticated, loading, user } = useAuth()
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
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Create your account</h1>
          <p className="text-slate-600">
            Join in a few steps to request funding or deploy capital with clarity.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-500">Fast start</p>
              <p className="text-sm text-slate-700">Simple details to get you into the dashboard.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-500">Secure</p>
              <p className="text-sm text-slate-700">Compliance-ready flows with role-based access.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="mb-5 space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">Get started</h2>
            <p className="text-sm text-slate-600">Tell us who you are and set your credentials.</p>
          </div>
          <RegisterForm onSubmit={register} loading={loading} />
          <p className="mt-4 text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#1f2a5b] hover:text-[#23306b]">
              Login
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage
