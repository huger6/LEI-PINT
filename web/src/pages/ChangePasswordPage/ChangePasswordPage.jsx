import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, useAuth, changePassword } from '../../features/auth';
import FormInput from '../../components/FormInput/FormInput';
import FormButton from '../../components/FormButton/FormButton';
import styles from './ChangePasswordPage.module.css';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'One digit', test: (v) => /\d/.test(v) },
  { label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export default function ChangePasswordPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (PASSWORD_RULES.some((r) => !r.test(form.newPassword))) {
      setError('New password does not meet all requirements.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setSuccess(true);
      setTimeout(async () => {
        await logout();
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === 'AUTH_CURRENT_PASSWORD_WRONG') {
        setError('Current password is incorrect.');
      } else if (code === 'AUTH_PASSWORD_SAME_AS_CURRENT') {
        setError('New password must be different from the current one.');
      } else if (code === 'AUTH_PASSWORD_WEAK') {
        setError('Password does not meet security requirements.');
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
        {success ? (
          <div className="d-flex flex-column align-items-center gap-3 py-4 text-center">
            <div className={styles.successIcon}>✓</div>
            <h2 className={`mb-0 ${styles.title}`}>Password changed!</h2>
            <p className="mb-0 small" style={{ color: 'var(--color-outline)' }}>Redirecting you to login…</p>
          </div>
        ) : (
          <>
            <h2 className={`text-center mb-1 ${styles.title}`}>Change your password</h2>
            <p className="text-center mb-4 small" style={{ color: 'var(--color-outline)' }}>
              You are required to set a new password before continuing.
            </p>
            <form onSubmit={handleSubmit} className="vstack gap-3" noValidate>
              <div className="position-relative">
                <FormInput
                  id="currentPassword"
                  name="currentPassword"
                  label="Current Password"
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.currentPassword}
                  onChange={handleChange}
                  autoFocus
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowCurrent((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showCurrent ? '🙈' : '👁'}
                </button>
              </div>

              <div className="position-relative">
                <FormInput
                  id="newPassword"
                  name="newPassword"
                  label="New Password"
                  type={showNew ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowNew((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showNew ? '🙈' : '👁'}
                </button>
              </div>

              {form.newPassword && (
                <ul className={`list-unstyled vstack gap-1 py-2 px-3 mb-0 rounded ${styles.pwRules}`}>
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
                label="Confirm New Password"
                type={showNew ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />

              {error && <div className="alert alert-danger py-2 px-3 mb-0 small" role="alert">{error}</div>}

              <FormButton type="submit" loading={loading}>Change password</FormButton>
            </form>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
