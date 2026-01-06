import { Link } from 'react-router-dom'
import homeContent from './homeContent'

const statusToneMap = {
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  default: 'bg-slate-50 text-slate-700 border-slate-200',
}

const statAccentMap = {
  primary: 'border-l-4 border-[#1f2a5b]',
  secondary: 'border-l-4 border-blue-500',
  tertiary: 'border-l-4 border-emerald-500',
  default: 'border-l-4 border-slate-200',
}

const getStatusTone = (tone) => statusToneMap[tone] || statusToneMap.default
const getStatAccent = (accent) => statAccentMap[accent] || statAccentMap.default

const renderFeatureIcon = (index) => {
  switch (index % 3) {
    case 0:
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2h-5a2 2 0 0 0 0 4h5v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm13 4a1 1 0 1 1 0 2h4v-2h-4Z"
            fill="currentColor"
          />
        </svg>
      )
    case 1:
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M12 2 14 6.6 18.6 8.5 14 10.4 12 15 10 10.4 5.4 8.5 10 6.6 12 2Zm7 9 1 2.4 2.4 1-2.4 1L19 18l-1-2.4-2.4-1 2.4-1L19 11Z"
            fill="currentColor"
          />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M12 3 19 6v5c0 4.6-2.9 8.6-7 10-4.1-1.4-7-5.4-7-10V6l7-3Zm3.3 6.2-4 4-2-2-1.3 1.3 3.3 3.3 5.3-5.3-1.3-1.3Z"
            fill="currentColor"
          />
        </svg>
      )
  }
}

const HomePage = () => {
  const {
    hero,
    features = [],
    steps = [],
    stats = [],
    testimonials = [],
    partners = [],
    cta,
    faqs = [],
  } = homeContent

  return (
    <div className="flowdash relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-[#1f2a5b]/10 blur-3xl" />
        <div className="absolute top-36 right-[-6rem] h-64 w-64 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-[-5rem] h-64 w-64 rounded-full bg-emerald-200/50 blur-3xl" />
      </div>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur relative">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-base font-semibold text-slate-900"
          >
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f2a5b] text-sm font-bold text-white shadow-sm"
              aria-hidden="true"
            >
              F
            </span>
            FundBridge
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-[#1f2a5b] md:flex">
            <a href="#features" className="hover:text-[#23306b]">
              Solutions
            </a>
            <a href="#process" className="hover:text-[#23306b]">
              Workflow
            </a>
            <a href="#clients" className="hover:text-[#23306b]">
              Customers
            </a>
            <a href="#faq" className="hover:text-[#23306b]">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-[#1f2a5b] hover:text-[#23306b]">
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center rounded-xl bg-[#1f2a5b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flow-stagger relative z-10 mx-auto max-w-6xl space-y-16 px-4 py-12">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1021] via-[#14223e] to-[#1f2a5b] p-8 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-16 top-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="home-slide-left space-y-6">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-blue-100/70">
                {hero?.eyebrow}
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {hero?.title}
              </h1>
              <p className="text-base text-blue-100/80 sm:text-lg">{hero?.lede}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-xl bg-[#1f2a5b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#23306b] focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  Open a borrower account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-[1px] hover:border-blue-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  Explore dashboard
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {hero?.metrics?.map((metric) => (
                  <div
                    key={metric.label}
                    className="home-accent-card rounded-2xl border border-white/10 bg-white/95 px-4 py-3 shadow-lg"
                  >
                    <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="home-slide-right rounded-2xl border border-white/10 bg-white/90 p-5 shadow-lg backdrop-blur">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {hero?.cardTitle}
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  {hero?.cardStatus}
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {hero?.pipeline?.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.meta}</p>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${getStatusTone(
                          item.statusStyle,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Wallet balance
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{hero?.walletBalance}</p>
                  <p className="mt-1 text-xs text-slate-500">Ready to disburse</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {hero?.metrics?.[1]?.label || 'Yearly growth'}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {hero?.metrics?.[1]?.value || '--'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Portfolio acceleration</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-slide-up rounded-2xl border border-slate-200 bg-white/90 px-6 py-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Trusted by teams
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
              {partners.map((partner) => (
                <span
                  key={partner}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                >
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="grid gap-8 scroll-mt-24 lg:grid-cols-[0.45fr,0.55fr]">
          <div className="home-slide-left space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Built for clarity
            </p>
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              Everything you need to run a responsible lending program
            </h2>
            <p className="text-slate-600">
              Deploy capital, manage lifecycle events, and keep borrowers engaged with effortless
              workflows.
            </p>
          </div>
          <div className="home-slide-right grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="home-accent-card rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f2a5b]/10 text-[#1f2a5b]">
                    {renderFeatureIcon(index)}
                  </span>
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {feature.badge}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      {feature.title}
                    </h3>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="process"
          className="grid gap-8 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-8 shadow-sm scroll-mt-24 lg:grid-cols-[1.1fr,0.9fr]"
        >
          <div className="home-slide-left space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              From onboarding to repayment
            </p>
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              Launch a digital branch in three simple moves.
            </h2>
            <p className="text-slate-600">
              Prebuilt steps keep your team aligned while automation handles the busywork.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {stats.slice(0, 2).map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <ol className="home-slide-right space-y-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#1f2a5b]/10 text-sm font-bold text-[#1f2a5b]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-600">{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="home-slide-up grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className={`home-accent-card rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-sm ${getStatAccent(
                stat.accent,
              )}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {stat.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{stat.value}</p>
            </article>
          ))}
        </section>

        <section
          id="clients"
          className="home-slide-up rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 p-8 shadow-sm scroll-mt-24"
        >
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Trusted voices
            </p>
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              Lenders across Bangladesh rely on FundBridge.
            </h2>
            <p className="text-slate-600">
              Microfinance teams and specialised credit partners use us to keep borrowers engaged.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <blockquote
                key={testimonial.author}
                className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm"
              >
                <p className="text-base text-slate-700">&ldquo;{testimonial.quote}&rdquo;</p>
                <footer className="mt-3 text-sm font-semibold text-slate-900">
                  {testimonial.author}
                  <span className="block text-xs font-normal text-slate-500">
                    {testimonial.role}
                  </span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section
          id="faq"
          className="home-slide-up rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 shadow-sm scroll-mt-24"
        >
          <div className="grid gap-8 lg:grid-cols-[0.45fr,0.55fr]">
            <div className="home-slide-left space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Need clarity
              </p>
              <h2 className="font-display text-2xl font-semibold text-slate-900">
                Frequently asked questions
              </h2>
              <p className="text-slate-600">
                Quick answers about onboarding, compliance, and how notifications work in the
                dashboard.
              </p>
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Support
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Still have questions? Reach our team at support@fundbridge.com.
                </p>
              </div>
            </div>
            <div className="home-slide-right space-y-3">
              {faqs.map((faq, index) => (
                <details
                  key={faq.question}
                  open={index === 0}
                  className="group rounded-2xl border border-slate-200 bg-slate-50/80 transition hover:border-slate-300 open:bg-white open:shadow-sm"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-slate-900">
                    <span>{faq.question}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-400 transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="px-4 pb-4 text-sm text-slate-600">{faq.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="home-slide-up relative overflow-hidden rounded-3xl bg-[#1f2a5b] p-8 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-20 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
                {cta?.eyebrow}
              </p>
              <h2 className="font-display text-2xl font-semibold">{cta?.heading}</h2>
              <p className="text-blue-100">{cta?.copy}</p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#1f2a5b] shadow-sm transition hover:-translate-y-[1px] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                Create free account
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-[1px] hover:border-white/70 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                I already have one
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-slate-900">FundBridge</h4>
            <p className="text-sm text-slate-600">
              Responsible financing infrastructure for modern lenders.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Platform
            </p>
            <a href="#features" className="block text-sm text-slate-700 hover:text-slate-900">
              Features
            </a>
            <a href="#process" className="block text-sm text-slate-700 hover:text-slate-900">
              Automation
            </a>
            <a href="#clients" className="block text-sm text-slate-700 hover:text-slate-900">
              Customers
            </a>
            <a href="#faq" className="block text-sm text-slate-700 hover:text-slate-900">
              FAQ
            </a>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Support
            </p>
            <Link to="/register" className="block text-sm text-slate-700 hover:text-slate-900">
              Create account
            </Link>
            <Link to="/login" className="block text-sm text-slate-700 hover:text-slate-900">
              Sign in
            </Link>
            <a
              href="mailto:support@fundbridge.com"
              className="block text-sm text-slate-700 hover:text-slate-900"
            >
              support@fundbridge.com
            </a>
          </div>
        </div>
        <p className="bg-white py-4 text-center text-xs font-semibold text-slate-500">
          &copy; {new Date().getFullYear()} FundBridge
        </p>
      </footer>
    </div>
  )
}

export default HomePage
