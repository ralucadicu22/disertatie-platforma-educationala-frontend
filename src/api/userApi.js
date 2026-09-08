import api from './axios';

export const userApi = {
    getAll: () => api.get('/users').then((r) => r.data),
    getByRole: (role) => api.get(`/users?role=${role}`).then((r) => r.data),
};