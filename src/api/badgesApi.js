import api from './axios';

export const badgesApi = {
    getMyBadges: () => api.get('/badges/my').then(r => r.data),
};