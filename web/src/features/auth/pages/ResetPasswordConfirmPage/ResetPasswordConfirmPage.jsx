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
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const requestRef = useRef(false);

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

