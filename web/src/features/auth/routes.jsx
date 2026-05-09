import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import ResetPasswordConfirmPage from './pages/ResetPasswordConfirmPage/ResetPasswordConfirmPage';
import ConfirmEmailPage from './pages/ConfirmEmailPage/ConfirmEmailPage';
import ResendConfirmationPage from './pages/ResendConfirmationPage/ResendConfirmationPage';
import ChangePasswordPage from './pages/ChangePasswordPage/ChangePasswordPage';

export const authPublicRoutes = [
	{ path: '/login', element: <LoginPage /> },
	{ path: '/register', element: <RegisterPage /> },
];

export const authOpenRoutes = [
	{ path: '/forgot-password', element: <ForgotPasswordPage /> },
	{ path: '/reset-password/confirm', element: <ResetPasswordConfirmPage /> },
	{ path: '/reset-password', element: <ResetPasswordPage /> },
	{ path: '/confirm-email', element: <ConfirmEmailPage /> },
	{ path: '/resend-confirmation', element: <ResendConfirmationPage /> },
];

export const authFpcRoutes = [
	{ path: '/change-password', element: <ChangePasswordPage /> },
];
