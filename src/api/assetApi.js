import axios from 'axios';
import api from './axios';

const BASE = 'http://localhost:8080/api';

export const assetApi = {
    upload: (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');

        return axios.post(`${BASE}/assets/upload`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,

            },
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