import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, StatusPanel, validateResetToken } from '../..';
import FormButton from '../../../../components/FormButton/FormButton';
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
                navigate(`/reset-password?token=${encoded}`, { replace: true });
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
                        <Link to="/forgot-password">
                            <FormButton type="button">{t('resetPassword.requestNewLink')}</FormButton>
                        </Link>
                        <Link to="/login">
                            <FormButton variant="ghost" type="button">{t('backToLogin')}</FormButton>
                        </Link>
                    </StatusPanel>
                )}
            </AuthCard>
        </AuthLayout>
    );
}

