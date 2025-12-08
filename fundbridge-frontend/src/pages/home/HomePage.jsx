import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../../api/client'
import Loader from '../../components/common/Loader'
import './HomePage.css'

const HomePage = () => {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  const fetchHomeContent = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await client.get('/public/home', {
        withCredentials: false, // public endpoint rejects credentialed requests in local dev
      })
      if (isMountedRef.current) {
        setContent(data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Unable to load homepage content right now.'
        setError(message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    fetchHomeContent()
    return () => {
      isMountedRef.current = false
    }
  }, [fetchHomeContent])

  const { hero, features = [], steps = [], stats = [], testimonials = [], partners = [], cta } =
    content || {}

  return (
    <div className="home-page">
      <header className="landing-nav">
        <div className="home-container nav-container">
          <Link to="/" className="brand-logo">
            FundBridge
          </Link>
          <nav className="nav-links">
            <a href="#features">Solutions</a>
            <a href="#process">How it works</a>
            <a href="#clients">Customers</a>
          </nav>
          <div className="nav-actions">
            <Link to="/login" className="nav-link">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary nav-cta">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {loading ? (
          <div className="home-container home-loading-state">
            <Loader />
          </div>
        ) : error ? (
          <div className="home-container home-error-state">
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={fetchHomeContent}>
              Try again
            </button>
          </div>
        ) : (
          content && (
            <>
              <section className="hero-section">
                <div className="home-container hero-grid">
                  <div className="hero-copy">
                    <p className="eyebrow">{hero?.eyebrow}</p>
                    <h1>{hero?.title}</h1>
                    <p className="lede">{hero?.lede}</p>
                    <div className="hero-actions">
                      <Link to="/register" className="btn btn-primary">
                        Open a borrower account
                      </Link>
                      <Link to="/login" className="btn btn-secondary">
                        Explore dashboard
                      </Link>
                    </div>
                    <div className="hero-metrics">
                      {hero?.metrics?.map((metric) => (
                        <div key={metric.label}>
                          <span className="metric-value">{metric.value}</span>
                          <span className="metric-label">{metric.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="hero-card">
                    <div className="card-header">
                      <span>{hero?.cardTitle}</span>
                      <span className="pill success">{hero?.cardStatus}</span>
                    </div>
                    <ul className="pipeline-list">
                      {hero?.pipeline?.map((item) => (
                        <li key={item.title}>
                          <div>
                            <p className="pipeline-title">{item.title}</p>
                            <p className="pipeline-meta">{item.meta}</p>
                          </div>
                          <span className={`badge ${item.statusStyle}`}>
                            {item.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="card-footer">
                      <p>Wallet balance</p>
                      <strong>{hero?.walletBalance}</strong>
                    </div>
                  </div>
                </div>
              </section>

              <section className="partner-strip">
                <div className="home-container partner-grid">
                  {partners.map((partner) => (
                    <span key={partner}>{partner}</span>
                  ))}
                </div>
              </section>

              <section id="features" className="section">
                <div className="home-container">
                  <div className="section-heading">
                    <p className="eyebrow">Built for clarity</p>
                    <h2>Everything you need to run a responsible lending program.</h2>
                    <p>
                      Deploy capital, manage lifecycle events, and keep borrowers engaged with workflow
                      automation that feels delightful.
                    </p>
                  </div>
                  <div className="feature-grid">
                    {features.map((feature) => (
                      <article key={feature.title} className="feature-card">
                        <span className="feature-badge">{feature.badge}</span>
                        <h3>{feature.title}</h3>
                        <p>{feature.description}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <section className="section muted-section" id="process">
                <div className="home-container steps-grid">
                  <div>
                    <p className="eyebrow">From onboarding to repayment</p>
                    <h2>Launch a digital branch in three simple moves.</h2>
                    <p>
                      Each workflow is packaged with templated checklists, notifications, and analytics
                      so your team has zero guesswork.
                    </p>
                  </div>
                  <ol className="step-list">
                    {steps.map((step, index) => (
                      <li key={step.title}>
                        <span className="step-number">{index + 1}</span>
                        <div>
                          <h3>{step.title}</h3>
                          <p>{step.copy}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              <section className="section">
                <div className="home-container stats-grid">
                  {stats.map((stat) => (
                    <article key={stat.label} className={`stat-card ${stat.accent}`.trim()}>
                      <span>{stat.label}</span>
                      <strong>{stat.value}</strong>
                    </article>
                  ))}
                </div>
              </section>

              <section id="clients" className="section">
                <div className="home-container testimonial-section">
                  <div className="section-heading">
                    <p className="eyebrow">Trusted voices</p>
                    <h2>Lenders across Africa rely on FundBridge.</h2>
                    <p>
                      From microfinance institutions to specialised credit partners, our tooling powers
                      dependable borrower journeys.
                    </p>
                  </div>
                  <div className="testimonial-grid">
                    {testimonials.map((testimonial) => (
                      <blockquote key={testimonial.author}>
                        <p>&ldquo;{testimonial.quote}&rdquo;</p>
                        <footer>
                          <strong>{testimonial.author}</strong>
                          <span>{testimonial.role}</span>
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                </div>
              </section>

              <section className="cta-section">
                <div className="home-container cta-card">
                  <div>
                    <p className="eyebrow">{cta?.eyebrow}</p>
                    <h2>{cta?.heading}</h2>
                    <p>{cta?.copy}</p>
                  </div>
                  <div className="cta-actions">
                    <Link to="/register" className="btn btn-primary">
                      Create free account
                    </Link>
                    <Link to="/login" className="btn btn-ghost">
                      I already have one
                    </Link>
                  </div>
                </div>
              </section>
            </>
          )
        )}
      </main>

      <footer className="landing-footer">
        <div className="home-container footer-grid">
          <div>
            <h4>FundBridge</h4>
            <p>Responsible financing infrastructure for modern lenders.</p>
          </div>
          <div>
            <p className="footer-heading">Platform</p>
            <a href="#features">Features</a>
            <a href="#process">Automation</a>
            <a href="#clients">Customers</a>
          </div>
          <div>
            <p className="footer-heading">Support</p>
            <Link to="/register">Create account</Link>
            <Link to="/login">Sign in</Link>
            <a href="mailto:support@fundbridge.com">support@fundbridge.com</a>
          </div>
        </div>
        <p className="footer-meta">&copy; {new Date().getFullYear()} FundBridge</p>
      </footer>
    </div>
  )
}

export default HomePage
