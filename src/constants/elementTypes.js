export const ELEMENT_TYPES = {
    TEXT: 'TEXT',
    IMAGE: 'IMAGE',
    SHAPE: 'SHAPE',
    BOX: 'BOX',
    GRID: 'GRID',
    VIDEO: 'VIDEO',
    PDF: 'PDF',
};

export const ELEMENT_DEFINITIONS = [
    { type: ELEMENT_TYPES.TEXT, label: 'Text', icon: 'T' },
    { type: ELEMENT_TYPES.IMAGE, label: 'Imagine', icon: '🖼' },
    { type: ELEMENT_TYPES.VIDEO, label: 'Video', icon: '▶' },
    { type: ELEMENT_TYPES.PDF, label: 'PDF', icon: '📄' },
    { type: ELEMENT_TYPES.SHAPE, label: 'Formă', icon: '◼' },
    { type: ELEMENT_TYPES.BOX, label: 'Container', icon: '▢' },
    { type: ELEMENT_TYPES.GRID, label: 'Grid', icon: '⊞' },
];