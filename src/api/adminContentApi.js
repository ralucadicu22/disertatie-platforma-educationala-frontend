import api from './axios';

export const adminContentApi = {

    getProducts: () => api.get('/products').then(r => r.data),
    createProduct: (data) => api.post('/products', data).then(r => r.data),
    updateProduct: (id, data) => api.put(`/products/${id}`, data).then(r => r.data),
    deleteProduct: (id) => api.delete(`/products/${id}`),
    getModulesByProduct: (productId) =>
        api.get(`/modules/product/${productId}`).then(r => r.data),
    createModule: (productId, data) =>
        api.post(`/modules/product/${productId}`, data).then(r => r.data),
    updateModule: (id, data) => api.put(`/modules/${id}`, data).then(r => r.data),
    deleteModule: (id) => api.delete(`/modules/${id}`),

    getQuizzesByModule: (moduleId) =>
        api.get(`/quizzes/module/${moduleId}`).then(r => r.data),
    createQuiz: (moduleId, data) =>
        api.post(`/quizzes/module/${moduleId}`, data).then(r => r.data),
    updateQuiz: (id, data) => api.put(`/quizzes/${id}`, data).then(r => r.data),
    deleteQuiz: (id) => api.delete(`/quizzes/${id}`),
};