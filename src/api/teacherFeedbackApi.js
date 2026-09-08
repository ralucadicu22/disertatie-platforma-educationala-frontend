import api from './axios';

export const teacherFeedbackApi = {

    create: (data) =>
        api.post('/teacher-feedback', data).then((r) => r.data),


    update: (id, data) =>
        api.put(`/teacher-feedback/${id}`, data).then((r) => r.data),


    delete: (id) =>
        api.delete(`/teacher-feedback/${id}`),


    getMyGiven: () =>
        api.get('/teacher-feedback/my-given').then((r) => r.data),

    getForStudent: (studentId) =>
        api.get(`/teacher-feedback/student/${studentId}`).then((r) => r.data),


    getMyReceived: () =>
        api.get('/teacher-feedback/my-received').then((r) => r.data),

    getUnreadCount: () =>
        api.get('/teacher-feedback/my-received/unread-count').then((r) => r.data),
    markAsRead: (id) =>
        api.post(`/teacher-feedback/${id}/mark-read`),
};