import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import { useAuth } from '../features/auth';
import {
  authPublicRoutes,
  authOpenRoutes,
  authFpcRoutes,
} from '../features/auth/routes';
import styles from '../assets/styles/componentes/App.module.css';

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

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        {authPublicRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>

      {authOpenRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}

      <Route element={<ProtectedRoute requireFpc />}>
        {authFpcRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePlaceholder />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
