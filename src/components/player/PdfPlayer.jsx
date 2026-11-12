import { useRef, useState } from 'react';
import api from '../../api/axios';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { getTheme } from '../../constants/themes.js';
import ExerciseFeedbackWidget from '../feedback/ExerciseFeedbackWidget';

export default function PdfPlayer({ exerciseId, config, onExit, isPreview = false }) {
    const [phase, setPhase] = useState('playing');
    const [opened, setOpened] = useState(false);
    const [result, setResult] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const startTimeRef = useRef(Date.now());

    const theme = getTheme(config.meta?.themeId || 'formal');

    const pdfUrl = config.settings?.pdfUrl || config.elements?.find(el => el.role === 'pdf-zone')?.url || '';
    const requiresOpen = config.settings?.requiresOpen ?? true;

    const handleOpen = () => {
        setOpened(true);
        if (pdfUrl) window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    };

    const handleFinish = async () => {
        if (isPreview) {
            const ok = !requiresOpen || opened;
            setResult({ correct: ok, score: ok ? 1 : 0, attemptsRemaining: null, newBadges: [] });
            setPhase('result');
            return;
        }
        setPhase('submitting');
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
            const res = await api.post('/exercises/submit', {
                exerciseId,
                answer: { opened },
                durationSeconds,
            });
            setResult(res.data);
            setPhase('result');
            setShowFeedback(true);
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Eroare la trimitere');
            setPhase('playing');
        }
    };

    const handleRetry = () => {
        setOpened(false); setResult(null); setSubmitError(''); setPhase('playing');
        startTimeRef.current = Date.now();
    };

    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;
    const canSubmit = !requiresOpen || opened;

    return (
        <ThemeProvider themeId={config.meta?.themeId}>
            <div style={{ height: '100vh', overflow: 'hidden', background: theme.colors.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: theme.font.family }}>
                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={onExit}>← Ieși</button>
                    <span style={styles.title}>{config.meta?.name || 'Document PDF'}</span>
                    <div style={{ width: 80 }} />
                </div>
                {isPreview && <div style={styles.previewBanner}>🔍 PREVIZUALIZARE — răspunsurile nu se salvează</div>}
                {config.meta?.description && <p style={styles.description}>{config.meta.description}</p>}

                <div style={styles.pdfCard}>
                    <div style={styles.pdfIcon}>📄</div>
                    <p style={styles.pdfName}>{config.settings?.pdfName || 'Document.pdf'}</p>
                    {pdfUrl ? (
                        <button
                            style={{ ...styles.openBtn, background: opened ? '#22c55e' : theme.colors.primary, borderRadius: theme.borderRadius }}
                            onClick={handleOpen}
                        >
                            {opened ? '✓ Document deschis' : 'Deschide PDF'}
                        </button>
                    ) : (
                        <p style={styles.noUrl}>Niciun URL configurat pentru PDF</p>
                    )}

                    {pdfUrl && (
                        <div style={styles.embedWrapper}>
                            <iframe
                                src={pdfUrl}
                                style={styles.pdfEmbed}
                                title="pdf-preview"
                                onLoad={() => setOpened(true)}
                            />
                        </div>
                    )}
                </div>

                {requiresOpen && !opened && (
                    <p style={styles.hint}>👆 Deschide documentul pentru a putea continua</p>
                )}

                {submitError && <p style={styles.errorText}>{submitError}</p>}

                {phase !== 'result' && (
                    <button
                        style={{ ...styles.finishBtn, background: theme.colors.primary, borderRadius: theme.borderRadius, opacity: canSubmit ? 1 : 0.5 }}
                        onClick={handleFinish}
                        disabled={phase === 'submitting' || !canSubmit}
                    >
                        {phase === 'submitting' ? 'Se trimite...' : 'Am citit documentul'}
                    </button>
                )}

                {phase === 'result' && result && (
                    <div style={{ ...styles.resultPanel, borderColor: result.correct ? '#22c55e' : '#ef4444', borderRadius: theme.borderRadius }}>
                        <p style={styles.resultTitle}>{result.correct ? '🎉 Felicitări!' : '❌ Trebuie să deschizi documentul'}</p>
                        <p style={styles.resultDetail}>Scor: {Math.round(result.score * 100)}%</p>
                        <div style={styles.resultActions}>
                            {!result.correct && !attemptsExhausted && (
                                <button style={{ ...styles.retryBtn, borderRadius: theme.borderRadius }} onClick={handleRetry}>Încearcă din nou</button>
                            )}
                            <button style={{ ...styles.quizBtn, background: theme.colors.primary, borderRadius: theme.borderRadius }} onClick={onExit}>
                                {isPreview ? 'Închide preview' : 'Înapoi'}
                            </button>
                        </div>
                    </div>
                )}

                {!isPreview && showFeedback && <ExerciseFeedbackWidget exerciseId={exerciseId} onDismiss={() => setShowFeedback(false)} />}
            </div>
        </ThemeProvider>
    );
}

const styles = {
    header: { width: '100%', background: 'white', borderBottom: '1px solid #e5e7eb', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
    backBtn: { background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#6b7280' },
    title: { fontWeight: 800, fontSize: '0.95rem', color: '#1a1d23' },
    previewBanner: { width: '100%', background: '#fef3c7', borderBottom: '1px solid #fde68a', padding: '8px 20px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: '#92400e', flexShrink: 0 },
    description: { maxWidth: 640, textAlign: 'center', color: '#6b7280', fontWeight: 600, fontSize: '0.9rem', margin: '16px 20px 0', flexShrink: 0 },
    pdfCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'white', border: '2px solid #e5e7eb', borderRadius: 16, padding: '28px 32px', marginTop: 24, maxWidth: 600, width: '90%', flexShrink: 0 },
    pdfIcon: { fontSize: '3.5rem' },
    pdfName: { fontSize: '1rem', fontWeight: 800, color: '#1a1d23', margin: 0, textAlign: 'center' },
    openBtn: { padding: '10px 24px', color: 'white', border: 'none', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', transition: 'background 0.2s' },
    noUrl: { color: '#9ca3af', fontSize: '0.85rem', fontWeight: 600, margin: 0 },
    embedWrapper: { width: '100%', height: 300, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', marginTop: 8 },
    pdfEmbed: { width: '100%', height: '100%', border: 'none' },
    hint: { fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', marginTop: 12, flexShrink: 0, textAlign: 'center', maxWidth: 400 },
    errorText: { color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', marginTop: 8, flexShrink: 0 },
    finishBtn: { padding: '12px 28px', color: 'white', border: 'none', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', marginTop: 16, flexShrink: 0, transition: 'opacity 0.2s' },
    resultPanel: { marginTop: 16, border: '2px solid', padding: '18px 24px', textAlign: 'center', minWidth: 280, maxWidth: 460, flexShrink: 0 },
    resultTitle: { fontSize: '1.1rem', fontWeight: 900, margin: '0 0 6px 0', color: '#1a1d23' },
    resultDetail: { fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', margin: '0 0 12px 0' },
    resultActions: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
    retryBtn: { padding: '9px 20px', background: '#1a1d23', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },
    quizBtn: { padding: '9px 20px', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },
};
