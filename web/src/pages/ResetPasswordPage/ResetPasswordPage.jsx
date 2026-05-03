import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, validateResetToken, resetPassword } from '../../features/auth';
import FormInput from '../../components/FormInput/FormInput';
import FormButton from '../../components/FormButton/FormButton';
import styles from './ResetPasswordPage.module.css';
import {
  PASSWORD_RULES,
  useFormValidation,
  validateResetPasswordForm,
  hasErrors,
  resolveErrorMessage,
  resolveErrorField,
  extractFieldErrors,
  isCode,
} from '../../validations';

const INITIAL = { newPassword: '', confirmPassword: '' };

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const form = useFormValidation({
    initialValues: INITIAL,
    validate: validateResetPasswordForm,
  });

  const [tokenStatus, setTokenStatus] = useState('loading');
  const [tokenErrorMsg, setTokenErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenErrorMsg('No reset token found in the link.');
      setTokenStatus('invalid');
      return;
    }
    validateResetToken(token)
      .then(() => setTokenStatus('valid'))
      .catch((err) => {
        if (isCode(err, 'AUTH_TOKEN_EXPIRED')) {
          setTokenErrorMsg('This reset link has expired. Please request a new one.');
        } else {
          setTokenErrorMsg(resolveErrorMessage(err));
        }
        setTokenStatus('invalid');
      });
  }, [token]);

  const fieldError = (name) =>
    form.getFieldProps(name).error ?? serverFieldErrors[name];

  const onChange = (e) => {
    form.handleChange(e);
    setServerFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    form.markAllTouched();
    if (hasErrors(form.errors)) return;

    setLoading(true);
    setError('');
    setServerFieldErrors({});
    try {
      await resetPassword(token, form.values.newPassword);
      setSuccess(true);
    } catch (err) {
      if (isCode(err, 'AUTH_TOKEN_EXPIRED') || isCode(err, 'AUTH_TOKEN_INVALID_OR_USED')) {
        setTokenErrorMsg(resolveErrorMessage(err));
        setTokenStatus('invalid');
        return;
      }
      const backendFields = extractFieldErrors(err);
      if (Object.keys(backendFields).length) {
        setServerFieldErrors(backendFields);
        return;
      }
      const focusField = resolveErrorField(err);
      const message = resolveErrorMessage(err);
      if (focusField) setServerFieldErrors({ [focusField]: message });
      else setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Helmet>
        <title>Reset Password — LEI-PINT</title>
        <meta name="description" content="Choose a new password for your LEI-PINT account." />
      </Helmet>
      <AuthCard>
        {tokenStatus === 'loading' && (
          <div className="d-flex flex-column align-items-center gap-3 py-3 text-center">
            <div className={styles.spinner} aria-label="Validating link…" />
            <p className="mb-0 small" style={{ color: 'var(--color-outline)' }}>Validating your reset link…</p>
          </div>
        )}

        {tokenStatus === 'invalid' && (
          <div className="d-flex flex-column align-items-center gap-3 py-3 text-center">
            <div className={styles.errorIcon}>✕</div>
            <h2 className={`mb-0 ${styles.title}`}>Invalid or expired link</h2>
            <p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.5 }}>
              {tokenErrorMsg || 'This password reset link is invalid or has already been used.'}
            </p>
            <Link to="/forgot-password">
              <FormButton type="button">Request a new link</FormButton>
            </Link>
          </div>
        )}

        {tokenStatus === 'valid' && !success && (
          <>
            <h2 className={`text-center mb-1 ${styles.title}`}>Reset your password</h2>
            <p className="text-center mb-4 small" style={{ color: 'var(--color-outline)' }}>Choose a strong new password.</p>
            <form onSubmit={handleSubmit} className="vstack gap-3" noValidate>
              <div className="position-relative">
                <FormInput
                  {...form.getFieldProps('newPassword')}
                  onChange={onChange}
                  id="newPassword"
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={fieldError('newPassword')}
                  autoFocus
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>

              {form.values.newPassword && (
                <ul className={`list-unstyled vstack gap-1 py-2 px-3 mb-0 rounded ${styles.pwRules}`}>
                  {PASSWORD_RULES.map((rule) => (
                    <li
                      key={rule.label}
                      className={`${styles.pwRule} ${rule.test(form.values.newPassword) ? styles.pwRuleOk : ''}`}
                    >
                      {rule.test(form.values.newPassword) ? '✓' : '○'} {rule.label}
                    </li>
                  ))}
                </ul>
              )}

              <FormInput
                {...form.getFieldProps('confirmPassword')}
                onChange={onChange}
                id="confirmPassword"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={fieldError('confirmPassword')}
              />

              {error && <div className="alert alert-danger py-2 px-3 mb-0 small" role="alert">{error}</div>}

              <FormButton type="submit" loading={loading}>Reset password</FormButton>
            </form>
          </>
        )}

        {success && (
          <div className="d-flex flex-column align-items-center gap-3 py-3 text-center">
            <div className={styles.successIcon}>✓</div>
            <h2 className={`mb-0 ${styles.title}`}>Password reset!</h2>
            <p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.5 }}>You can now sign in with your new password.</p>
            <Link to="/login">
              <FormButton type="button">Go to login</FormButton>
            </Link>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
