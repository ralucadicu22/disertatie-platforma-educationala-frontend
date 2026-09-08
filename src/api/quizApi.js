import api from './axios';

export const quizApi = {
    getAll: () => api.get('/quizzes').then((r) => r.data),
    getByModule: (moduleId) =>
        api.get(`/quizzes?moduleId=${moduleId}`).then((r) => r.data),
};