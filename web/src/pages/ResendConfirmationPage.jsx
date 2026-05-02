import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import AuthCard from '../components/AuthCard';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import { resendConfirmation } from '../api/auth.js';
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
      <AuthCard>
        {sent ? (
          <div className={styles.sentState}>
            <div className={styles.sentIcon}>✉</div>
            <h2 className={styles.title}>Email sent!</h2>
            <p className={styles.body}>
              A new confirmation link has been sent to <strong>{email}</strong>. Check your
              inbox and spam folder.
            </p>
            <Link to="/login" className={styles.backLink}>Back to login</Link>
          </div>
        ) : (
          <>
            <h2 className={styles.title}>Resend confirmation</h2>
            <p className={styles.subtitle}>
              Enter your email and we&apos;ll send a new confirmation link.
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
              <FormButton type="submit" loading={loading}>Resend email</FormButton>
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
