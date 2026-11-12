import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Group, Image as KonvaImage } from 'react-konva';
import api from '../../api/axios';
import PlayerText from './PlayerText';
import PlayerImage from './PlayerImage';
import PlayerShape from './PlayerShape';
import PlayerHotspot from './PlayerHotspot';
import ParticleBurst from './ParticleBurst';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { getTheme } from '../../constants/themes.js';
import ExerciseFeedbackWidget from '../feedback/ExerciseFeedbackWidget';
import useImage from 'use-image';

const CONTAINER_PADDING = 40;

export default function FindAndCountPlayer({ exerciseId, config, onExit, isPreview = false }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [counts, setCounts] = useState({});
    const [phase, setPhase] = useState('playing');
    const [result, setResult] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [bursts, setBursts] = useState([]);
    const [hintsAvailable, setHintsAvailable] = useState([]);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [currentHint, setCurrentHint] = useState(null);
    const [showSolutionPanel, setShowSolutionPanel] = useState(false);
    const [newBadges, setNewBadges] = useState([]);
    const [bgImage] = useImage(config.canvas?.backgroundImage || '', 'anonymous');
    const startTimeRef = useRef(Date.now());
    const hintTimeoutRef = useRef(null);

    const canvasWidth = config.canvas.width;
    const canvasHeight = config.canvas.height;
    const theme = getTheme(config.meta?.themeId || 'formal');

    const correctCounts = useMemo(() => config.solution?.correctCounts || {}, [config.solution]);
    const categories = useMemo(() => Object.keys(correctCounts), [correctCounts]);

    const solutionElements = useMemo(
        () => (config.elements || []).filter(el => el.role === 'solution' || el.behavior === 'countTarget'),
        [config.elements]
    );

    useEffect(() => {
        const init = {};
        categories.forEach(cat => { init[cat] = 0; });
        setCounts(init);
    }, [categories]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const resize = () => {
            const availableWidth = el.clientWidth - CONTAINER_PADDING;
            const availableHeight = el.clientHeight - CONTAINER_PADDING;
            setScale(Math.min(1, availableWidth / canvasWidth, availableHeight / canvasHeight));
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(el);
        return () => observer.disconnect();
    }, [canvasWidth, canvasHeight]);

    useEffect(() => {
        setHintsAvailable(config.settings?.hints || []);
    }, [config.settings]);

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

    const handleCountChange = (category, delta) => {
        if (phase !== 'playing') return;
        setCounts(prev => ({
            ...prev,
            [category]: Math.max(0, (prev[category] || 0) + delta),
        }));
    };

    const handleFinish = async () => {
        if (isPreview) {
            let correct = 0;
            const total = categories.length;
            categories.forEach(cat => {
                if ((counts[cat] || 0) === correctCounts[cat]) correct++;
            });
            setResult({
                correct: correct === total,
                score: total > 0 ? correct / total : 0,
                attemptsRemaining: null,
                newBadges: [],
            });
            setPhase('result');
            return;
        }
        setPhase('submitting');
        setSubmitError('');
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
            const res = await api.post('/exercises/submit', {
                exerciseId,
                answer: counts,
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
        const init = {};
        categories.forEach(cat => { init[cat] = 0; });
        setCounts(init);
        setResult(null);
        setSubmitError('');
        setPhase('playing');
        setCurrentHint(null);
        setNewBadges([]);
        setHintsUsed(0);
        startTimeRef.current = Date.now();
    };

    const topLevelElements = (config.elements || []).filter(el => !el.parentId);
    const getChildren = (parentId) => (config.elements || []).filter(el => el.parentId === parentId);

    const renderElement = (element) => {
        if (element.role === 'solution' || element.behavior === 'countTarget') return null;
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

    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;
    const canShowHint = !isPreview && hintsAvailable.length > 0 && hintsUsed < hintsAvailable.length && phase === 'playing';

    return (
        <ThemeProvider themeId={config.meta?.themeId}>
            <div style={{
                height: '100vh', overflow: 'hidden',
                background: theme.colors.surface,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                fontFamily: theme.font.family,
            }}>
                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={onExit}>← Ieși</button>
                    <div style={styles.progress}>Numără și completează</div>
                    <div style={{ width: 80 }} />
                </div>

                {isPreview && (
                    <div style={styles.previewBanner}>
                        🔍 PREVIZUALIZARE — răspunsurile nu se salvează
                    </div>
                )}

                <div ref={containerRef} style={styles.canvasContainer}>
                    <div style={{ position: 'relative', width: canvasWidth * scale, height: canvasHeight * scale }}>
                        <Stage
                            width={canvasWidth * scale}
                            height={canvasHeight * scale}
                            scaleX={scale} scaleY={scale}
                        >
                            <Layer>
                                <Rect
                                    x={0} y={0}
                                    width={canvasWidth} height={canvasHeight}
                                    fill={config.canvas.background || '#ffffff'}
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
                                {topLevelElements.map(el => renderElement(el))}
                                {bursts.map(burst => (
                                    <ParticleBurst
                                        key={burst.id}
                                        x={burst.x} y={burst.y}
                                        onComplete={() => setBursts(prev => prev.filter(b => b.id !== burst.id))}
                                    />
                                ))}
                            </Layer>
                        </Stage>

                        {solutionElements.map(el => (
                            <div
                                key={el.id}
                                style={{
                                    position: 'absolute',
                                    left: el.x * scale,
                                    top: el.y * scale,
                                    width: el.width * scale,
                                    height: el.height * scale,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8 * scale,
                                    padding: `${4 * scale}px ${8 * scale}px`,
                                    background: 'rgba(255,255,255,0.9)',
                                    borderRadius: 8 * scale,
                                    border: '1.5px solid #e5e7eb',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <span style={{ fontSize: 13 * scale, fontWeight: 600, color: '#374151', flex: 1 }}>
                                    {el.label || el.category || el.id}
                                </span>
                                <button
                                    style={{ ...styles.counterBtn, fontSize: 14 * scale }}
                                    onClick={() => handleCountChange(el.category || el.id, -1)}
                                    disabled={phase !== 'playing'}
                                >−</button>
                                <span style={{ fontSize: 16 * scale, fontWeight: 700, minWidth: 24 * scale, textAlign: 'center' }}>
                                    {counts[el.category || el.id] || 0}
                                </span>
                                <button
                                    style={{ ...styles.counterBtn, fontSize: 14 * scale }}
                                    onClick={() => handleCountChange(el.category || el.id, 1)}
                                    disabled={phase !== 'playing'}
                                >+</button>
                            </div>
                        ))}

                        {solutionElements.length === 0 && categories.map((cat, i) => (
                            <div
                                key={cat}
                                style={{
                                    position: 'absolute',
                                    left: 16 * scale,
                                    top: (canvasHeight - (categories.length - i) * 56) * scale,
                                    width: (canvasWidth - 32) * scale,
                                    height: 48 * scale,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8 * scale,
                                    padding: `${4 * scale}px ${12 * scale}px`,
                                    background: 'rgba(255,255,255,0.92)',
                                    borderRadius: 8 * scale,
                                    border: '1.5px solid #e5e7eb',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <span style={{ fontSize: 13 * scale, fontWeight: 600, color: '#374151', flex: 1 }}>{cat}</span>
                                <button
                                    style={{ ...styles.counterBtn, fontSize: 14 * scale }}
                                    onClick={() => handleCountChange(cat, -1)}
                                    disabled={phase !== 'playing'}
                                >−</button>
                                <span style={{ fontSize: 16 * scale, fontWeight: 700, minWidth: 24 * scale, textAlign: 'center' }}>
                                    {counts[cat] || 0}
                                </span>
                                <button
                                    style={{ ...styles.counterBtn, fontSize: 14 * scale }}
                                    onClick={() => handleCountChange(cat, 1)}
                                    disabled={phase !== 'playing'}
                                >+</button>
                            </div>
                        ))}
                    </div>
                </div>

                {currentHint && (
                    <div style={styles.hintBox}>
                        <span>💡</span>
                        <span style={styles.hintText}>{currentHint.text || 'Hint disponibil'}</span>
                    </div>
                )}

                {submitError && <p style={styles.errorText}>{submitError}</p>}

                {phase !== 'result' && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 12, flexShrink: 0 }}>
                        {canShowHint && (
                            <button style={{ ...styles.hintBtn, borderRadius: theme.borderRadius }} onClick={handleHint}>
                                💡 Hint ({hintsAvailable.length - hintsUsed} rămas)
                            </button>
                        )}
                        <button
                            style={{
                                ...styles.finishBtn,
                                background: theme.colors.primary,
                                borderRadius: theme.borderRadius,
                            }}
                            onClick={handleFinish}
                            disabled={phase === 'submitting'}
                        >
                            {phase === 'submitting' ? 'Se trimite...' : 'Verifică'}
                        </button>
                    </div>
                )}

                {phase === 'result' && result && (
                    <div style={{
                        ...styles.resultPanel,
                        borderColor: result.correct ? '#22c55e' : '#ef4444',
                        borderRadius: theme.borderRadius,
                        background: theme.colors.surface,
                    }}>
                        <p style={styles.resultTitle}>{result.correct ? '🎉 Corect!' : '❌ Nu e chiar corect'}</p>
                        <p style={styles.resultDetail}>
                            Scor: {Math.round(result.score * 100)}%
                            {!result.correct && result.attemptsRemaining !== null &&
                                ` · Încercări rămase: ${result.attemptsRemaining}`}
                        </p>
                        {showSolutionPanel && (
                            <div style={styles.solutionBox}>
                                <p style={styles.solutionTitle}>✅ Răspunsuri corecte:</p>
                                {categories.map(cat => (
                                    <p key={cat} style={styles.solutionItem}>
                                        {cat}: <strong>{correctCounts[cat]}</strong>
                                    </p>
                                ))}
                            </div>
                        )}
                        <div style={styles.resultActions}>
                            {!result.correct && !attemptsExhausted && (
                                <button style={{ ...styles.retryBtn, borderRadius: theme.borderRadius }} onClick={handleRetry}>
                                    Încearcă din nou
                                </button>
                            )}
                            <button
                                style={{ ...styles.quizBtn, background: theme.colors.primary, borderRadius: theme.borderRadius }}
                                onClick={onExit}
                            >
                                {isPreview ? 'Închide preview' : 'Înapoi la quiz'}
                            </button>
                        </div>
                        {attemptsExhausted && <p style={styles.exhaustedText}>Ai epuizat numărul de încercări.</p>}
                    </div>
                )}

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
    canvasContainer: {
        flex: 1, overflow: 'hidden', display: 'flex',
        alignItems: 'center', justifyContent: 'center', width: '100%', padding: 20,
        boxSizing: 'border-box',
    },
    counterBtn: {
        width: 28, height: 28, borderRadius: 6,
        border: '1.5px solid #d1d5db', background: 'white',
        cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
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
        color: 'white', border: 'none', padding: '12px 28px',
        fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
    },
    errorText: { color: '#ef4444', fontSize: '0.85rem', margin: '8px 0', flexShrink: 0 },
    resultPanel: {
        margin: '12px 20px', border: '2px solid', padding: '20px 24px',
        borderRadius: 14, textAlign: 'center', maxWidth: 480, width: '100%', flexShrink: 0,
    },
    resultTitle: { fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px 0' },
    resultDetail: { fontSize: '0.9rem', color: '#6b7280', margin: '0 0 16px 0' },
    resultActions: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 },
    retryBtn: {
        background: '#f3f4f6', border: '1.5px solid #d1d5db', color: '#374151',
        padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
    },
    quizBtn: {
        color: 'white', border: 'none', padding: '10px 20px',
        fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
    },
    exhaustedText: { fontSize: '0.82rem', color: '#ef4444', marginTop: 8 },
    solutionBox: {
        background: '#f0fdf4', border: '2px solid #86efac',
        borderRadius: 10, padding: '12px 16px', margin: '10px 0', textAlign: 'left',
    },
    solutionTitle: { fontSize: '0.82rem', fontWeight: 800, color: '#166534', margin: '0 0 6px 0' },
    solutionItem: { fontSize: '0.85rem', color: '#374151', margin: '3px 0' },
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
