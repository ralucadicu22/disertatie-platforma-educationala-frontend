import api from './axios';

export const exerciseTypeApi = {
    getAllGlobalConfigs: () =>
        api.get('/exercise-types/config').then(r => r.data),
    setGlobalEnabled: (exerciseType, enabled) =>
        api.put(`/exercise-types/config/${exerciseType}`, { enabled }).then(r => r.data),
    getOverridesForProduct: (productId) =>
        api.get(`/exercise-types/product/${productId}/overrides`).then(r => r.data),

    setProductOverride: (productId, exerciseType, enabled) =>
        api.put(`/exercise-types/product/${productId}/${exerciseType}`, { enabled }).then(r => r.data),
    getResolvedStatusForProduct: (productId) =>
        api.get(`/exercise-types/product/${productId}/resolved`).then(r => r.data),
    getAllowedTypesForQuiz: (quizId) =>
        api.get('/exercise-types/allowed', { params: { quizId } }).then(r => r.data),
};
