import api from './axios';

export const classroomApi = {
    getAll: () => api.get('/classrooms').then((r) => r.data),
    getMy: () => api.get('/classrooms/my').then((r) => r.data),
    getOne: (id) => api.get(`/classrooms/${id}`).then((r) => r.data),

    create: (data) => api.post('/classrooms', data).then((r) => r.data),
    update: (id, data) => api.put(`/classrooms/${id}`, data).then((r) => r.data),
    delete: (id) => api.delete(`/classrooms/${id}`),

    addTeacher: (classroomId, userId) =>
        api.post(`/classrooms/${classroomId}/teachers`, { userId }).then((r) => r.data),
    removeTeacher: (classroomId, userId) =>
        api.delete(`/classrooms/${classroomId}/teachers/${userId}`).then((r) => r.data),

    addStudent: (classroomId, userId) =>
        api.post(`/classrooms/${classroomId}/students`, { userId }).then((r) => r.data),
    removeStudent: (classroomId, userId) =>
        api.delete(`/classrooms/${classroomId}/students/${userId}`).then((r) => r.data),
};