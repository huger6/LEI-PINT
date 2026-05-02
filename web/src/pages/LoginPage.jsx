import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import AuthCard from '../components/AuthCard';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import { useAuth } from '../hooks/useAuth';
import styles from './LoginPage.module.css';

const ERROR_MESSAGES = {
  AUTH_INVALID_CREDENTIALS: 'Invalid email/username or password.',
  AUTH_ACCOUNT_DEACTIVATED: 'This account has been deactivated.',
  AUTH_ACCOUNT_LOCKED: 'Too many failed attempts. Please try again later.',
  AUTH_RATE_LIMIT_LOGIN: 'Too many login attempts. Please wait before trying again.',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
    setEmailNotConfirmed(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    setEmailNotConfirmed(false);
    try {
      const fpc = await login(form.identifier, form.password, form.remember);
      navigate(fpc ? '/change-password' : '/', { replace: true });
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === 'AUTH_EMAIL_NOT_CONFIRMED') {
        setEmailNotConfirmed(true);
      } else {
        setError(ERROR_MESSAGES[code] ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.subtitle}>Sign in to your account</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FormInput
            id="identifier"
            name="identifier"
            label="Email or Username"
            type="text"
            placeholder="you@example.com"
            value={form.identifier}
            onChange={handleChange}
            autoComplete="username"
            autoFocus
          />

          <div className={styles.passwordField}>
            <FormInput
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.eyeToggle}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          <div className={styles.row}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className={styles.checkbox}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}

          {emailNotConfirmed && (
            <div className={styles.warningBanner} role="alert">
              Your email is not confirmed.{' '}
              <Link to="/resend-confirmation">Resend confirmation email</Link>
            </div>
          )}

          <FormButton type="submit" loading={loading}>
            Sign in
          </FormButton>
        </form>

        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link to="/register">Create one</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
