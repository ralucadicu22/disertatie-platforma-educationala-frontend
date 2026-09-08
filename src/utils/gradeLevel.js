export const GRADE_LEVEL_LABELS = {
    PREGATITOARE: 'Clasa pregatitoare',
    CLASA_1: 'Clasa I',
    CLASA_2: 'Clasa a II-a',
    CLASA_3: 'Clasa a III-a',
    CLASA_4: 'Clasa a IV-a',
    CLASA_5: 'Clasa a V-a',
    CLASA_6: 'Clasa a VI-a',
    CLASA_7: 'Clasa a VII-a',
    CLASA_8: 'Clasa a VIII-a',
};

export const GRADE_LEVEL_OPTIONS = Object.entries(GRADE_LEVEL_LABELS).map(
    ([value, label]) => ({ value, label })
);

export const gradeLevelLabel = (value) =>
    GRADE_LEVEL_LABELS[value] || value || '—';