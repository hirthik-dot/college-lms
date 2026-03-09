import axios from 'axios';

// Basic Axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// We rely on memory AuthProvider setting `api.defaults.headers.common['Authorization']`.
// However, request interceptors are still useful to ensure we attach properly 
// if it gets stripped accidentally, or to perform pre-flight checks.
api.interceptors.request.use(
    (config) => {
        // Handled naturally by axios defaults now from AuthContext.
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Auto-logout and redirect if a 401 Unauthorized is detected.
        if (error.response?.status === 401) {
            // Memory states are cleared by context logic, but we must force redirect here
            const path = window.location.pathname;
            // Only force redirect if we aren't already on login
            if (path !== '/login' && path !== '/') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
