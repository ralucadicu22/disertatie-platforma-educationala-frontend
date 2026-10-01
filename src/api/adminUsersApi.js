import api from './axios';

export const adminUsersApi = {
    getAll: (role) =>
        api.get('/users', { params: role ? { role } : {} }).then(r => r.data),
    toggleActive: (id) =>
        api.put(`/users/${id}/toggle-active`).then(r => r.data),
    updateRole: (id, role) =>
        api.put(`/users/${id}/role`, { role }).then(r => r.data),
    resetPassword: (id, newPassword) =>
        api.put(`/users/${id}/reset-password`, { newPassword }),
    deleteUser: (id) =>
        api.delete(`/users/${id}`),
    createUser: (data) =>
        api.post('/auth/register', data).then(res => res.data),
};