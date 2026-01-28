import axios from 'axios';

// Get the token from local storage
const getToken = () => localStorage.getItem('token');

const api = axios.create({
    baseURL: 'http://localhost:8000/api', // Explicitly use /api prefix
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for API calls
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Token might be expired or invalid
            console.error("Authentication Error (401): Redirecting to login.");
            localStorage.removeItem('token');
            window.location.href = '/login';
        }

        // Log all API errors centrally
        console.error("API Error Log:", {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data
        });

        return Promise.reject(error);
    }
);

export default api;
