import { createContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../features/auth/api/authApi.js';
import { setApiToken, clearApiToken } from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(null);
	const [fpc, setFpc] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const clearAuth = useCallback(() => {
		clearApiToken();
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
		authApi
			.refreshToken()
			.then(({ data }) => {
				const newToken = data.data.token;
				setApiToken(newToken);
				setToken(newToken);
				setIsAuthenticated(true);
			})
			.catch(() => {
				// No valid session — refresh token cookie absent or expired
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	const login = useCallback(async (identifier, password, remember) => {
		const { data } = await authApi.login(identifier, password, remember);
		const { token: newToken, fpc: forcePwChange, user: userData } = data.data;
		setApiToken(newToken);
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
