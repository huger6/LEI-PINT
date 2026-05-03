import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, resendConfirmation } from '../../features/auth';
import FormInput from '../../components/FormInput/FormInput';
import FormButton from '../../components/FormButton/FormButton';
import styles from './ResendConfirmationPage.module.css';

export default function ResendConfirmationPage() {
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
      await resendConfirmation(email);
      setSent(true);
    } catch (err) {
      const code = err?.response?.data?.code;
      const retryAfter = err?.response?.data?.data?.retryAfter;
      if (code === 'AUTH_RESEND_RATE_LIMITED') {
        setError(
          retryAfter
            ? `Please wait ${retryAfter} seconds before requesting another email.`
            : 'Please wait a moment before requesting another email.'
        );
      } else {
        setError('Failed to send email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Helmet>
        <title>Resend Confirmation — LEI-PINT</title>
        <meta name="description" content="Request a new confirmation email for your LEI-PINT account." />
      </Helmet>
      <AuthCard>
        {sent ? (
          <div className="d-flex flex-column align-items-center gap-3 py-2 text-center">
            <div className={styles.sentIcon}>✉</div>
            <h2 className={`mb-0 ${styles.title}`}>Email sent!</h2>
            <p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.55 }}>
              A new confirmation link has been sent to <strong>{email}</strong>. Check your
              inbox and spam folder.
            </p>
            <Link to="/login" className="small" style={{ color: 'var(--color-primary)' }}>Back to login</Link>
          </div>
        ) : (
          <>
            <h2 className={`text-center mb-1 ${styles.title}`}>Resend confirmation</h2>
            <p className="text-center mb-4 small" style={{ color: 'var(--color-outline)' }}>
              Enter your email and we&apos;ll send a new confirmation link.
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
              <FormButton type="submit" loading={loading}>Resend email</FormButton>
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
