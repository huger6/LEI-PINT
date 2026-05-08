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

api.interceptors.request.use((config) => {
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
			console.log('[API RESPONSE]', {
				method: response.config?.method?.toUpperCase(),
				url: response.config?.url,
				status: response.status,
				data: response.data,
			});
		}
		return response;
	},
	async (error) => {
		if (import.meta.env.DEV && error.response) {
			console.log('[API RESPONSE ERROR]', {
				method: error.config?.method?.toUpperCase(),
				url: error.config?.url,
				status: error.response.status,
				data: error.response.data,
			});
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
