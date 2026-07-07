import { useState } from 'react';
import { useEditor } from '../../store/editorStore.jsx';

export default function PreviewPanel() {
    const { meta, settings, elements, solution } = useEditor();
    const [attemptCount, setAttemptCount] = useState(0);
    const [feedback, setFeedback] = useState(null);

    const handleCheck = () => {
        const nextAttempt = attemptCount + 1;
        setAttemptCount(nextAttempt);

        // Placeholder: validarea reală vine la 1.17 per tip exercitiu
        const totalCorrect = solution.correctElementIds.length;

        if (totalCorrect === 0) {
            setFeedback({
                type: 'info',
                message: 'Acest exercițiu nu are încă răspunsuri marcate ca fiind corecte în Soluție.',
            });
            return;
        }

        // Simulare basic: mesaj generic
        const attemptsLeft = settings.maxAttempts - nextAttempt;
        if (attemptsLeft <= 0) {
            setFeedback({
                type: 'fail',
                message: `Ai epuizat cele ${settings.maxAttempts} încercări. ${
                    settings.explanation ? `Explicație: ${settings.explanation}` : ''
                }`,
            });
        } else {
            setFeedback({
                type: 'try',
                message: `Verificare simulată. ${
                    settings.hint ? `Hint: ${settings.hint}` : ''
                } (${attemptsLeft} încercări rămase)`,
            });
        }
    };

    const handleReset = () => {
        setAttemptCount(0);
        setFeedback(null);
    };

    return (
        <div style={styles.panel}>
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <span style={styles.headerBadge}>PREVIZUALIZARE</span>
                    <div style={styles.metaInfo}>
                        <h3 style={styles.metaTitle}>{meta.name || 'Exercițiu'}</h3>
                        {meta.description && (
                            <p style={styles.metaDesc}>{meta.description}</p>
                        )}
                    </div>
                </div>
                <div style={styles.headerRight}>
                    <span style={styles.attemptsInfo}>
                        Încercări: {attemptCount} / {settings.maxAttempts}
                    </span>
                </div>
            </div>

            <div style={styles.body}>
                <div style={styles.leftCol}>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Elemente:</span>
                        <span style={styles.infoValue}>{elements.length}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Marcate corect:</span>
                        <span style={styles.infoValue}>{solution.correctElementIds.length}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Scoring:</span>
                        <span style={styles.infoValue}>
                            {settings.scoringMode === 'integral' ? 'Integral' : 'Parțial'}
                        </span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Feedback:</span>
                        <span style={styles.infoValue}>
                            {settings.feedbackType === 'instant' ? 'Instant' : 'Final'}
                        </span>
                    </div>
                </div>

                <div style={styles.middleCol}>
                    {feedback && (
                        <div style={{
                            ...styles.feedback,
                            background: feedback.type === 'fail'
                                ? '#fef2f2'
                                : feedback.type === 'try'
                                    ? '#fef3c7'
                                    : '#eff6ff',
                            color: feedback.type === 'fail'
                                ? '#991b1b'
                                : feedback.type === 'try'
                                    ? '#92400e'
                                    : '#1e3a8a',
                            borderColor: feedback.type === 'fail'
                                ? '#fecaca'
                                : feedback.type === 'try'
                                    ? '#fde68a'
                                    : '#bfdbfe',
                        }}>
                            {feedback.message}
                        </div>
                    )}
                </div>

                <div style={styles.rightCol}>
                    <button
                        onClick={handleCheck}
                        disabled={attemptCount >= settings.maxAttempts}
                        style={{
                            ...styles.primaryBtn,
                            opacity: attemptCount >= settings.maxAttempts ? 0.5 : 1,
                            cursor: attemptCount >= settings.maxAttempts ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Verifică
                    </button>
                    <button onClick={handleReset} style={styles.secondaryBtn}>
                        Reset
                    </button>
                </div>
            </div>

            <div style={styles.footer}>
                <span style={styles.footerNote}>
                    ℹ️ Verificarea reală se implementează la etapa 1.17 (per tip exercițiu).
                    Momentan preview-ul e vizual — vezi cum va arăta pentru elev.
                </span>
            </div>
        </div>
    );
}

const styles = {
    panel: {
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '14px 20px',
        maxHeight: '38vh',
        overflowY: 'auto',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 10,
        borderBottom: '1px solid #f3f4f6',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    headerBadge: {
        background: '#4F6BF6',
        color: 'white',
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: '0.7rem',
        fontWeight: 800,
        letterSpacing: '0.5px',
    },
    metaInfo: {
        display: 'flex',
        flexDirection: 'column',
    },
    metaTitle: {
        margin: 0,
        fontSize: '0.95rem',
        fontWeight: 800,
        color: '#1a1d23',
    },
    metaDesc: {
        margin: 0,
        fontSize: '0.8rem',
        color: '#6b7280',
    },
    headerRight: {},
    attemptsInfo: {
        fontSize: '0.85rem',
        fontWeight: 700,
        color: '#374151',
        background: '#f3f4f6',
        padding: '6px 12px',
        borderRadius: 8,
    },
    body: {
        display: 'grid',
        gridTemplateColumns: '200px 1fr 160px',
        gap: 20,
        alignItems: 'center',
    },
    leftCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    middleCol: {
        display: 'flex',
        justifyContent: 'center',
    },
    rightCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
    },
    infoLabel: {
        color: '#6b7280',
        fontWeight: 600,
    },
    infoValue: {
        color: '#1a1d23',
        fontWeight: 800,
    },
    feedback: {
        padding: '10px 14px',
        borderRadius: 8,
        fontSize: '0.85rem',
        fontWeight: 600,
        border: '1px solid',
        maxWidth: '100%',
    },
    primaryBtn: {
        background: '#4F6BF6',
        color: 'white',
        border: 'none',
        padding: '10px 16px',
        borderRadius: 10,
        fontSize: '0.9rem',
        fontWeight: 800,
        boxShadow: '0 2px 0 #3a52c4',
    },
    secondaryBtn: {
        background: 'white',
        border: '1.5px solid #e5e7eb',
        color: '#374151',
        padding: '9px 16px',
        borderRadius: 10,
        fontSize: '0.85rem',
        fontWeight: 700,
        cursor: 'pointer',
    },
    footer: {
        paddingTop: 8,
        borderTop: '1px solid #f3f4f6',
    },
    footerNote: {
        fontSize: '0.75rem',
        color: '#9ca3af',
        fontStyle: 'italic',
    },
};