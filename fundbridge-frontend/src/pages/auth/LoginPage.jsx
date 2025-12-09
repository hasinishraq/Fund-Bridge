import { Navigate, Link, useLocation } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-hero">
          <span className="brand-badge">FundBridge</span>
          <h1>Banking for the modern era</h1>
          <p>
            Monitor wallets, manage loans, and collaborate with your team in a single,
            enterprise-grade workspace built for financial operations.
          </p>
          <ul className="auth-hero-list">
            <li>
              <span>01</span>
              Bank-level authentication safeguards every session.
            </li>
            <li>
              <span>02</span>
              Real-time visibility into balances, loans, and repayments.
            </li>
            <li>
              <span>03</span>
              Guided onboarding and 24/7 support for your team.
            </li>
          </ul>
          <div className="auth-hero-metrics">
            <article>
              <p>Platform uptime</p>
              <strong>99.98%</strong>
              <span>Monitored in real time</span>
            </article>
            <article>
              <p>Capital processed</p>
              <strong>$4.2B+</strong>
              <span>Across regulated markets</span>
            </article>
          </div>
          <div className="auth-hero-logos">
            <span>Trusted by teams at</span>
            <div className="logo-row">
              <span>Northwind</span>
              <span>Helios</span>
              <span>NovaPay</span>
              <span>Starlane</span>
            </div>
          </div>
        </div>
        <div className="auth-panel">
          <div className="auth-panel-card">
            <p className="auth-panel-subtitle">Sign in to continue</p>
            <LoginForm onSubmit={login} loading={loading} />
            <p className="auth-switch">
              Need an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
