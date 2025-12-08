import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import { validateRegister } from '../../utils/validators';

const initialState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const RegisterForm = ({ onSubmit, loading }) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateRegister(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    try {
      setFormError('');
      await onSubmit(values);
    } catch (error) {
      setFormError(error?.response?.data?.message || 'Unable to register');
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h2>Create Account</h2>
      {formError && <p className="form-error">{formError}</p>}
      <label htmlFor="name">
        Full Name
        <input
          id="name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          placeholder="Jane Doe"
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </label>

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

      <label htmlFor="confirmPassword">
        Confirm Password
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={values.confirmPassword}
          onChange={handleChange}
          placeholder="********"
        />
        {errors.confirmPassword && (
          <span className="field-error">{errors.confirmPassword}</span>
        )}
      </label>

      <Button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Register'}
      </Button>
    </form>
  );
};

RegisterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default RegisterForm;
