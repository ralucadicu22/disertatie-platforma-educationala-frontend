import api from './axios';

export const bulkImportApi = {
    preview: (file) => {
        const form = new FormData();
        form.append('file', file);
        return api.post('/admin/bulk-import/preview', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data);
    },

    importUsers: (file) => {
        const form = new FormData();
        form.append('file', file);
        return api.post('/admin/bulk-import/import', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data);
    },


    getHistory: () =>
        api.get('/admin/bulk-import/history').then(r => r.data),

    downloadTemplate: async () => {
        const response = await api.get('/admin/bulk-import/template', { responseType: 'blob' });
        const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_import.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
};