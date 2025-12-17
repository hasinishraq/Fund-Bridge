import { Link, Navigate } from 'react-router-dom';
import RegisterForm from '../../components/auth/RegisterForm';
import { useAuth } from '../../context/AuthContext';
import { getRoleHomePath } from '../../utils/constants';

const RegisterPage = () => {
  const { register, isAuthenticated, loading, user } = useAuth();
  const destination = getRoleHomePath(user?.role);

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-hero">
          <span className="brand-badge">FundBridge</span>
          <h1>Confidently onboard your next chapter</h1>
          <p>
            Unlock loan workflows, payments, and wallet management across your organization with
            frictionless onboarding tailored for growth teams.
          </p>
          <ul className="auth-hero-list">
            <li>
              <span>01</span>
              Guided verification gets you production-ready in minutes.
            </li>
            <li>
              <span>02</span>
              Granular access controls keep sensitive accounts safe.
            </li>
            <li>
              <span>03</span>
              Powerful analytics uncover actionable capital insights.
            </li>
          </ul>
          <div className="auth-hero-metrics">
            <article>
              <p>Teams onboarded</p>
              <strong>3,200+</strong>
              <span>Across lending, payments & ops</span>
            </article>
            <article>
              <p>Approval speed</p>
              <strong>7x faster</strong>
              <span>With automated compliance checks</span>
            </article>
          </div>
          <div className="auth-hero-logos">
            <span>Trusted by teams at</span>
            <div className="logo-row">
              <span>Apex</span>
              <span>Summit</span>
              <span>BluePeak</span>
              <span>Lumen</span>
            </div>
          </div>
        </div>
        <div className="auth-panel">
          <div className="auth-panel-card">
            <p className="auth-panel-subtitle">Create your FundBridge account</p>
            <RegisterForm onSubmit={register} loading={loading} />
            <p className="auth-switch">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;
