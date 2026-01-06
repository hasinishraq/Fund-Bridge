import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'

const statusToneMap = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
  RESUBMIT_REQUIRED: 'bg-amber-50 text-amber-700 border border-amber-200',
  default: 'bg-slate-50 text-slate-700 border border-slate-200',
}

const getStatusTone = (status) => statusToneMap[status] || statusToneMap.default

const KYC_MESSAGES = {
  PENDING:
    'We created your verification profile. Complete the short Sumsub flow to unlock loans and payouts.',
  IN_REVIEW:
    'Our compliance partner is reviewing your submission. You will be notified as soon as it clears.',
  RESUBMIT_REQUIRED:
    'Additional documents are required. Click continue to re-open the Sumsub flow and upload the missing files.',
  REJECTED:
    'Verification was rejected. Contact support or restart the process if you have updated documentation.',
}

const BorrowerProfile = () => {
  const { user, bootstrapping, refreshProfile } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const kycStatus = user?.kycStatus || 'PENDING'
  const kycMessage =
    KYC_MESSAGES[kycStatus] ||
    'Complete identity verification to access all FundBridge services.'

  const verificationActions = useMemo(() => {
    if (!user?.kycReviewUrl) {
      return null
    }
    return (
      <Link
        to={user.kycReviewUrl}
        className="inline-flex items-center justify-center rounded-xl bg-[#1f2a5b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        Continue verification
      </Link>
    )
  }, [user?.kycReviewUrl])

  const handleRefresh = async () => {
    setRefreshing(true)
    setMessage('')
    setError('')
    try {
      await refreshProfile()
      setMessage('Profile refreshed')
    } catch (err) {
      console.error(err)
      setError('Unable to refresh profile right now')
    } finally {
      setRefreshing(false)
    }
  }

  if (bootstrapping) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">Profile</p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{user?.name}</h1>
            <p className="text-sm font-semibold text-slate-600">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
              Borrower
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-[#1f2a5b] shadow-sm transition hover:-translate-y-[1px] hover:border-[#1f2a5b] hover:text-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? 'Refreshing...' : 'Refresh profile'}
            </button>
            {verificationActions}
          </div>
        </div>
        {(message || error) && (
          <p
            className={`mt-3 inline-block rounded-xl border px-3 py-2 text-sm font-semibold ${
              error
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || message}
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">Account</p>
              <h2 className="text-xl font-semibold text-slate-900">Personal details</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Full name</p>
              <p className="text-base font-semibold text-slate-900">{user?.name || '--'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Email</p>
              <p className="text-base font-semibold text-slate-900">{user?.email || '--'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Role</p>
              <p className="text-base font-semibold text-slate-900">{user?.role || 'BORROWER'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">User ID</p>
              <p className="break-all text-base font-semibold text-slate-900">{user?.id || '--'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">
                Verification
              </p>
              <h2 className="text-xl font-semibold text-slate-900">KYC status</h2>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${getStatusTone(kycStatus)}`}>
              {kycStatus.replace(/_/g, ' ')}
            </div>
            <p className="text-sm text-slate-700">{kycMessage}</p>
            {user?.kycApplicantId && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Applicant ID</p>
                <p className="break-all text-sm font-semibold text-slate-900">
                  {user.kycApplicantId}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default BorrowerProfile
