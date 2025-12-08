import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import { validateLogin } from '../../utils/validators';

const initialState = { email: '', password: '' };

const LoginForm = ({ onSubmit, loading }) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const handleChange = (event) => {
    setValues((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateLogin(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setFormError('');
      await onSubmit(values);
    } catch (error) {
      setFormError(error?.response?.data?.message || 'Unable to login');
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h2>Welcome Back</h2>
      {formError && <p className="form-error">{formError}</p>}
      <label htmlFor="email">
        Email
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          placeholder="you@email.com"
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </label>
      <label htmlFor="password">
        Password
        <input
          id="password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          placeholder="********"
        />
        {errors.password && (
          <span className="field-error">{errors.password}</span>
        )}
      </label>

      <Button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Login'}
      </Button>
    </form>
  );
};

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default LoginForm;
