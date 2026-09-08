import api from './axios';

export const quizAssignmentApi = {
    assign: (quizIds, classroomIds) =>
        api.post('/quiz-assignments/assign', { quizIds, classroomIds }),
    unassign: (classroomId, quizId) =>
        api.delete(`/quiz-assignments/classroom/${classroomId}/quiz/${quizId}`),
    getMyClassroomsWithQuizzes: () =>
        api.get('/quiz-assignments/my-classrooms').then((r) => r.data),

    getMyAssignedQuizzes: () =>
        api.get('/quiz-assignments/my-quizzes').then((r) => r.data),
};