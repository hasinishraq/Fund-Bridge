import { Link } from 'react-router-dom'
import homeContent from './homeContent'

const HomePage = () => {
  const { hero, features = [], steps = [], stats = [], testimonials = [], cta } = homeContent
  const heroImage = hero?.image
  const heroImageAlt = hero?.imageAlt || 'FundBridge hero background.'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight text-indigo-700">
            FundBridge
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">
              Solutions
            </a>
            <a href="#process" className="hover:text-slate-900">
              How it works
            </a>
            <a href="#clients" className="hover:text-slate-900">
              Customers
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 space-y-16">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-xl">
          <div
            className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 md:hidden"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-[70%] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 md:block"
            style={{ clipPath: 'polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%)' }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-[45%] z-10 hidden w-[28%] bg-blue-900/60 md:block"
            style={{ clipPath: 'polygon(0 0, 68% 0, 100% 50%, 68% 100%, 0 100%)' }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-[52%] z-10 hidden w-[18%] border border-blue-300/70 md:block"
            style={{ clipPath: 'polygon(0 0, 68% 0, 100% 50%, 68% 100%, 0 100%)' }}
            aria-hidden="true"
          />
          <div className="relative grid gap-8 md:grid-cols-[1.05fr,0.95fr]">
            <div className="relative z-20 space-y-5 p-8 text-white">
              <p className="text-xs font-semibold tracking-[0.18em] text-blue-100">
                {hero?.eyebrow}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {hero?.title}
              </h1>
              <p className="text-lg text-blue-100/80">{hero?.lede}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-[1px] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/60"
                >
                  Open a borrower account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-xl border border-white/40 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-[1px] hover:border-white/70 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  Explore dashboard
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {hero?.metrics?.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3"
                  >
                    <p className="text-xs font-semibold text-blue-100/80">{metric.label}</p>
                    <p className="text-lg font-semibold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[260px] md:min-h-[360px]">
              <img
                src={heroImage}
                alt={heroImageAlt}
                className="h-full w-full object-cover"
                loading="eager"
              />
              <div
                className="absolute inset-0 bg-gradient-to-l from-slate-900/50 via-transparent to-transparent"
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        <section id="features" className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Built for clarity
            </p>
            <h2 className="text-2xl font-bold text-slate-900">
              Everything you need to run a responsible lending program
            </h2>
            <p className="text-slate-600">
              Deploy capital, manage lifecycle events, and keep borrowers engaged with effortless
              workflows.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                  {feature.badge}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="process" className="grid gap-8 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm md:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              From onboarding to repayment
            </p>
            <h2 className="text-2xl font-bold text-slate-900">
              Launch a digital branch in three simple moves.
            </h2>
            <p className="text-slate-600">
              Prebuilt steps keep your team aligned while automation handles the busywork.
            </p>
          </div>
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
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

        <section className="grid gap-4 sm:grid-cols-2">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="text-sm font-semibold text-slate-500">{stat.label}</span>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
            </article>
          ))}
        </section>


        <section className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-indigo-50 p-8 shadow-lg">
          <div className="grid items-center gap-6 md:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                {cta?.eyebrow}
              </p>
              <h2 className="text-2xl font-bold text-slate-900">{cta?.heading}</h2>
              <p className="text-slate-600">{cta?.copy}</p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                Create free account
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-[1px] hover:border-indigo-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                I already have one
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-900">FundBridge</h4>
            <p className="text-sm text-slate-600">
              Responsible financing infrastructure for modern lenders.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              Platform
            </p>
            <a href="#features" className="block text-sm text-slate-700 hover:text-indigo-700">
              Features
            </a>
            <a href="#process" className="block text-sm text-slate-700 hover:text-indigo-700">
              Automation
            </a>
            <a href="#clients" className="block text-sm text-slate-700 hover:text-indigo-700">
              Customers
            </a>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              Support
            </p>
            <Link to="/register" className="block text-sm text-slate-700 hover:text-indigo-700">
              Create account
            </Link>
            <Link to="/login" className="block text-sm text-slate-700 hover:text-indigo-700">
              Sign in
            </Link>
            <a
              href="mailto:support@fundbridge.com"
              className="block text-sm text-slate-700 hover:text-indigo-700"
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
