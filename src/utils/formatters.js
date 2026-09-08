
export const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'chiar acum';
    if (diffSec < 3600) return `acum ${Math.floor(diffSec / 60)} min`;
    if (diffSec < 86400) return `acum ${Math.floor(diffSec / 3600)} ore`;
    if (diffSec < 172800) return 'ieri';
    if (diffSec < 604800) return `acum ${Math.floor(diffSec / 86400)} zile`;
    if (diffSec < 2592000) return `acum ${Math.floor(diffSec / 604800)} sapt.`;
    return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDate = (dateStr, opts = {}) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ro-RO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        ...opts,
    });
};

export const formatNumber = (n) => {
    if (n == null) return '0';
    return n.toLocaleString('ro-RO');
};