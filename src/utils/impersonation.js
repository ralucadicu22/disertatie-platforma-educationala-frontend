
const ORIGINAL_USER_KEY       = '_originalUser';
const IMPERSONATED_ID_KEY     = '_impersonatedUserId';
const IMPERSONATED_USER_KEY   = '_impersonatedUser';

export const impersonation = {
    isActive() {
        return localStorage.getItem(IMPERSONATED_ID_KEY) !== null;
    },

    currentUserId() {
        const v = localStorage.getItem(IMPERSONATED_ID_KEY);
        return v ? Number(v) : null;
    },

    currentUser() {
        const raw = localStorage.getItem(IMPERSONATED_USER_KEY);
        try { return raw ? JSON.parse(raw) : null; } catch { return null; }
    },

    currentRole() {
        return this.currentUser()?.role ?? null;
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

    start(targetUser) {
        const current = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem(ORIGINAL_USER_KEY, JSON.stringify(current));
        localStorage.setItem(IMPERSONATED_ID_KEY, String(targetUser.id));
        localStorage.setItem(IMPERSONATED_USER_KEY, JSON.stringify(targetUser));

        const impersonatedUser = {
            ...targetUser,
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
        localStorage.removeItem(IMPERSONATED_ID_KEY);
        localStorage.removeItem(IMPERSONATED_USER_KEY);
    },
};
