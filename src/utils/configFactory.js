import { DEFAULT_CANVAS, CONFIG_SCHEMA_VERSION } from '../constants/canvas';
import { EXERCISE_TYPES } from '../constants/exerciseTypes';
import { getInitialLayoutForType } from './typeLayouts';

export const DEFAULT_SETTINGS = {
    maxAttempts: 3,
    hint: null,
    explanation: null,
    scoringMode: 'integral',
    feedbackType: 'instant',
    behaviorOnFail: 'showSolution',
};

export const DEFAULT_SOLUTION = {
    correctElementIds: [],
    correctAnswers: {},
    dropMapping: {},
    alternativeAnswers:[],
};

export function createDefaultConfig({ type = EXERCISE_TYPES.CUSTOM, name = 'Exercitiu nou' } = {}) {
    return {
        version: CONFIG_SCHEMA_VERSION,
        meta: {
            type,
            name,
            description: '',
        },
        canvas: { ...DEFAULT_CANVAS },
        elements: getInitialLayoutForType(type),
        settings: { ...DEFAULT_SETTINGS },
        solution: { ...DEFAULT_SOLUTION },
    };
}

export function migrateConfig(config) {
    if (!config) return createDefaultConfig();
    return {
        version: config.version || CONFIG_SCHEMA_VERSION,
        meta: config.meta || {
            type: EXERCISE_TYPES.CUSTOM,
            name: 'Exercitiu',
            description: '',
        },
        canvas: config.canvas || { ...DEFAULT_CANVAS },
        elements: config.elements || [],
        settings: { ...DEFAULT_SETTINGS, ...(config.settings || {}) },
        solution: { ...DEFAULT_SOLUTION, ...(config.solution || {}) },
    };
}