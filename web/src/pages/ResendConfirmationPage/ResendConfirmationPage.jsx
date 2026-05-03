import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, resendConfirmation } from '../../features/auth';
import FormInput from '../../components/FormInput/FormInput';
import FormButton from '../../components/FormButton/FormButton';
import styles from './ResendConfirmationPage.module.css';
import {
  useFormValidation,
  validateResendConfirmationForm,
  hasErrors,
  resolveErrorMessage,
  resolveErrorField,
  extractFieldErrors,
} from '../../validations';

const INITIAL = { email: '' };

export default function ResendConfirmationPage() {
  const form = useFormValidation({
    initialValues: INITIAL,
    validate: validateResendConfirmationForm,
  });
  const [loading, setLoading] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const fieldError = (name) =>
    form.getFieldProps(name).error ?? serverFieldErrors[name];

  const onChange = (e) => {
    form.handleChange(e);
    setServerFieldErrors({});
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
      await resendConfirmation(form.values.email.trim());
      setSent(true);
    } catch (err) {
      const backendFields = extractFieldErrors(err);
      if (Object.keys(backendFields).length) {
        setServerFieldErrors(backendFields);
        return;
      }
      const focusField = resolveErrorField(err);
      const message = resolveErrorMessage(err);
      if (focusField === 'email') setServerFieldErrors({ email: message });
      else setError(message);
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
              A new confirmation link has been sent to <strong>{form.values.email}</strong>. Check your
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
                {...form.getFieldProps('email')}
                onChange={onChange}
                id="email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                error={fieldError('email')}
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
