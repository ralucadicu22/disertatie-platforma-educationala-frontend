
const ORIGINAL_USER_KEY = '_originalUser';
const IMPERSONATION_ROLE_KEY = '_impersonationRole';

export const impersonation = {
    isActive() {
        return localStorage.getItem(IMPERSONATION_ROLE_KEY) !== null;
    },

    currentRole() {
        return localStorage.getItem(IMPERSONATION_ROLE_KEY);
    },

    originalUser() {
        const raw = localStorage.getItem(ORIGINAL_USER_KEY);
        try { return raw ? JSON.parse(raw) : null; } catch { return null; }
    },

    roleLabel(role) {
        const labels = {
            ELEV:     'Elev',
            PROFESOR: 'Profesor',
            PARINTE:  'Părinte',
            EDITOR:   'Editor',
        };
        return labels[role] ?? role;
    },

    start(targetRole) {
        const current = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem(ORIGINAL_USER_KEY, JSON.stringify(current));
        localStorage.setItem(IMPERSONATION_ROLE_KEY, targetRole);

        const impersonatedUser = {
            ...current,
            role: targetRole,
            _impersonating: true,
        };
        localStorage.setItem('user', JSON.stringify(impersonatedUser));
    },
    end() {
        const original = this.originalUser();
        if (original) {
            localStorage.setItem('user', JSON.stringify(original));
        }
        localStorage.removeItem(ORIGINAL_USER_KEY);
        localStorage.removeItem(IMPERSONATION_ROLE_KEY);
    },
};
