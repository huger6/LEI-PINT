import axios from 'axios';

const api = axios.create({
	baseURL: '/api',
	withCredentials: true,
	headers: { 'Content-Type': 'application/json' },
});

let _token = null;

export const getApiToken = () => _token;
export const setApiToken = (token) => { _token = token; };
export const clearApiToken = () => { _token = null; };

let _onRefreshSuccess = null;
export const setOnRefreshSuccess = (cb) => { _onRefreshSuccess = cb; };

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

let _refreshPromise = null;

export const performRefresh = () => {
	if (_refreshPromise) return _refreshPromise;

	_refreshPromise = api.post('/auth/refresh')
		.then(({ data }) => {
			const result = data.data;
			_token = result.token;
			if (_onRefreshSuccess) _onRefreshSuccess(result);
			return result;
		})
		.catch((error) => {
			_token = null;
			window.dispatchEvent(new CustomEvent('auth:logout'));
			throw error;
		})
		.finally(() => {
			_refreshPromise = null;
		});

	return _refreshPromise;
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
			original._retry = true;

			try {
				const result = await performRefresh();
				original.headers.Authorization = `Bearer ${result.token}`;
				return api(original);
			} catch (refreshError) {
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	}
);

export default api;
