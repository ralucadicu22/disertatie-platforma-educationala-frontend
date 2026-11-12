import { useRef, useState } from 'react';
import api from '../../api/axios';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { getTheme } from '../../constants/themes.js';
import ExerciseFeedbackWidget from '../feedback/ExerciseFeedbackWidget';

export default function VideoPlayer({ exerciseId, config, onExit, isPreview = false }) {
    const [phase, setPhase] = useState('playing');
    const [watched, setWatched] = useState(false);
    const [result, setResult] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const videoRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    const theme = getTheme(config.meta?.themeId || 'formal');

    const videoUrl = config.settings?.videoUrl || config.elements?.find(el => el.role === 'video-zone')?.url || '';
    const minWatchPercent = config.settings?.minWatchPercent ?? 0.8;

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video) return;
        const ratio = video.currentTime / (video.duration || 1);
        if (ratio >= minWatchPercent) setWatched(true);
    };

    const handleEnded = () => setWatched(true);

    const handleFinish = async () => {
        if (isPreview) {
            setResult({ correct: watched, score: watched ? 1 : 0, attemptsRemaining: null, newBadges: [] });
            setPhase('result');
            return;
        }
        setPhase('submitting');
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
            const res = await api.post('/exercises/submit', {
                exerciseId,
                answer: { watched },
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
        setWatched(false); setResult(null); setSubmitError(''); setPhase('playing');
        startTimeRef.current = Date.now();
        if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play(); }
    };

    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;

    const renderVideoEmbed = () => {
        if (!videoUrl) return <div style={styles.noVideo}>Niciun video configurat</div>;
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            const videoId = videoUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
            return (
                <iframe
                    style={styles.iframe}
                    src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="video"
                />
            );
        }
        return (
            <video
                ref={videoRef}
                src={videoUrl}
                controls
                style={styles.video}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
            />
        );
    };

    return (
        <ThemeProvider themeId={config.meta?.themeId}>
            <div style={{ height: '100vh', overflow: 'hidden', background: theme.colors.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: theme.font.family }}>
                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={onExit}>← Ieși</button>
                    <span style={styles.title}>{config.meta?.name || 'Video'}</span>
                    <div style={{ width: 80 }} />
                </div>
                {isPreview && <div style={styles.previewBanner}>🔍 PREVIZUALIZARE — răspunsurile nu se salvează</div>}
                {config.meta?.description && <p style={styles.description}>{config.meta.description}</p>}
                <div style={styles.videoContainer}>
                    {renderVideoEmbed()}
                </div>
                {!watched && (
                    <p style={styles.watchHint}>
                        👆 Urmărește videoclipul până la {Math.round(minWatchPercent * 100)}% pentru a putea continua
                    </p>
                )}
                {submitError && <p style={styles.errorText}>{submitError}</p>}
                {phase !== 'result' && (
                    <button
                        style={{ ...styles.finishBtn, background: theme.colors.primary, borderRadius: theme.borderRadius, opacity: watched ? 1 : 0.5 }}
                        onClick={handleFinish}
                        disabled={phase === 'submitting' || (!watched && !isPreview)}
                    >
                        {phase === 'submitting' ? 'Se trimite...' : 'Am urmărit videoclipul'}
                    </button>
                )}
                {phase === 'result' && result && (
                    <div style={{ ...styles.resultPanel, borderColor: result.correct ? '#22c55e' : '#ef4444', borderRadius: theme.borderRadius }}>
                        <p style={styles.resultTitle}>{result.correct ? '🎉 Felicitări!' : '❌ Trebuie să urmărești videoclipul'}</p>
                        <p style={styles.resultDetail}>Scor: {Math.round(result.score * 100)}%</p>
                        <div style={styles.resultActions}>
                            {!result.correct && !attemptsExhausted && (
                                <button style={{ ...styles.retryBtn, borderRadius: theme.borderRadius }} onClick={handleRetry}>Urmărește din nou</button>
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
    videoContainer: { flex: 1, minHeight: 0, width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' },
    iframe: { width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 12 },
    video: { width: '100%', borderRadius: 12, maxHeight: '100%', outline: 'none' },
    noVideo: { color: '#9ca3af', fontWeight: 600, fontSize: '1rem', textAlign: 'center' },
    watchHint: { fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', marginTop: 8, flexShrink: 0, textAlign: 'center', maxWidth: 400 },
    errorText: { color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', marginTop: 8, flexShrink: 0 },
    finishBtn: { padding: '12px 28px', color: 'white', border: 'none', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', marginTop: 12, flexShrink: 0, transition: 'opacity 0.2s' },
    resultPanel: { marginTop: 16, border: '2px solid', padding: '18px 24px', textAlign: 'center', minWidth: 280, maxWidth: 460, flexShrink: 0 },
    resultTitle: { fontSize: '1.1rem', fontWeight: 900, margin: '0 0 6px 0', color: '#1a1d23' },
    resultDetail: { fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', margin: '0 0 12px 0' },
    resultActions: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
    retryBtn: { padding: '9px 20px', background: '#1a1d23', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },
    quizBtn: { padding: '9px 20px', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },
};
