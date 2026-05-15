import { AUTH } from '../../routes/paths';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import ResetPasswordConfirmPage from './pages/ResetPasswordConfirmPage/ResetPasswordConfirmPage';
import ConfirmEmailPage from './pages/ConfirmEmailPage/ConfirmEmailPage';
import ResendConfirmationPage from './pages/ResendConfirmationPage/ResendConfirmationPage';
import ChangePasswordPage from './pages/ChangePasswordPage/ChangePasswordPage';

export const authPublicRoutes = [
	{ path: AUTH.LOGIN, element: <LoginPage /> },
	{ path: AUTH.REGISTER, element: <RegisterPage /> },
];

export const authOpenRoutes = [
	{ path: AUTH.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
	{ path: AUTH.RESET_PASSWORD_CONFIRM, element: <ResetPasswordConfirmPage /> },
	{ path: AUTH.RESET_PASSWORD, element: <ResetPasswordPage /> },
	{ path: AUTH.CONFIRM_EMAIL, element: <ConfirmEmailPage /> },
	{ path: AUTH.RESEND_CONFIRMATION, element: <ResendConfirmationPage /> },
];

export const authFpcRoutes = [
	{ path: AUTH.CHANGE_PASSWORD, element: <ChangePasswordPage /> },
];
