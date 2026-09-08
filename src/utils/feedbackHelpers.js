export const FEEDBACK_TAG_LABELS = {
    ENCOURAGEMENT: { label: 'Incurajare', emoji: '💪', color: 'primary' },
    PRAISE:        { label: 'Felicitare', emoji: '🎉', color: 'success' },
    IMPROVEMENT_NEEDED: { label: 'De imbunatatit', emoji: '📈', color: 'warning' },
    WARNING:       { label: 'Atentie', emoji: '⚠️', color: 'danger' },
};

export const getFeedbackTag = (tag) =>
    FEEDBACK_TAG_LABELS[tag] || { label: tag, emoji: '💬', color: 'neutral' };

export const RATING_STARS = (rating) => {
    if (!rating) return null;
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
};