import api from './axios';

export const exportApi = {
    downloadClassroomCsv: async (classroomId, classroomName) => {
        const response = await api.get(
            `/export/classroom/${classroomId}/csv`,
            { responseType: 'blob' }
        );
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `rezultate_${classroomName}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    downloadClassroomSummaryCsv: async (classroomId, classroomName) => {
        const response = await api.get(
            `/export/classroom/${classroomId}/summary-csv`,
            { responseType: 'blob' }
        );
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sumar_${classroomName}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};