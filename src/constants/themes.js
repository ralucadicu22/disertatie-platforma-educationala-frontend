export const THEMES = {
    kids: {
        id: 'kids',
        label: '🎨 Kids',
        canvas: {
            background: '#fffde7',
        },
        colors: {
            primary: '#FF6B6B',
            accent: '#FFD93D',
            text: '#1a1d23',
            surface: '#ffffff',
            border: '#fde68a',
        },
        font: {
            family: 'Nunito',
            baseSize: 18,
        },
        borderRadius: 20,
    },
    formal: {
        id: 'formal',
        label: '📚 Formal',
        canvas: {
            background: '#ffffff',
        },
        colors: {
            primary: '#4F6BF6',
            accent: '#059669',
            text: '#1a1d23',
            surface: '#f9fafb',
            border: '#e5e7eb',
        },
        font: {
            family: 'Nunito',
            baseSize: 16,
        },
        borderRadius: 8,
    },
    dark: {
        id: 'dark',
        label: '🌙 Dark',
        canvas: {
            background: '#1a1a2e',
        },
        colors: {
            primary: '#818cf8',
            accent: '#a78bfa',
            text: '#e2e8f0',
            surface: '#1e1e3f',
            border: '#374151',
        },
        font: {
            family: 'Nunito',
            baseSize: 16,
        },
        borderRadius: 12,
    },
};

export const DEFAULT_THEME_ID = 'formal';

export function getTheme(themeId) {
    return THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
}