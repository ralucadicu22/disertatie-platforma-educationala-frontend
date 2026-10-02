import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const impersonatedRole = localStorage.getItem('_impersonationRole');
        if (impersonatedRole) {
            config.headers['X-Impersonating-As'] = impersonatedRole;
        }

        return config;
    },
    error => Promise.reject(error)
);

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        if (error.response?.status === 403) {
            alert('Nu ai permisiunea sa accesezi aceasta resursa.');
        }
        return Promise.reject(error);
    }
);

let overrideApi = null;

export function setApiOverride(mockApi) {
    overrideApi = mockApi;
}

export function clearApiOverride() {
    overrideApi = null;
}

export const apiWithOverride = {
    get: (...args) => (overrideApi || api).get(...args),
    post: (...args) => (overrideApi || api).post(...args),
    put: (...args) => (overrideApi || api).put(...args),
    delete: (...args) => (overrideApi || api).delete(...args),
};

export default api;