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
      <div className="auth-card">
        <LoginForm onSubmit={login} loading={loading} />
        <p className="auth-switch">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;
