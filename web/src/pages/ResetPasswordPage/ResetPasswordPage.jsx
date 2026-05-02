import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, validateResetToken, resetPassword } from '../../features/auth';
import FormInput from '../../components/FormInput/FormInput';
import FormButton from '../../components/FormButton/FormButton';
import styles from './ResetPasswordPage.module.css';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'One digit', test: (v) => /\d/.test(v) },
  { label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [tokenStatus, setTokenStatus] = useState('loading'); // 'loading' | 'valid' | 'invalid'
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) { setTokenStatus('invalid'); return; }
    validateResetToken(token)
      .then(() => setTokenStatus('valid'))
      .catch(() => setTokenStatus('invalid'));
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (PASSWORD_RULES.some((r) => !r.test(form.newPassword))) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(token, form.newPassword);
      setSuccess(true);
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === 'AUTH_TOKEN_EXPIRED') {
        setError('This reset link has expired. Please request a new one.');
      } else if (code === 'AUTH_TOKEN_INVALID_OR_USED') {
        setError('This link is invalid or has already been used.');
      } else if (code === 'AUTH_PASSWORD_WEAK') {
        setError('Password does not meet the security requirements.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        {tokenStatus === 'loading' && (
          <div className={styles.centerState}>
            <div className={styles.spinner} aria-label="Validating link…" />
            <p className={styles.hint}>Validating your reset link…</p>
          </div>
        )}

        {tokenStatus === 'invalid' && (
          <div className={styles.centerState}>
            <div className={styles.errorIcon}>✕</div>
            <h2 className={styles.title}>Invalid or expired link</h2>
            <p className={styles.hint}>
              This password reset link is invalid or has already been used.
            </p>
            <Link to="/forgot-password">
              <FormButton type="button">Request a new link</FormButton>
            </Link>
          </div>
        )}

        {tokenStatus === 'valid' && !success && (
          <>
            <h2 className={styles.title}>Reset your password</h2>
            <p className={styles.subtitle}>Choose a strong new password.</p>
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.passwordField}>
                <FormInput
                  id="newPassword"
                  name="newPassword"
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.newPassword}
                  onChange={handleChange}
                  autoFocus
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>

              {form.newPassword && (
                <ul className={styles.pwRules}>
                  {PASSWORD_RULES.map((rule) => (
                    <li
                      key={rule.label}
                      className={`${styles.pwRule} ${rule.test(form.newPassword) ? styles.pwRuleOk : ''}`}
                    >
                      {rule.test(form.newPassword) ? '✓' : '○'} {rule.label}
                    </li>
                  ))}
                </ul>
              )}

              <FormInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
              />

              {error && <div className={styles.errorBanner} role="alert">{error}</div>}

              <FormButton type="submit" loading={loading}>Reset password</FormButton>
            </form>
          </>
        )}

        {success && (
          <div className={styles.centerState}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.title}>Password reset!</h2>
            <p className={styles.hint}>You can now sign in with your new password.</p>
            <Link to="/login">
              <FormButton type="button">Go to login</FormButton>
            </Link>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
