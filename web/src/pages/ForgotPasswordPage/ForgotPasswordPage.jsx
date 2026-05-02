import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, forgotPassword } from '../../features/auth';
import FormInput from '../../components/FormInput/FormInput';
import FormButton from '../../components/FormButton/FormButton';
import styles from './ForgotPasswordPage.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === 'AUTH_RATE_LIMIT_FORGOT_PASSWORD') {
        setError('Too many requests. Please wait an hour before trying again.');
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
        {sent ? (
          <div className={styles.sentState}>
            <div className={styles.sentIcon}>✉</div>
            <h2 className={styles.title}>Check your inbox</h2>
            <p className={styles.body}>
              If an account exists for <strong>{email}</strong>, you will receive a
              password reset link shortly.
            </p>
            <Link to="/login" className={styles.backLink}>Back to login</Link>
          </div>
        ) : (
          <>
            <h2 className={styles.title}>Forgot password?</h2>
            <p className={styles.subtitle}>
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <FormInput
                id="email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoFocus
              />
              {error && <div className={styles.errorBanner} role="alert">{error}</div>}
              <FormButton type="submit" loading={loading}>Send reset link</FormButton>
            </form>
            <p className={styles.footer}>
              <Link to="/login">← Back to login</Link>
            </p>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
