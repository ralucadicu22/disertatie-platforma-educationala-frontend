
export const colors = {
    primary: {
        50: '#F5F3FF', 100: '#EDE9FE', 200: '#DDD6FE', 300: '#C4B5FD',
        400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED', 700: '#6D28D9',
        800: '#5B21B6', 900: '#4C1D95',
    },
    accent: {
        50: '#FDF2F8', 100: '#FCE7F3', 200: '#FBCFE8', 300: '#F9A8D4',
        400: '#F472B6', 500: '#EC4899', 600: '#DB2777', 700: '#BE185D',
        800: '#9D174D', 900: '#831843',
    },
    warm: {
        50: '#FFF7ED', 100: '#FFEDD5', 200: '#FED7AA', 300: '#FDBA74',
        400: '#FB923C', 500: '#F97316', 600: '#EA580C', 700: '#C2410C',
        800: '#9A3412', 900: '#7C2D12',
    },
    success: {
        50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#86EFAC',
        400: '#4ADE80', 500: '#22C55E', 600: '#16A34A', 700: '#15803D',
        800: '#166534', 900: '#14532D',
    },
    warning: {
        50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D',
        400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
        800: '#92400E', 900: '#78350F',
    },
    danger: {
        50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 300: '#FCA5A5',
        400: '#F87171', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C',
        800: '#991B1B', 900: '#7F1D1D',
    },
    neutral: {
        50: '#FAFAF9', 100: '#F5F5F4', 200: '#E7E5E4', 300: '#D6D3D1',
        400: '#A8A29E', 500: '#78716C', 600: '#57534E', 700: '#44403C',
        800: '#292524', 900: '#1C1917',
    },
};

export const gradients = {
    heroPrimary:   'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
    heroWarm:      'linear-gradient(135deg, #FDBA74 0%, #F472B6 100%)',
    successWarm:   'linear-gradient(135deg, #4ADE80 0%, #FBBF24 100%)',
    cardSoftWarm:  'linear-gradient(135deg, #FFF7ED 0%, #FEE2E2 100%)',
    cardSoftCool:  'linear-gradient(135deg, #EDE9FE 0%, #FCE7F3 100%)',
    cardSoftFresh: 'linear-gradient(135deg, #DCFCE7 0%, #FEF3C7 100%)',
};

export const avatarGradients = [
    'linear-gradient(135deg, #F472B6, #EC4899)',
    'linear-gradient(135deg, #A78BFA, #8B5CF6)',
    'linear-gradient(135deg, #FDBA74, #F97316)',
    'linear-gradient(135deg, #4ADE80, #22C55E)',
    'linear-gradient(135deg, #60A5FA, #3B82F6)',
    'linear-gradient(135deg, #FCD34D, #F59E0B)',
    'linear-gradient(135deg, #F87171, #EF4444)',
    'linear-gradient(135deg, #2DD4BF, #14B8A6)',
];

export const gradientForString = (str) => {
    if (!str) return avatarGradients[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarGradients[Math.abs(hash) % avatarGradients.length];
};

export const motion = {
    spring: { type: 'spring', damping: 20, stiffness: 300 },
    softSpring: { type: 'spring', damping: 25, stiffness: 200 },
    bounce: { type: 'spring', damping: 12, stiffness: 400 },
    fade: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
    fadeSlide: {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
    },
    scaleIn: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
    },
};