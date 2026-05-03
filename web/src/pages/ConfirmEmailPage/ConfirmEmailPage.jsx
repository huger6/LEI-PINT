import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, confirmEmail } from '../../features/auth';
import FormButton from '../../components/FormButton/FormButton';
import styles from './ConfirmEmailPage.module.css';

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('No confirmation token found in the link.');
      setStatus('error');
      return;
    }
    confirmEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        const code = err?.response?.data?.code;
        if (code === 'AUTH_TOKEN_EXPIRED') {
          setErrorMsg('This confirmation link has expired.');
        } else {
          setErrorMsg('This confirmation link is invalid or has already been used.');
        }
        setStatus('error');
      });
  }, [token]);

  return (
    <AuthLayout>
      <Helmet>
        <title>Confirm Email — LEI-PINT</title>
        <meta name="description" content="Confirming your LEI-PINT email address." />
      </Helmet>
      <AuthCard>
        {status === 'loading' && (
          <div className="d-flex flex-column align-items-center gap-3 py-3 text-center">
            <div className={styles.spinner} role="status" aria-label="Confirming email…" />
            <p className="mb-0 small" style={{ color: 'var(--color-outline)' }}>Confirming your email address…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="d-flex flex-column align-items-center gap-3 py-3 text-center">
            <div className={styles.successIcon}>✓</div>
            <h2 className={`mb-0 ${styles.title}`}>Email confirmed!</h2>
            <p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.5 }}>Your account is now active. You can sign in.</p>
            <Link to="/login">
              <FormButton type="button">Go to login</FormButton>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="d-flex flex-column align-items-center gap-3 py-3 text-center">
            <div className={styles.errorIcon}>✕</div>
            <h2 className={`mb-0 ${styles.title}`}>Confirmation failed</h2>
            <p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.5 }}>{errorMsg}</p>
            <Link to="/resend-confirmation">
              <FormButton type="button">Resend confirmation email</FormButton>
            </Link>
            <Link to="/login" className="small" style={{ color: 'var(--color-primary)' }}>Back to login</Link>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
