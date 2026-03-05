import axios from 'axios';

const isDevelopment = import.meta.env.MODE === 'development'
const myBaseUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_DEPLOY

const api = axios.create({
    baseURL: myBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Request Interceptor: adjunta el access token a cada petición ──
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response Interceptor: refresh automático y transparente ──
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Solo intentar refresh en errores 401 que NO son del endpoint de refresh/login
        const isAuthEndpoint = originalRequest.url?.includes('/api/token/');
        if (error.response?.status !== 401 || isAuthEndpoint || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Si ya estamos refrescando, encolar la petición para reintentar después
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            isRefreshing = false;
            processQueue(error);
            // Sin refresh token, forzar logout
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        try {
            // Usar axios puro (no api) para evitar loop infinito con el interceptor
            const { data } = await axios.post(`${myBaseUrl}/api/token/refresh/`, {
                refresh: refreshToken,
            });

            const newAccessToken = data.access;
            localStorage.setItem('access_token', newAccessToken);

            // Si el backend rota el refresh token, guardar el nuevo
            if (data.refresh) {
                localStorage.setItem('refresh_token', data.refresh);
            }

            // Procesar cola de peticiones pendientes con el nuevo token
            processQueue(null, newAccessToken);

            // Reintentar la petición original
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);
            // Refresh falló → sesión expirada, forzar logout
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
