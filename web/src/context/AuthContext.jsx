import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import * as authApi from '../features/auth/api/authApi.js';
import { setApiToken, clearApiToken, performRefresh, setOnRefreshSuccess } from '../services/api.js';

export const AuthContext = createContext(null);

const SESSION_FLAG = 'hasSession';
const ACTIVITY_DEBOUNCE_MS = 10_000;
const REFRESH_CHECK_INTERVAL_MS = 30_000;
const ACTIVITY_WINDOW_MS = 5 * 60 * 1000;
const TOKEN_REFRESH_THRESHOLD_S = 60;

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(null);
	const [fpc, setFpc] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const refreshAttempted = useRef(false);

	const tokenExpiresAt = useRef(null);
	const lastActivityAt = useRef(Date.now());
	const lastActivityUpdate = useRef(0);

	const clearAuth = useCallback(() => {
		clearApiToken();
		localStorage.removeItem(SESSION_FLAG);
		setUser(null);
		setToken(null);
		setFpc(false);
		setIsAuthenticated(false);
		tokenExpiresAt.current = null;
	}, []);

	const applyRefreshData = useCallback((data) => {
		setApiToken(data.token);
		setToken(data.token);
		if (data.tokenExpiresIn) {
			tokenExpiresAt.current = Math.floor(Date.now() / 1000) + data.tokenExpiresIn;
		}
		if (data.user) setUser(data.user);
		if (data.fpc !== undefined) setFpc(data.fpc);
	}, []);

	useEffect(() => {
		const handleForceLogout = () => clearAuth();
		window.addEventListener('auth:logout', handleForceLogout);
		return () => window.removeEventListener('auth:logout', handleForceLogout);
	}, [clearAuth]);

	useEffect(() => {
		setOnRefreshSuccess((data) => {
			if (data.tokenExpiresIn) {
				tokenExpiresAt.current = Math.floor(Date.now() / 1000) + data.tokenExpiresIn;
			}
		});
		return () => setOnRefreshSuccess(null);
	}, []);

	useEffect(() => {
		const updateActivity = () => {
			const now = Date.now();
			if (now - lastActivityUpdate.current > ACTIVITY_DEBOUNCE_MS) {
				lastActivityAt.current = now;
				lastActivityUpdate.current = now;
			}
		};

		window.addEventListener('mousemove', updateActivity);
		window.addEventListener('click', updateActivity);
		window.addEventListener('keydown', updateActivity);

		return () => {
			window.removeEventListener('mousemove', updateActivity);
			window.removeEventListener('click', updateActivity);
			window.removeEventListener('keydown', updateActivity);
		};
	}, []);

	useEffect(() => {
		const interval = setInterval(async () => {
			if (!tokenExpiresAt.current) return;

			const remainingS = tokenExpiresAt.current - Math.floor(Date.now() / 1000);
			if (remainingS > TOKEN_REFRESH_THRESHOLD_S) return;

			const timeSinceActivity = Date.now() - lastActivityAt.current;
			if (timeSinceActivity > ACTIVITY_WINDOW_MS) return;

			try {
				const result = await performRefresh();
				applyRefreshData(result);
			} catch {
				// 401 interceptor or next check will handle it
			}
		}, REFRESH_CHECK_INTERVAL_MS);

		return () => clearInterval(interval);
	}, [applyRefreshData]);

	useEffect(() => {
		if (!localStorage.getItem(SESSION_FLAG)) {
			setIsLoading(false);
			return;
		}

		if (refreshAttempted.current) return;
		refreshAttempted.current = true;

		performRefresh()
			.then((result) => {
				applyRefreshData(result);
				setIsAuthenticated(true);
			})
			.catch(() => {
				localStorage.removeItem(SESSION_FLAG);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [applyRefreshData]);

	const login = useCallback(async (identifier, password, remember) => {
		const { data } = await authApi.login(identifier, password, remember);
		const { token: newToken, tokenExpiresIn, fpc: forcePwChange, user: userData } = data.data;
		localStorage.setItem(SESSION_FLAG, 'true');
		setApiToken(newToken);
		setToken(newToken);
		if (tokenExpiresIn) {
			tokenExpiresAt.current = Math.floor(Date.now() / 1000) + tokenExpiresIn;
		}
		setUser(userData);
		setFpc(forcePwChange);
		setIsAuthenticated(true);
		return forcePwChange;
	}, []);

	const completeFpc = useCallback((newToken) => {
		if (newToken) {
			setApiToken(newToken);
			setToken(newToken);
		}
		setFpc(false);
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
			value={{ user, token, fpc, isAuthenticated, isLoading, login, logout, clearAuth, completeFpc }}
		>
			{children}
		</AuthContext.Provider>
	);
}
