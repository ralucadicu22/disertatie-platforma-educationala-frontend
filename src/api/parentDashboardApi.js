import api from './axios';

export const parentDashboardApi = {
    getOverview: () =>
        api.get('/parent-dashboard/overview').then((r) => r.data),

    getChildDetail: (childId) =>
        api.get(`/parent-dashboard/child/${childId}`).then((r) => r.data),
};