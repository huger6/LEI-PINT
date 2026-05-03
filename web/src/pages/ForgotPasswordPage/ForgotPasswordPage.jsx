import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
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
      <Helmet>
        <title>Forgot Password — LEI-PINT</title>
        <meta name="description" content="Reset your LEI-PINT password. Enter your email to receive a reset link." />
      </Helmet>
      <AuthCard>
        {sent ? (
          <div className="d-flex flex-column align-items-center gap-3 py-2 text-center">
            <div className={styles.sentIcon}>✉</div>
            <h2 className={`mb-0 ${styles.title}`}>Check your inbox</h2>
            <p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.55 }}>
              If an account exists for <strong>{email}</strong>, you will receive a
              password reset link shortly.
            </p>
            <Link to="/login" className="small" style={{ color: 'var(--color-primary)' }}>Back to login</Link>
          </div>
        ) : (
          <>
            <h2 className={`text-center mb-1 ${styles.title}`}>Forgot password?</h2>
            <p className="text-center mb-4 small" style={{ color: 'var(--color-outline)' }}>
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="vstack gap-3" noValidate>
              <FormInput
                id="email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoFocus
              />
              {error && <div className="alert alert-danger py-2 px-3 mb-0 small" role="alert">{error}</div>}
              <FormButton type="submit" loading={loading}>Send reset link</FormButton>
            </form>
            <p className="text-center mt-4 mb-0 small">
              <Link to="/login">← Back to login</Link>
            </p>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
