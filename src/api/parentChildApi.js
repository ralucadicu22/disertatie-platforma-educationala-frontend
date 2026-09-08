import api from './axios';

export const parentChildApi = {
    getAll: () => api.get('/parent-child/all').then((r) => r.data),

    getParent: (parentId) =>
        api.get(`/parent-child/parent/${parentId}`).then((r) => r.data),

    link: (parentId, childId) =>
        api.post('/parent-child/link', { parentId, childId }),

    unlink: (parentId, childId) =>
        api.delete(`/parent-child/parent/${parentId}/child/${childId}`),
    getMyChildren: () =>
        api.get('/parent-child/my-children').then((r) => r.data),

    getMyParents: () =>
        api.get('/parent-child/my-parents').then((r) => r.data),
};