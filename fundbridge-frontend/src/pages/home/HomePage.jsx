import { Link } from 'react-router-dom'
import homeContent from './homeContent'

const HomePage = () => {
  const { hero, features = [], steps = [], stats = [], testimonials = [], partners = [], cta } =
    homeContent

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
        <section className="grid items-center gap-10 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl md:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              {hero?.eyebrow}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {hero?.title}
            </h1>
            <p className="text-lg text-slate-600">{hero?.lede}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                Open a borrower account
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-[1px] hover:border-indigo-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                Explore dashboard
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {hero?.metrics?.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
                  <p className="text-lg font-semibold text-slate-900">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>{hero?.cardTitle}</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
                {hero?.cardStatus}
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {hero?.pipeline?.map((item) => (
                <li
                  key={item.title}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.meta}</p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Wallet balance
              </p>
              <p className="text-xl font-semibold text-slate-900">{hero?.walletBalance}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Trusted by teams
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
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

        <section id="clients" className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Trusted voices
            </p>
            <h2 className="text-2xl font-bold text-slate-900">
              Lenders across Africa rely on FundBridge.
            </h2>
            <p className="text-slate-600">
              Microfinance teams and specialised credit partners use us to keep borrowers engaged.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <blockquote
                key={testimonial.author}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
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
