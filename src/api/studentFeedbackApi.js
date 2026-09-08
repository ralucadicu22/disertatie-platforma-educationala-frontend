import api from './axios';

export const studentFeedbackApi = {
    submit: (data) =>
        api.post('/student-feedback', data).then((r) => r.data),

    deleteMy: (exerciseId) =>
        api.delete(`/student-feedback/my/exercise/${exerciseId}`),


    getMyForExercise: (exerciseId) =>
        api.get(`/student-feedback/my/exercise/${exerciseId}`).then((r) => r.data),

    getMy: () =>
        api.get('/student-feedback/my').then((r) => r.data),

    getForExercise: (exerciseId) =>
        api.get(`/student-feedback/exercise/${exerciseId}`).then((r) => r.data),

    getSummary: (exerciseId) =>
        api.get(`/student-feedback/exercise/${exerciseId}/summary`).then((r) => r.data),
};