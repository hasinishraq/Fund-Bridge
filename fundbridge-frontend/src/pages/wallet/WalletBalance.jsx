import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import {
  confirmStripePayment,
  createSslcommerzTopUpIntent,
  createStripeTopUpIntent,
  fetchWalletBalance,
  validateSslcommerzPayment,
} from '../../api/walletApi'
import Loader from '../../components/common/Loader'
import { API_STATUS, CURRENCY_FORMATTER } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

const QUICK_AMOUNTS = [100, 250, 500, 1000]
const PAYMENT_METHODS = {
  SSLCOMMERZ: 'sslcommerz',
  CARD: 'card',
}
const buildIdempotencyKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `wallet-${Date.now()}`

const StripePaymentForm = ({ intent, onSuccess, onError }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!stripe || !elements) {
      onError?.('Stripe is still loading. Please try again.')
      return
    }
    setSubmitting(true)
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.href,
        },
      })
      if (error) {
        onError?.(error.message || 'Unable to confirm payment')
        return
      }
      if (paymentIntent?.status === 'succeeded') {
        onSuccess?.(paymentIntent)
      } else {
        onError?.(`Payment status: ${paymentIntent?.status ?? 'unknown'}`)
      }
    } catch (err) {
      onError?.('Unable to confirm payment right now')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <PaymentElement id="wallet-payment-element" options={{ layout: 'tabs' }} />
      <button
        type="submit"
        disabled={submitting || !stripe || !elements}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f2a5b] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Confirming...' : `Pay ${CURRENCY_FORMATTER.format(intent?.amount ?? 0)}`}
      </button>
    </form>
  )
}

const WalletBalance = () => {
  const [wallet, setWallet] = useState(null)
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState(API_STATUS.loading)
  const [formStatus, setFormStatus] = useState(API_STATUS.idle)
  const [formMessage, setFormMessage] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.SSLCOMMERZ)
  const [sslIntent, setSslIntent] = useState(null)
  const [sslConfirming, setSslConfirming] = useState(false)
  const [stripeIntent, setStripeIntent] = useState(null)
  const [idempotencyKey, setIdempotencyKey] = useState(() => buildIdempotencyKey())
  const { user, bootstrapping } = useAuth()

  const currency = wallet?.currency || 'BDT'
  const sslMinAmount = 10
  const cardMinAmount = useMemo(() => {
    return currency === 'BDT' ? 60 : 1
  }, [currency])

  const loadWallet = async ({ silent = false } = {}) => {
    if (!user?.id) {
      setStatus(API_STATUS.error)
      setFormMessage('Sign in to view your wallet')
      return
    }
    if (!silent) {
      setStatus(API_STATUS.loading)
    }
    try {
      const response = await fetchWalletBalance({ userId: user.id })
      setWallet(response)
      setStatus(API_STATUS.success)
    } catch (error) {
      console.error(error)
      setStatus(API_STATUS.error)
    }
  }

  useEffect(() => {
    if (bootstrapping) {
      return
    }
    loadWallet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapping, user?.id])

  const stripePromise = useMemo(
    () => (stripeIntent?.publishableKey ? loadStripe(stripeIntent.publishableKey) : null),
    [stripeIntent?.publishableKey],
  )

  const handlePaymentSuccess = async () => {
    setFormStatus(API_STATUS.success)
    setFormMessage('Payment succeeded. Updating wallet balance...')
    await loadWallet({ silent: true })
    setStripeIntent(null)
    setSslIntent(null)
    setSslConfirming(false)
    setAmount('')
    setIdempotencyKey(buildIdempotencyKey())
  }

  const handlePaymentError = (message) => {
    setFormStatus(API_STATUS.error)
    setFormMessage(message || 'Unable to complete payment')
  }

  const handleStripeConfirm = async (paymentIntent) => {
    const paymentIntentId = paymentIntent?.id || stripeIntent?.paymentIntentId
    if (!paymentIntentId) {
      handlePaymentError('Missing Stripe payment intent id.')
      return
    }
    setFormStatus(API_STATUS.loading)
    setFormMessage('Confirming Stripe payment...')
    try {
      const response = await confirmStripePayment({
        paymentIntentId,
        userId: user?.id,
      })
      if (response?.status === 'SUCCEEDED') {
        await handlePaymentSuccess()
        return
      }
      setFormStatus(API_STATUS.success)
      setFormMessage(
        response?.status
          ? `Payment status: ${response.status}. Wallet will update shortly.`
          : 'Payment captured. Wallet will update shortly.',
      )
      setStripeIntent(null)
      setSslIntent(null)
      setSslConfirming(false)
      setAmount('')
      setIdempotencyKey(buildIdempotencyKey())
    } catch (error) {
      console.error(error)
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to confirm Stripe payment right now'
      setFormStatus(API_STATUS.error)
      setFormMessage(message)
    }
  }

  const handleTopUp = async (event) => {
    event.preventDefault()
    const numericAmount = Number(amount)
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setFormStatus(API_STATUS.error)
      setFormMessage('Enter an amount greater than 0')
      return
    }
    if (paymentMethod === PAYMENT_METHODS.CARD && numericAmount < cardMinAmount) {
      setFormStatus(API_STATUS.error)
      setFormMessage(`Card top up must be at least ${cardMinAmount} ${currency}`)
      return
    }
    if (paymentMethod === PAYMENT_METHODS.SSLCOMMERZ && numericAmount < sslMinAmount) {
      setFormStatus(API_STATUS.error)
      setFormMessage(`SSLCommerz top up must be at least ${sslMinAmount} ${currency}`)
      return
    }
    if (
      paymentMethod === PAYMENT_METHODS.SSLCOMMERZ &&
      wallet?.currency &&
      wallet.currency.toUpperCase() !== 'BDT'
    ) {
      setFormStatus(API_STATUS.error)
      setFormMessage('SSLCommerz is available for BDT wallets. Switch currency to BDT to continue.')
      return
    }
    setFormStatus(API_STATUS.loading)
    setFormMessage(
      paymentMethod === PAYMENT_METHODS.SSLCOMMERZ
        ? 'Preparing SSLCommerz checkout...'
        : 'Opening secure payment sheet...',
    )
    setSslConfirming(false)
    setStripeIntent(null)
    setSslIntent(null)
    try {
      if (paymentMethod === PAYMENT_METHODS.SSLCOMMERZ) {
        const response = await createSslcommerzTopUpIntent({
          amount: numericAmount,
          userId: user?.id,
          currency: wallet?.currency || 'BDT',
          idempotencyKey,
          referenceId: `wallet-ssl-${idempotencyKey}`,
          customerName: user?.name,
          customerEmail: user?.email,
          customerPhone: user?.phone || String(user?.id ?? ''),
        })
        if (response?.walletTransactionId && response?.status === 'SUCCEEDED') {
          await handlePaymentSuccess()
          return
        }
        setSslIntent(response)
        setFormStatus(API_STATUS.success)
        setFormMessage('Continue in the SSLCommerz window to finish payment, then confirm below.')
        return
      } else {
        const response = await createStripeTopUpIntent({
          amount: numericAmount,
          userId: user?.id,
          currency: wallet?.currency,
          idempotencyKey,
          referenceId: `wallet-topup-${idempotencyKey}`,
        })
        if (response?.walletTransactionId && response?.status === 'SUCCEEDED') {
          setFormStatus(API_STATUS.success)
          setFormMessage('Payment already captured. Refreshing balance...')
          await loadWallet({ silent: true })
          setStripeIntent(null)
          setAmount('')
          setIdempotencyKey(buildIdempotencyKey())
          return
        }
        setStripeIntent(response)
        setFormStatus(API_STATUS.success)
        setFormMessage('Card entry ready. Complete payment to fund your wallet.')
      }
    } catch (error) {
      console.error(error)
      setFormStatus(API_STATUS.error)
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (paymentMethod === PAYMENT_METHODS.SSLCOMMERZ
          ? 'Unable to start SSLCommerz payment right now'
          : 'Unable to start card payment right now')
      setFormMessage(message)
    }
  }

  const openSslCheckout = () => {
    if (sslIntent?.redirectUrl) {
      window.open(sslIntent.redirectUrl, '_blank', 'noopener')
    }
  }

  const handleSslConfirm = async () => {
    if (!sslIntent?.tranId) {
      setFormStatus(API_STATUS.error)
      setFormMessage('Start an SSLCommerz payment before confirming.')
      return
    }
    setSslConfirming(true)
    setFormStatus(API_STATUS.loading)
    setFormMessage('Confirming SSLCommerz payment...')
    try {
      const response = await validateSslcommerzPayment({
        tranId: sslIntent.tranId,
        userId: user?.id,
      })
      setSslIntent((prev) => ({
        ...prev,
        ...response,
        redirectUrl: response?.redirectUrl ?? prev?.redirectUrl,
      }))
      if (response?.status === 'SUCCEEDED') {
        await handlePaymentSuccess()
        return
      }
      setFormStatus(API_STATUS.success)
      setFormMessage(response?.message || `Payment status: ${response?.status ?? 'processing'}`)
    } catch (error) {
      console.error(error)
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to confirm SSLCommerz payment right now'
      setFormStatus(API_STATUS.error)
      setFormMessage(message)
    } finally {
      setSslConfirming(false)
    }
  }

  const availableBalance = useMemo(() => {
    const balance = Number(wallet?.balance ?? 0)
    const held = Number(wallet?.held ?? 0)
    return Math.max(0, balance - held)
  }, [wallet?.balance, wallet?.held])

  if (bootstrapping || status === API_STATUS.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (status === API_STATUS.error) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-rose-400/30 bg-rose-50 px-6 py-5 text-rose-800 shadow">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-rose-600">Wallet</p>
        <p className="mt-2 text-lg font-semibold">Unable to load wallet information</p>
        <button
          type="button"
          onClick={() => loadWallet()}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#1f2a5b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          Try again
        </button>
      </div>
    )
  }

  const lastUpdated = wallet?.updatedAt
    ? new Date(wallet.updatedAt).toLocaleString()
    : 'Just now'

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">Wallet</p>
            <h1 className="text-3xl font-bold text-slate-900">
              {CURRENCY_FORMATTER.format(wallet?.balance ?? 0)}{' '}
              <span className="text-lg font-semibold text-slate-500">{currency}</span>
            </h1>
            <p className="text-sm text-slate-600">Last updated: {lastUpdated}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
              Status: {wallet?.status || 'Unknown'}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => loadWallet()}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-[#1f2a5b] shadow-sm transition hover:-translate-y-[1px] hover:border-[#1f2a5b] hover:text-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              Refresh
            </button>
            <Link
              to="/wallet/transactions"
              className="inline-flex items-center justify-center rounded-xl bg-[#1f2a5b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              View transactions
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Available</p>
            <p className="text-xl font-semibold text-emerald-700">
              {CURRENCY_FORMATTER.format(availableBalance)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Held</p>
            <p className="text-xl font-semibold text-slate-900">
              {CURRENCY_FORMATTER.format(wallet?.held ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Currency</p>
            <p className="text-xl font-semibold text-slate-900">{currency}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">Funding</p>
              <h2 className="text-xl font-semibold text-slate-900">Top up wallet</h2>
              <p className="text-sm text-slate-600">
                Add funds to request disbursements and repay loans instantly.
              </p>
            </div>
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleTopUp}>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Payment method</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    id: PAYMENT_METHODS.SSLCOMMERZ,
                    title: 'SSLCommerz (Bangladesh)',
                    body: 'Pay with local cards and wallets in BDT.',
                  },
                  {
                    id: PAYMENT_METHODS.CARD,
                    title: 'Card (Stripe)',
                    body: 'International cards and Apple/Google Pay.',
                  },
                ].map((method) => {
                  const active = paymentMethod === method.id
                  return (
                    <button
                      type="button"
                      key={method.id}
                      onClick={() => {
                        setPaymentMethod(method.id)
                        setFormStatus(API_STATUS.idle)
                        setFormMessage('')
                        setStripeIntent(null)
                        setSslIntent(null)
                        setIdempotencyKey(buildIdempotencyKey())
                      }}
                      className={`flex h-full w-full flex-col items-start rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? 'border-[#1f2a5b]/20 bg-[#1f2a5b]/10 text-[#1f2a5b] shadow-sm'
                          : 'border-slate-200 bg-white text-slate-800 hover:-translate-y-[1px] hover:border-[#1f2a5b]'
                      }`}
                    >
                      <span className="text-sm font-semibold">{method.title}</span>
                      <span className="text-xs text-slate-600">{method.body}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="topupAmount">
                Amount
              </label>
              <div className="relative">
                <input
                  id="topupAmount"
                  type="number"
                  min={
                    paymentMethod === PAYMENT_METHODS.SSLCOMMERZ
                      ? String(sslMinAmount)
                      : String(cardMinAmount ?? 1)
                  }
                  step="0.01"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value)
                    setStripeIntent(null)
                    setSslIntent(null)
                    setIdempotencyKey(buildIdempotencyKey())
                  }}
                  placeholder="Enter amount"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm font-semibold text-slate-500">
                  {currency}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => {
                    setAmount(String(value))
                    setStripeIntent(null)
                    setSslIntent(null)
                    setIdempotencyKey(buildIdempotencyKey())
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:border-[#1f2a5b] hover:text-[#23306b]"
                >
                  +{CURRENCY_FORMATTER.format(value)}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={formStatus === API_STATUS.loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f2a5b] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {formStatus === API_STATUS.loading
                ? 'Funding...'
                : paymentMethod === PAYMENT_METHODS.SSLCOMMERZ
                  ? 'Fund with SSLCommerz'
                  : 'Fund with card'}
            </button>

            {formMessage && (
              <p
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                  formStatus === API_STATUS.error
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {formMessage}
              </p>
            )}
          </form>

          {sslIntent?.tranId && (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                Complete payment in SSLCommerz
              </p>
              <div className="space-y-2 text-sm text-slate-800">
                <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-white px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                    Transaction ID
                  </span>
                  <span className="font-semibold">{sslIntent.tranId}</span>
                </div>
                {sslIntent.redirectUrl && (
                  <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-white px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                      Checkout link
                    </span>
                    <button
                      type="button"
                      onClick={openSslCheckout}
                      className="text-[#1f2a5b] underline decoration-[#1f2a5b]/40 decoration-2 underline-offset-4 transition hover:text-[#23306b]"
                    >
                      Open SSLCommerz
                    </button>
                  </div>
                )}
                <p className="text-xs text-amber-800">
                  Complete the payment in the SSLCommerz window. Once finished, click confirm below
                  to post the funds to your wallet.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openSslCheckout}
                    disabled={!sslIntent?.redirectUrl}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1f2a5b] shadow-sm transition hover:-translate-y-[1px] hover:border-[#1f2a5b] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Open SSLCommerz window
                  </button>
                  <button
                    type="button"
                    onClick={handleSslConfirm}
                    disabled={sslConfirming}
                    className="inline-flex items-center justify-center rounded-xl bg-[#1f2a5b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sslConfirming ? 'Confirming...' : 'I completed payment'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {stripeIntent?.clientSecret && stripePromise && (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
                Secure card payment (Stripe)
              </p>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: stripeIntent.clientSecret,
                  appearance: { theme: 'stripe' },
                }}
              >
                <StripePaymentForm
                  intent={stripeIntent}
                  onSuccess={handleStripeConfirm}
                  onError={handlePaymentError}
                />
              </Elements>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">Overview</p>
              <h2 className="text-xl font-semibold text-slate-900">Summary</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="font-semibold text-slate-800">Total balance</span>
              <span className="font-semibold text-slate-900">
                {CURRENCY_FORMATTER.format(wallet?.balance ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="font-semibold text-slate-800">Held funds</span>
              <span className="font-semibold text-slate-900">
                {CURRENCY_FORMATTER.format(wallet?.held ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="font-semibold text-slate-800">Available</span>
              <span className="font-semibold text-emerald-700">
                {CURRENCY_FORMATTER.format(availableBalance)}
              </span>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Wallet balances are subject to verification and settlement timelines. For large top ups,
            contact support for faster clearing.
          </p>
        </section>
      </div>
    </div>
  )
}

export default WalletBalance
