import api from './axios';

export const quizAttemptApi = {
    start: (quizId) =>
        api.post(`/quiz-attempts/start/${quizId}`).then((r) => r.data),


    finish: (attemptId) =>
        api.post(`/quiz-attempts/${attemptId}/finish`).then((r) => r.data),


    getHistory: (quizId) =>
        api.get(`/quiz-attempts/quiz/${quizId}/history`).then((r) => r.data),
};