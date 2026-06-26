import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AUTH } from '../../../../routes/paths';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, StatusPanel, validateResetToken } from '../..';
import Button from '../../../../components/Button/Button';
import { isCode, resolveErrorMessage } from '../../../../validations';

export default function ResetPasswordConfirmPage() {
    // Provides translation function for localised strings.
    const { t } = useTranslation();
    // Reads query parameters from the URL to extract the reset token.
    const [searchParams] = useSearchParams();
    // Provides programmatic navigation to the reset password form on valid token.
    const navigate = useNavigate();
    const token = searchParams.get('token');

    // Tracks the token validation status: 'loading' or 'error'.
    const [status, setStatus] = useState('loading');
    // Stores the error message to display when token validation fails.
    const [errorMsg, setErrorMsg] = useState('');
    // Guards against running the token validation API call more than once.
    const requestRef = useRef(false);

    // Validates the reset token on mount and navigates to the reset form if valid.
    useEffect(() => {
        if (requestRef.current) return;
        requestRef.current = true;

        if (!token) {
            setErrorMsg(t('resetPassword.noTokenFound'));
            setStatus('error');
            return;
        }

        validateResetToken(token)
            .then(() => {
                const encoded = encodeURIComponent(token);
                navigate(`${AUTH.RESET_PASSWORD}?token=${encoded}`, { replace: true });
            })
            .catch((err) => {
                if (isCode(err, 'AUTH_TOKEN_EXPIRED')) {
                    setErrorMsg(t('resetPassword.tokenExpired'));
                } else {
                    setErrorMsg(resolveErrorMessage(err));
                }
                setStatus('error');
            });
    }, [token, t, navigate]);

    return (
        <AuthLayout>
            <Helmet>
                <title>{t('resetPassword.title')}</title>
                <meta name="description" content={t('resetPassword.metaDescription')} />
            </Helmet>
            <AuthCard>
                {status === 'loading' && (
                    <StatusPanel
                        variant="loading"
                        message={t('resetPassword.validatingLink')}
                        loadingLabel={t('resetPassword.validatingLink')}
                    />
                )}

                {status === 'error' && (
                    <StatusPanel
                        variant="error"
                        title={t('resetPassword.invalidOrExpired')}
                        message={errorMsg || t('resetPassword.invalidOrExpiredDesc')}
                    >
                        <Button as={Link} to={AUTH.FORGOT_PASSWORD} fullWidth>
                            {t('resetPassword.requestNewLink')}
                        </Button>
                        <Button as={Link} to={AUTH.LOGIN} variant="outlined" fullWidth>
                            {t('backToLogin')}
                        </Button>
                    </StatusPanel>
                )}
            </AuthCard>
        </AuthLayout>
    );
}

