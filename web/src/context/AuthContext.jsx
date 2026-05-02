import { createContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [fpc, setFpc] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
    setFpc(false);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const handleForceLogout = () => clearAuth();
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, [clearAuth]);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    authApi
      .verifySession()
      .then(() => {
        setToken(storedToken);
        setIsAuthenticated(true);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [clearAuth]);

  const login = useCallback(async (identifier, password, remember) => {
    const { data } = await authApi.login(identifier, password, remember);
    const { token: newToken, fpc: forcePwChange, user: userData } = data.data;
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    setUser(userData);
    setFpc(forcePwChange);
    setIsAuthenticated(true);
    return forcePwChange;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{ user, token, fpc, isAuthenticated, isLoading, login, logout, clearAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}
