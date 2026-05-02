import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ConfirmEmailPage from './pages/ConfirmEmailPage';
import ResendConfirmationPage from './pages/ResendConfirmationPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import styles from './App.module.css';

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
            <div className={styles.placeholder}>App placeholder — protected home</div>
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
