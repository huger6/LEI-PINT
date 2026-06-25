// Manages JWT authentication, session persistence, token refresh, and inactivity logout.
import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import * as authApi from '../features/auth/api/authApi.js';
import { setApiToken, clearApiToken, performRefresh, setOnRefreshSuccess } from '../services/api.js';

export const AuthContext = createContext(null);

const SESSION_FLAG = 'hasSession';
const SESSION_PERSISTENT_FLAG = 'sessionPersistent';
const ACTIVITY_DEBOUNCE_MS = 10_000;
const REFRESH_CHECK_INTERVAL_MS = 30_000;
const ACTIVITY_WINDOW_MS_PERSISTENT = 5 * 60 * 1000;
const ACTIVITY_WINDOW_MS_EPHEMERAL = 10 * 60 * 1000;
const INACTIVITY_CHECK_MS = 15_000;
const TOKEN_REFRESH_THRESHOLD_S = 60;

/**
 * Provides authentication state and actions (login, logout, token refresh).
 * Handles automatic token refresh when nearing expiry, and logs out inactive non-persistent sessions.
 */
export function AuthProvider({ children }) {
	// Stores the authenticated user object.
	const [user, setUser] = useState(null);
	// Stores the current JWT access token string.
	const [token, setToken] = useState(null);
	// Tracks whether a forced password change is required.
	const [fpc, setFpc] = useState(false);
	// Reflects whether the user is currently authenticated.
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	// Indicates the initial session restore is still in progress.
	const [isLoading, setIsLoading] = useState(true);
	// Prevents duplicate refresh attempts on mount.
	const refreshAttempted = useRef(false);

	// Holds the Unix timestamp (seconds) when the current token expires.
	const tokenExpiresAt = useRef(null);
	// Records the timestamp of the most recent detected user activity.
	const lastActivityAt = useRef(Date.now());
	// Tracks the last time the activity timestamp was updated to debounce rapid events.
	const lastActivityUpdate = useRef(0);

	// Tracks whether the current session is persistent (remember me).
	const isPersistent = useRef(false);

	// Clears all auth state and removes session flags from localStorage.
	const clearAuth = useCallback(() => {
		clearApiToken();
		localStorage.removeItem(SESSION_FLAG);
		localStorage.removeItem(SESSION_PERSISTENT_FLAG);
		setUser(null);
		setToken(null);
		setFpc(false);
		setIsAuthenticated(false);
		tokenExpiresAt.current = null;
		isPersistent.current = false;
	}, []);

	// Updates token, expiry, and user data from a refresh response.
	const applyRefreshData = useCallback((data) => {
		setApiToken(data.token);
		setToken(data.token);
		if (data.tokenExpiresIn) {
			tokenExpiresAt.current = Math.floor(Date.now() / 1000) + data.tokenExpiresIn;
		}
		if (data.persistent !== undefined) {
			isPersistent.current = data.persistent;
			localStorage.setItem(SESSION_PERSISTENT_FLAG, data.persistent ? '1' : '0');
		}
		if (data.user) setUser(data.user);
		if (data.fpc !== undefined) setFpc(data.fpc);
	}, []);

	// Calls the logout API endpoint and clears all local auth state.
	const logout = useCallback(async () => {
		try {
			await authApi.logout();
		} catch {
			// best-effort
		} finally {
			clearAuth();
		}
	}, [clearAuth]);

	// Listens for a global 'auth:logout' event to force-clear auth state.
	useEffect(() => {
		const handleForceLogout = () => clearAuth();
		window.addEventListener('auth:logout', handleForceLogout);
		return () => window.removeEventListener('auth:logout', handleForceLogout);
	}, [clearAuth]);

	// Registers a callback to update token expiry whenever a background refresh succeeds.
	useEffect(() => {
		setOnRefreshSuccess((data) => {
			if (data.tokenExpiresIn) {
				tokenExpiresAt.current = Math.floor(Date.now() / 1000) + data.tokenExpiresIn;
			}
		});
		return () => setOnRefreshSuccess(null);
	}, []);

	// Tracks user activity (mouse, click, keyboard) to determine session inactivity.
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

	// Periodically checks if the token is near expiry and refreshes it if the user is active.
	useEffect(() => {
		const interval = setInterval(async () => {
			if (!tokenExpiresAt.current) return;

			const remainingS = tokenExpiresAt.current - Math.floor(Date.now() / 1000);
			if (remainingS > TOKEN_REFRESH_THRESHOLD_S) return;

			const activityWindow = isPersistent.current
				? ACTIVITY_WINDOW_MS_PERSISTENT
				: ACTIVITY_WINDOW_MS_EPHEMERAL;
			const timeSinceActivity = Date.now() - lastActivityAt.current;
			if (timeSinceActivity > activityWindow) return;

			try {
				const result = await performRefresh();
				applyRefreshData(result);
			} catch {
				// 401 interceptor or next check will handle it
			}
		}, REFRESH_CHECK_INTERVAL_MS);

		return () => clearInterval(interval);
	}, [applyRefreshData]);

	// Proactively log out non-persistent sessions after 10 minutes of inactivity
	useEffect(() => {
		const interval = setInterval(() => {
			if (!tokenExpiresAt.current || isPersistent.current) return;

			const timeSinceActivity = Date.now() - lastActivityAt.current;
			if (timeSinceActivity > ACTIVITY_WINDOW_MS_EPHEMERAL) {
				logout();
			}
		}, INACTIVITY_CHECK_MS);

		return () => clearInterval(interval);
	}, [logout]);

	// Restores a previous session on mount by attempting a token refresh.
	useEffect(() => {
		if (!localStorage.getItem(SESSION_FLAG)) {
			setIsLoading(false);
			return;
		}

		isPersistent.current = localStorage.getItem(SESSION_PERSISTENT_FLAG) === '1';

		if (refreshAttempted.current) return;
		refreshAttempted.current = true;

		performRefresh()
			.then((result) => {
				applyRefreshData(result);
				setIsAuthenticated(true);
			})
			.catch((err) => {
				if (err.response?.status === 401 || err.response?.status === 403) {
					localStorage.removeItem(SESSION_FLAG);
					localStorage.removeItem(SESSION_PERSISTENT_FLAG);
				}
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [applyRefreshData]);

	// Authenticates the user and initializes session state. Returns true if force-password-change is required.
	const login = useCallback(async (identifier, password, remember) => {
		const { data } = await authApi.login(identifier, password, remember);
		const { token: newToken, tokenExpiresIn, fpc: forcePwChange, persistent, user: userData } = data.data;
		localStorage.setItem(SESSION_FLAG, 'true');
		localStorage.setItem(SESSION_PERSISTENT_FLAG, persistent ? '1' : '0');
		isPersistent.current = persistent;
		setApiToken(newToken);
		setToken(newToken);
		if (tokenExpiresIn) {
			tokenExpiresAt.current = Math.floor(Date.now() / 1000) + tokenExpiresIn;
		}
		lastActivityAt.current = Date.now();
		setUser(userData);
		setFpc(forcePwChange);
		setIsAuthenticated(true);
		return forcePwChange;
	}, []);

	// Completes the forced password change flow and updates token/session state.
	const completeFpc = useCallback((data) => {
		if (data?.token) {
			setApiToken(data.token);
			setToken(data.token);
		}
		if (data?.tokenExpiresIn) {
			tokenExpiresAt.current = Math.floor(Date.now() / 1000) + data.tokenExpiresIn;
		}
		if (data?.persistent !== undefined) {
			isPersistent.current = data.persistent;
			localStorage.setItem(SESSION_PERSISTENT_FLAG, data.persistent ? '1' : '0');
		}
		setFpc(false);
	}, []);

	return (
		<AuthContext.Provider
			value={{ user, token, fpc, isAuthenticated, isLoading, login, logout, clearAuth, completeFpc }}
		>
			{children}
		</AuthContext.Provider>
	);
}
