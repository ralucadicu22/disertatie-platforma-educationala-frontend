import api from './axios';

export const impersonationApi = {
    logStart: (role) =>
        api.post('/admin/impersonation/start', { role }).then(r => r.data),

    logEnd: (role) =>
        api.post('/admin/impersonation/end', { role }).then(r => r.data),

    getLogs: () =>
        api.get('/admin/impersonation/logs').then(r => r.data),
};
