import api from './axios';

export const impersonationApi = {
    start: (userId) =>
        api.post('/admin/impersonation/start', { userId }).then(r => r.data),

    end: (userId) =>
        api.post('/admin/impersonation/end', { userId }).then(r => r.data),

    getLogs: () =>
        api.get('/admin/impersonation/logs').then(r => r.data),

    listUsersByRole: (role) =>
        api.get('/users', { params: { role } }).then(r => r.data),
};