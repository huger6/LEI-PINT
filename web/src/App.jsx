import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import ConfirmEmailPage from './pages/ConfirmEmailPage/ConfirmEmailPage';
import ResendConfirmationPage from './pages/ResendConfirmationPage/ResendConfirmationPage';
import ChangePasswordPage from './pages/ChangePasswordPage/ChangePasswordPage';
import styles from './assets/styles/componentes/App.module.css';

function LoadingScreen() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingSpinner} aria-label="Loading…" />
    </div>
  );
}

function PublicRoute({ children }) {
  const { isAuthenticated, fpc, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated && fpc) return <Navigate to="/change-password" replace />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function ProtectedRoute({ children, requireFpc = false }) {
  const { isAuthenticated, fpc, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireFpc && !fpc) return <Navigate to="/" replace />;
  if (!requireFpc && fpc) return <Navigate to="/change-password" replace />;
  return children;
}

function HomePlaceholder() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.placeholder}>
      App placeholder — protected home
      <button className={styles.logoutBtn} onClick={handleLogout}>
        Log out
      </button>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route path="/resend-confirmation" element={<ResendConfirmationPage />} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute requireFpc={true}>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePlaceholder />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
