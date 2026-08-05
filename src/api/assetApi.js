import api from './axios';

export const assetApi = {
    upload: (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/assets/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (onProgress && e.total) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            },
        });
    },

    list: (type = '') => api.get('/assets', { params: type ? { type } : {} }),

    delete: (id) => api.delete(`/assets/${id}`),
};