import axios from 'axios';

const api = axios.create({
	baseURL: '/api',
	withCredentials: true,
	headers: { 'Content-Type': 'application/json' },
});

// Store token in memory
let _token = null;

export const getApiToken = () => _token;
export const setApiToken = (token) => { _token = token; };
export const clearApiToken = () => { _token = null; };

const getCaller = () => {
	const stack = new Error().stack || '';
	const lines = stack.split('\n').slice(1);
	const callers = [];
	for (const line of lines) {
		if (line.includes('/services/api') || line.includes('node_modules')) continue;
		const match = line.match(/(?:at\s+)?(\S+?)\s+\(?.*?([^/\\]+\.[jt]sx?):(\d+)/);
		if (match) callers.push(`${match[2]}:${match[3]} (${match[1]})`);
		if (callers.length >= 3) break;
	}
	return callers.length ? callers.join(' ← ') : 'unknown';
};

api.interceptors.request.use((config) => {
	if (import.meta.env.DEV) {
		config.metadata = { startedAt: Date.now(), caller: getCaller() };
	}
	if (_token) {
		config.headers.Authorization = `Bearer ${_token}`;
	}
	return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
	failedQueue.forEach((prom) => {
		if (error) prom.reject(error);
		else prom.resolve(token);
	});
	failedQueue = [];
};

api.interceptors.response.use(
	(response) => {
		if (import.meta.env.DEV) {
			const meta = response.config?.metadata;
			const duration = meta?.startedAt ? `${Date.now() - meta.startedAt}ms` : '?';
			console.log(
				`[API %c${response.config?.method?.toUpperCase()}%c ${response.config?.url}] %c${response.status} %c${duration}`,
				'font-weight:bold', '', 'color:green', 'color:gray',
			);
			console.log('  ├─ caller:', meta?.caller ?? 'unknown');
			console.log('  ├─ timestamp:', new Date().toISOString());
			console.log('  └─ data:', response.data);
		}
		return response;
	},
	async (error) => {
		if (import.meta.env.DEV && error.response) {
			const meta = error.config?.metadata;
			const duration = meta?.startedAt ? `${Date.now() - meta.startedAt}ms` : '?';
			console.log(
				`[API %c${error.config?.method?.toUpperCase()}%c ${error.config?.url}] %c${error.response.status} %c${duration}`,
				'font-weight:bold', '', 'color:red', 'color:gray',
			);
			console.log('  ├─ caller:', meta?.caller ?? 'unknown');
			console.log('  ├─ timestamp:', new Date().toISOString());
			console.log('  └─ data:', error.response.data);
		}

		const original = error.config;
		const status = error.response?.status;
		const url = original?.url ?? '';

		const isAuthBypass =
			url.includes('/auth/refresh') || url.includes('/auth/login');

		if (status === 401 && !original._retry && !isAuthBypass) {
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then((token) => {
					original.headers.Authorization = `Bearer ${token}`;
					return api(original);
				});
			}

			original._retry = true;
			isRefreshing = true;

			try {
				const { data } = await api.post('/auth/refresh');
				const newToken = data.data.token;
				_token = newToken;
				processQueue(null, newToken);
				original.headers.Authorization = `Bearer ${newToken}`;
				return api(original);
			} catch (refreshError) {
				processQueue(refreshError, null);
				_token = null;
				window.dispatchEvent(new CustomEvent('auth:logout'));
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	}
);

export default api;
