import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Group, Image as KonvaImage } from 'react-konva';
import api from '../../api/axios';
import PlayerText from './PlayerText';
import PlayerImage from './PlayerImage';
import PlayerShape from './PlayerShape';
import PlayerHotspot from './PlayerHotspot';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { getTheme } from '../../constants/themes.js';
import ExerciseFeedbackWidget from '../feedback/ExerciseFeedbackWidget';
import useImage from 'use-image';

const CONTAINER_PADDING = 40;

export default function TextProblemsPlayer({ exerciseId, config, onExit, isPreview = false }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [answer, setAnswer] = useState('');
    const [phase, setPhase] = useState('playing');
    const [result, setResult] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [hintsAvailable, setHintsAvailable] = useState([]);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [currentHint, setCurrentHint] = useState(null);
    const [showSolutionPanel, setShowSolutionPanel] = useState(false);
    const [newBadges, setNewBadges] = useState([]);
    const [bgImage] = useImage(config.canvas?.backgroundImage || '', 'anonymous');
    const startTimeRef = useRef(Date.now());
    const hintTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    const canvasWidth = config.canvas.width;
    const canvasHeight = config.canvas.height;
    const theme = getTheme(config.meta?.themeId || 'formal');

    const alternativeAnswers = config.solution?.alternativeAnswers || [];
    const isNumeric = config.meta?.type === 'INPUT_NUMERIC';

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            const available = entry.contentRect.width - CONTAINER_PADDING * 2;
            setScale(Math.min(1, available / canvasWidth));
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [canvasWidth]);

    useEffect(() => {
        setHintsAvailable(config.settings?.hints || []);
    }, [config.settings]);

    const normalize = (val) => val.replace(',', '.').trim().toLowerCase();

    const checkCorrect = (submitted) => {
        const norm = normalize(submitted);
        return alternativeAnswers.some(accepted => normalize(String(accepted)) === norm);
    };

    const handleHint = () => {
        if (!hintsAvailable || hintsUsed >= hintsAvailable.length) return;
        const hint = hintsAvailable[hintsUsed];
        setHintsUsed(p => p + 1);
        setCurrentHint(hint);
        if (hint.type === 'TEXT') {
            clearTimeout(hintTimeoutRef.current);
            hintTimeoutRef.current = setTimeout(() => setCurrentHint(null), 4000);
        }
    };

    const handleFinish = async () => {
        if (phase !== 'playing') return;
        if (!answer.trim()) return;

        if (isPreview) {
            const correct = checkCorrect(answer);
            setResult({ correct, score: correct ? 1 : 0, attemptsRemaining: null, newBadges: [] });
            if (!correct && config.settings?.behaviorOnFail === 'showSolution') setShowSolutionPanel(true);
            setPhase('result');
            return;
        }

        setPhase('submitting');
        setSubmitError('');
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
            const res = await api.post('/exercises/submit', {
                exerciseId,
                answer: { text: answer },
                durationSeconds,
            });
            setResult(res.data);
            if (!res.data.correct && res.data.attemptsRemaining === 0) {
                if (res.data.behaviorOnFail === 'showSolution') setShowSolutionPanel(true);
            }
            setPhase('result');
            setShowFeedback(true);
            if (res.data.newBadges?.length > 0) setNewBadges(res.data.newBadges);
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Eroare la trimiterea răspunsului');
            setPhase('playing');
        }
    };

    const handleRetry = () => {
        setAnswer('');
        setResult(null);
        setSubmitError('');
        setPhase('playing');
        setCurrentHint(null);
        setNewBadges([]);
        setHintsUsed(0);
        setShowSolutionPanel(false);
        startTimeRef.current = Date.now();
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const inputZoneEl = (config.elements || []).find(el =>
        el.role === 'input-zone' || el.role === 'input' || el.behavior === 'input'
    );

    const displayElements = (config.elements || []).filter(el =>
        !el.parentId &&
        el.role !== 'input-zone' &&
        el.role !== 'input' &&
        el.behavior !== 'input'
    );

    const getChildren = (parentId) => (config.elements || []).filter(el => el.parentId === parentId);

    const renderElement = (element) => {
        if (element.type === ELEMENT_TYPES.BOX) {
            const children = getChildren(element.id);
            return (
                <Group key={element.id} x={element.x} y={element.y} rotation={element.rotation || 0}>
                    <Rect
                        width={element.width}
                        height={element.height}
                        fill={element.bgFill !== 'transparent' ? element.bgFill : undefined}
                        stroke={element.bgStroke !== 'transparent' ? element.bgStroke : undefined}
                        strokeWidth={element.bgStrokeWidth}
                        cornerRadius={element.bgCornerRadius}
                        listening={false}
                    />
                    {children.map(child => renderElement(child))}
                </Group>
            );
        }
        if (element.type === ELEMENT_TYPES.TEXT) return <PlayerText key={element.id} element={element} />;
        if (element.type === ELEMENT_TYPES.IMAGE) return <PlayerImage key={element.id} element={element} />;
        if (element.type === ELEMENT_TYPES.SHAPE) return <PlayerShape key={element.id} element={element} />;
        if (element.type === ELEMENT_TYPES.HOTSPOT) return <PlayerHotspot key={element.id} element={element} />;
        return null;
    };

    const inputZoneStyle = inputZoneEl
        ? {
            position: 'absolute',
            left: inputZoneEl.x * scale,
            top: inputZoneEl.y * scale,
            width: inputZoneEl.width * scale,
            height: inputZoneEl.height * scale,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8 * scale,
            boxSizing: 'border-box',
        }
        : {
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 0',
            boxSizing: 'border-box',
        };

    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;
    const canShowHint = hintsAvailable.length > 0 && hintsUsed < hintsAvailable.length && phase === 'playing';
    const canSubmit = answer.trim() && phase === 'playing';

    const feedbackType = config.settings?.feedbackType || 'final';
    const isInstant = feedbackType === 'instant';

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && canSubmit) handleFinish();
    };

    const handleInstantChange = (val) => {
        setAnswer(val);
        if (isInstant && phase === 'playing' && result) {
            setResult(null);
        }
    };

    const getInputBorderColor = () => {
        if (phase !== 'result' || !result) return '#4F6BF6';
        return result.correct ? '#22c55e' : '#ef4444';
    };

    return (
        <ThemeProvider themeId={config.meta?.themeId}>
            <div style={{
                height: '100vh', overflow: 'hidden',
                background: theme.colors?.surface || '#f9fafb',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                fontFamily: theme.font?.family || 'inherit',
            }}>
                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={onExit}>← Ieși</button>
                    <div style={styles.progress}>Rezolvă problema</div>
                    <div style={{ width: 80 }} />
                </div>

                {isPreview && (
                    <div style={styles.previewBanner}>
                        🔍 PREVIZUALIZARE — răspunsurile nu se salvează
                    </div>
                )}

                {alternativeAnswers.length === 0 && (
                    <div style={styles.warningBanner}>
                        ⚠️ Niciun răspuns configurat în Soluție. Adaugă răspunsuri acceptate din panoul Soluție.
                    </div>
                )}

                <div ref={containerRef} style={styles.canvasContainer}>
                    <div style={{ position: 'relative', width: inputZoneEl ? canvasWidth * scale : '100%', maxWidth: canvasWidth * scale }}>
                        <Stage
                            width={canvasWidth * scale}
                            height={canvasHeight * scale}
                            scaleX={scale} scaleY={scale}
                        >
                            <Layer>
                                <Rect
                                    x={0} y={0}
                                    width={canvasWidth} height={canvasHeight}
                                    fill={config.canvas?.background || '#ffffff'}
                                    listening={false}
                                />
                                {bgImage && (
                                    <KonvaImage
                                        image={bgImage}
                                        x={0} y={0}
                                        width={canvasWidth} height={canvasHeight}
                                        listening={false}
                                    />
                                )}
                                {displayElements.map(el => renderElement(el))}
                            </Layer>
                        </Stage>

                        <div style={inputZoneStyle}>
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {inputZoneEl?.label && (
                                    <span style={{ fontSize: 13 * (inputZoneEl ? scale : 1), fontWeight: 600, color: '#6b7280' }}>
                                        {inputZoneEl.label}
                                    </span>
                                )}
                                <input
                                    ref={inputRef}
                                    type={isNumeric ? 'number' : 'text'}
                                    value={answer}
                                    onChange={e => handleInstantChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={phase === 'submitting' || (phase === 'result' && !isInstant)}
                                    placeholder={isNumeric ? 'Scrie numărul...' : 'Scrie răspunsul...'}
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        fontSize: inputZoneEl ? (15 * scale) : 18,
                                        fontWeight: 700,
                                        textAlign: 'center',
                                        border: `2.5px solid ${getInputBorderColor()}`,
                                        borderRadius: inputZoneEl ? 8 * scale : 12,
                                        background: phase === 'result' && result
                                            ? result.correct ? '#f0fdf4' : '#fef2f2'
                                            : 'white',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        padding: inputZoneEl ? `${6 * scale}px ${10 * scale}px` : '14px 20px',
                                        transition: 'border-color 0.2s, background 0.2s',
                                    }}
                                />
                                {phase === 'result' && result && (
                                    <div style={{
                                        textAlign: 'center',
                                        fontSize: inputZoneEl ? 13 * scale : 15,
                                        fontWeight: 700,
                                        color: result.correct ? '#15803d' : '#b91c1c',
                                        marginTop: 4,
                                    }}>
                                        {result.correct ? '✓ Corect!' : '✗ Răspuns greșit'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {currentHint && (
                    <div style={styles.hintBox}>
                        <span>💡</span>
                        <span style={styles.hintText}>{currentHint.text || 'Hint disponibil'}</span>
                    </div>
                )}

                {submitError && <p style={styles.errorText}>{submitError}</p>}

                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {canShowHint && (
                        <button style={{ ...styles.hintBtn, borderRadius: theme.borderRadius || 10 }} onClick={handleHint}>
                            💡 Hint ({hintsAvailable.length - hintsUsed} rămas)
                        </button>
                    )}

                    {phase !== 'result' && (
                        <button
                            style={{
                                ...styles.finishBtn,
                                background: canSubmit ? (theme.colors?.primary || '#4F6BF6') : '#e5e7eb',
                                color: canSubmit ? 'white' : '#9ca3af',
                                borderRadius: theme.borderRadius || 10,
                                cursor: canSubmit ? 'pointer' : 'not-allowed',
                            }}
                            onClick={handleFinish}
                            disabled={!canSubmit || phase === 'submitting'}
                        >
                            {phase === 'submitting' ? 'Se trimite...' : 'Verifică'}
                        </button>
                    )}

                    {phase === 'result' && result && (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {showSolutionPanel && alternativeAnswers.length > 0 && (
                                <div style={styles.solutionBox}>
                                    <p style={styles.solutionTitle}>✅ Răspunsuri acceptate:</p>
                                    {alternativeAnswers.map((a, i) => (
                                        <span key={i} style={styles.solutionItem}>{a}{i < alternativeAnswers.length - 1 ? ', ' : ''}</span>
                                    ))}
                                </div>
                            )}
                            {!result.correct && !attemptsExhausted && config.settings?.behaviorOnFail === 'retry' && (
                                <button style={{ ...styles.retryBtn, borderRadius: theme.borderRadius || 10 }} onClick={handleRetry}>
                                    🔄 Încearcă din nou
                                </button>
                            )}
                            <button
                                style={{ ...styles.quizBtn, background: theme.colors?.primary || '#4F6BF6', borderRadius: theme.borderRadius || 10 }}
                                onClick={onExit}
                            >
                                {isPreview ? 'Închide preview' : 'Înapoi la quiz'}
                            </button>
                        </div>
                    )}
                </div>

                {!isPreview && newBadges.length > 0 && (
                    <div style={styles.badgeBox}>
                        <p style={styles.badgeTitle}>🎉 Badge-uri noi câștigate!</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {newBadges.map(badge => (
                                <div key={badge.id} style={styles.badgeItem}>
                                    <div style={{ fontSize: '2rem', marginBottom: 4 }}>{badge.icon}</div>
                                    <p style={styles.badgeName}>{badge.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!isPreview && showFeedback && (
                    <ExerciseFeedbackWidget exerciseId={exerciseId} onDismiss={() => setShowFeedback(false)} />
                )}
            </div>
        </ThemeProvider>
    );
}

const styles = {
    header: {
        width: '100%', background: 'white', borderBottom: '1px solid #e5e7eb',
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
    },
    backBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '0.9rem', color: '#6b7280', fontWeight: 600, padding: '6px 10px',
    },
    progress: { fontSize: '0.9rem', fontWeight: 700, color: '#374151' },
    previewBanner: {
        width: '100%', background: '#fef3c7', borderBottom: '1px solid #fbbf24',
        padding: '6px 20px', fontSize: '0.78rem', fontWeight: 700, color: '#92400e',
        textAlign: 'center', flexShrink: 0,
    },
    warningBanner: {
        width: '100%', background: '#fef2f2', borderBottom: '1px solid #fca5a5',
        padding: '6px 20px', fontSize: '0.78rem', fontWeight: 700, color: '#991b1b',
        textAlign: 'center', flexShrink: 0,
    },
    canvasContainer: {
        flex: 1, overflow: 'auto', display: 'flex',
        alignItems: 'flex-start', justifyContent: 'center', width: '100%', padding: 20,
        boxSizing: 'border-box',
    },
    hintBox: {
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#f0f4ff', border: '1.5px solid #4F6BF6',
        borderRadius: 10, padding: '10px 16px', maxWidth: 420,
        margin: '8px 0', flexShrink: 0,
    },
    hintText: { fontSize: '0.88rem', color: '#1e3a8a', fontWeight: 500 },
    hintBtn: {
        background: '#fef9c3', border: '1.5px solid #fbbf24', color: '#92400e',
        padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
    },
    finishBtn: {
        border: 'none', padding: '12px 32px',
        fontWeight: 800, fontSize: '0.95rem',
    },
    errorText: { color: '#ef4444', fontSize: '0.85rem', margin: '8px 0', flexShrink: 0 },
    solutionBox: {
        background: '#f0fdf4', border: '2px solid #86efac',
        borderRadius: 10, padding: '10px 16px', textAlign: 'center',
    },
    solutionTitle: { fontSize: '0.82rem', fontWeight: 800, color: '#166534', margin: '0 0 4px 0' },
    solutionItem: { fontSize: '0.9rem', fontWeight: 700, color: '#15803d' },
    retryBtn: {
        background: '#f3f4f6', border: '1.5px solid #d1d5db', color: '#374151',
        padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
    },
    quizBtn: {
        color: 'white', border: 'none', padding: '10px 24px',
        fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
    },
    badgeBox: {
        marginTop: 16, background: 'white', border: '2px solid #fbbf24',
        borderRadius: 14, padding: '18px 24px', textAlign: 'center', minWidth: 280,
    },
    badgeTitle: { fontSize: '1rem', fontWeight: 900, color: '#92400e', marginBottom: 12 },
    badgeItem: {
        background: '#fffbeb', border: '1.5px solid #fde68a',
        borderRadius: 10, padding: '10px 14px', textAlign: 'center',
    },
    badgeName: { fontSize: '0.8rem', fontWeight: 800, color: '#92400e' },
};
