import { createContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../features/auth/api/authApi.js';
import { setApiToken, clearApiToken } from '../services/api.js';

export const AuthContext = createContext(null);

const SESSION_FLAG = 'hasSession';

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(null);
	const [fpc, setFpc] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const clearAuth = useCallback(() => {
		clearApiToken();
		localStorage.removeItem(SESSION_FLAG);
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
		if (!localStorage.getItem(SESSION_FLAG)) {
			setIsLoading(false);
			return;
		}

		authApi
			.refreshToken()
			.then(({ data }) => {
				const { token: newToken, fpc: forcePwChange } = data.data;
				setApiToken(newToken);
				setToken(newToken);
				setFpc(forcePwChange);
				setIsAuthenticated(true);
			})
			.catch(() => {
				localStorage.removeItem(SESSION_FLAG);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	const login = useCallback(async (identifier, password, remember) => {
		const { data } = await authApi.login(identifier, password, remember);
		const { token: newToken, fpc: forcePwChange, user: userData } = data.data;
		localStorage.setItem(SESSION_FLAG, 'true');
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
