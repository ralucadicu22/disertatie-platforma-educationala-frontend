import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import api from '../../api/axios';
import PlayerText from './PlayerText';
import PlayerImage from './PlayerImage';
import PlayerShape from './PlayerShape';
import ParticleBurst from './ParticleBurst';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { getTheme } from '../../constants/themes.js';
import ExerciseFeedbackWidget from '../feedback/ExerciseFeedbackWidget';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CONTAINER_PADDING = 40;

export default function FindAndSelectPlayer({ exerciseId, config, onExit }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);

    const [foundIds, setFoundIds] = useState(() => new Set());
    const [shakingId, setShakingId] = useState(null);
    const [bursts, setBursts] = useState([]);
    const [phase, setPhase] = useState('playing');
    const [result, setResult] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [classAverage, setClassAverage] = useState(null);
    const [newBadges, setNewBadges] = useState([]);

    const [hintsAvailable, setHintsAvailable] = useState([]);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [currentHint, setCurrentHint] = useState(null);
    const [highlightedIds, setHighlightedIds] = useState(new Set());
    const [animatingIds, setAnimatingIds] = useState(new Set());

    const canvasWidth = config.canvas.width;
    const canvasHeight = config.canvas.height;

    const correctElementIds = useMemo(
        () => new Set(config.solution?.correctElementIds || []),
        [config.solution]
    );
    const totalCorrect = correctElementIds.size;
    const maxAttempts = config.settings?.maxAttempts || 0;
    const theme = getTheme(config.meta?.themeId || 'formal');

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const resize = () => {
            const availableWidth = el.clientWidth - CONTAINER_PADDING;
            setScale(Math.min(1, availableWidth / canvasWidth));
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(el);
        return () => observer.disconnect();
    }, [canvasWidth]);

    useEffect(() => {
        api.get(`/exercises/${exerciseId}/hints/available`)
            .then(res => setHintsAvailable(res.data || []))
            .catch(() => {});
    }, [exerciseId]);

    const shakeTimeoutRef = useRef(null);

    const handleElementClick = (element) => {
        if (phase !== 'playing') return;
        if (foundIds.has(element.id)) return;

        if (correctElementIds.has(element.id)) {
            setFoundIds(prev => new Set(prev).add(element.id));
            setBursts(prev => [
                ...prev,
                {
                    id: `${element.id}_${Date.now()}`,
                    x: element.x + element.width / 2,
                    y: element.y + element.height / 2,
                },
            ]);
        } else {
            clearTimeout(shakeTimeoutRef.current);
            setShakingId(element.id);
            shakeTimeoutRef.current = setTimeout(() => setShakingId(null), 320);
        }
    };

    const removeBurst = (id) => setBursts(prev => prev.filter(b => b.id !== id));

    const handleHint = () => {
        if (!hintsAvailable || hintsUsed >= hintsAvailable.length) return;

        const hint = hintsAvailable[hintsUsed];
        setHintsUsed(prev => prev + 1);
        setCurrentHint(hint);

        if (hint.type === 'HIGHLIGHT' && hint.targetElementId) {
            setHighlightedIds(prev => new Set([...prev, hint.targetElementId]));
            setTimeout(() => {
                setHighlightedIds(prev => {
                    const next = new Set(prev);
                    next.delete(hint.targetElementId);
                    return next;
                });
            }, 3000);
        }

        if (hint.type === 'ANIMATION' && hint.targetElementId) {
            setAnimatingIds(prev => new Set([...prev, hint.targetElementId]));
            setTimeout(() => {
                setAnimatingIds(prev => {
                    const next = new Set(prev);
                    next.delete(hint.targetElementId);
                    return next;
                });
            }, 1500);
        }
    };

    const handleFinish = async () => {
        setPhase('submitting');
        setSubmitError('');
        try {
            const res = await api.post('/exercises/submit', {
                exerciseId,
                answer: Array.from(foundIds),
            });
            setResult(res.data);
            setPhase('result');
            setShowFeedback(true);

            if (res.data.newBadges?.length > 0) {
                setNewBadges(res.data.newBadges);
            }

            if (config.settings?.showGroupAverage) {
                api.get(`/progress/exercise/${exerciseId}/class-average`)
                    .then(r => setClassAverage(r.data))
                    .catch(() => {});
            }
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Eroare la trimiterea răspunsului');
            setPhase('playing');
        }
    };

    const handleRetry = () => {
        setFoundIds(new Set());
        setResult(null);
        setSubmitError('');
        setPhase('playing');
        setCurrentHint(null);
        setHighlightedIds(new Set());
        setAnimatingIds(new Set());
        setNewBadges([]);
    };

    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;
    const canShowHint = hintsAvailable.length > 0 && hintsUsed < hintsAvailable.length && phase === 'playing';

    return (
        <ThemeProvider themeId={config.meta?.themeId}>
            <div style={{
                minHeight: '100vh',
                background: theme.colors.surface,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingBottom: 32,
                fontFamily: theme.font.family,
            }}>
                {/* Header */}
                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={onExit}>← Ieși</button>
                    <div style={styles.progress}>
                        {totalCorrect > 0 ? `${foundIds.size}/${totalCorrect} găsite` : ''}
                    </div>
                    <div style={{ width: 80 }} />
                </div>

                {config.meta?.description && (
                    <p style={styles.description}>{config.meta.description}</p>
                )}

                <div ref={containerRef} style={styles.canvasContainer}>
                    <div style={{ width: canvasWidth * scale, height: canvasHeight * scale }}>
                        <Stage
                            width={canvasWidth * scale}
                            height={canvasHeight * scale}
                            scaleX={scale}
                            scaleY={scale}
                        >
                            <Layer>
                                <Rect
                                    x={0} y={0}
                                    width={canvasWidth}
                                    height={canvasHeight}
                                    fill={config.canvas.background || '#ffffff'}
                                    listening={false}
                                />
                                {config.elements.map(element => {
                                    const interactionState =
                                        foundIds.has(element.id) ? 'found'
                                            : shakingId === element.id ? 'shake'
                                                : highlightedIds.has(element.id) ? 'highlight'
                                                    : animatingIds.has(element.id) ? 'animate'
                                                        : undefined;

                                    switch (element.type) {
                                        case ELEMENT_TYPES.TEXT:
                                            return <PlayerText key={element.id} element={element} />;
                                        case ELEMENT_TYPES.IMAGE:
                                            return (
                                                <PlayerImage
                                                    key={element.id}
                                                    element={element}
                                                    interactionState={interactionState}
                                                    onElementClick={handleElementClick}
                                                />
                                            );
                                        case ELEMENT_TYPES.SHAPE:
                                            return (
                                                <PlayerShape
                                                    key={element.id}
                                                    element={element}
                                                    interactionState={interactionState}
                                                    onElementClick={handleElementClick}
                                                />
                                            );
                                        default:
                                            return null;
                                    }
                                })}
                                {bursts.map(burst => (
                                    <ParticleBurst
                                        key={burst.id}
                                        x={burst.x}
                                        y={burst.y}
                                        onComplete={() => removeBurst(burst.id)}
                                    />
                                ))}
                            </Layer>
                        </Stage>
                    </div>
                </div>

                {currentHint && (
                    <div style={{
                        ...styles.hintBox,
                        borderColor: currentHint.type === 'HIGHLIGHT' ? '#f59e0b'
                            : currentHint.type === 'ANIMATION' ? '#8b5cf6'
                                : '#4F6BF6',
                        background: currentHint.type === 'HIGHLIGHT' ? '#fffbeb'
                            : currentHint.type === 'ANIMATION' ? '#f5f3ff'
                                : '#f0f4ff',
                    }}>
                        <span style={styles.hintIcon}>
                            {currentHint.type === 'HIGHLIGHT' ? '🔦'
                                : currentHint.type === 'ANIMATION' ? '✨'
                                    : '💡'}
                        </span>
                        <span style={styles.hintText}>
                            {currentHint.text || (
                                currentHint.type === 'HIGHLIGHT' ? 'Uită-te la elementele evidențiate!'
                                    : currentHint.type === 'ANIMATION' ? 'Urmărește elementul animat!'
                                        : 'Hint disponibil'
                            )}
                        </span>
                    </div>
                )}

                {submitError && <p style={styles.errorText}>{submitError}</p>}

                {phase !== 'result' && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        {canShowHint && (
                            <button
                                style={{
                                    ...styles.hintBtn,
                                    borderRadius: theme.borderRadius,
                                }}
                                onClick={handleHint}
                            >
                                💡 Hint ({hintsAvailable.length - hintsUsed} rămas)
                            </button>
                        )}
                        <button
                            style={{
                                ...styles.finishBtn,
                                background: theme.colors.primary,
                                borderRadius: theme.borderRadius,
                                boxShadow: `0 4px 0 ${theme.colors.primary}aa`,
                            }}
                            onClick={handleFinish}
                            disabled={phase === 'submitting'}
                        >
                            {phase === 'submitting' ? 'Se trimite...' : 'Am terminat'}
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
                        <p style={styles.resultTitle}>
                            {result.correct ? '🎉 Corect!' : '❌ Nu e chiar corect'}
                        </p>
                        <p style={styles.resultDetail}>
                            Scor: {Math.round(result.score * 100)}%
                            {!result.correct && result.attemptsRemaining !== null &&
                                ` · Încercări rămase: ${result.attemptsRemaining}`}
                        </p>


                        {classAverage !== null && config.settings?.showGroupAverage && (
                            <div style={{
                                marginTop: 12, background: '#f8faff',
                                border: '1.5px solid #e0e7ff',
                                borderRadius: 12, padding: '14px 16px',
                            }}>
                                <p style={{
                                    fontSize: '0.82rem', fontWeight: 800,
                                    color: '#4F6BF6', margin: '0 0 10px 0', textAlign: 'center',
                                }}>
                                    📊 Comparație cu grupa
                                </p>
                                <ResponsiveContainer width="100%" height={140}>
                                    <BarChart
                                        data={[
                                            { name: 'Scorul tău', value: Math.round(result.score * 100) },
                                            { name: 'Media clasei', value: Math.round(classAverage.classAverage) },
                                            { name: 'Media globală', value: Math.round(classAverage.globalAverage) },
                                        ]}
                                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#6b7280' }} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => `${v}%`} />
                                        <Tooltip
                                            formatter={value => [`${value}%`, 'Scor']}
                                            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.8rem' }}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            <Cell fill="#4F6BF6" />
                                            <Cell fill="#a78bfa" />
                                            <Cell fill="#d1d5db" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <div style={styles.resultActions}>
                            {!result.correct && !attemptsExhausted && (
                                <button
                                    style={{ ...styles.retryBtn, borderRadius: theme.borderRadius }}
                                    onClick={handleRetry}
                                >
                                    Încearcă din nou
                                </button>
                            )}
                            <button
                                style={{
                                    ...styles.quizBtn,
                                    background: theme.colors.primary,
                                    borderRadius: theme.borderRadius,
                                }}
                                onClick={onExit}
                            >
                                Înapoi la quiz
                            </button>
                        </div>

                        {attemptsExhausted && (
                            <p style={styles.exhaustedText}>Ai epuizat numărul de încercări.</p>
                        )}
                    </div>
                )}

                {newBadges.length > 0 && (
                    <div style={{
                        marginTop: 16, background: 'white', border: '2px solid #fbbf24',
                        borderRadius: 14, padding: '18px 24px', textAlign: 'center', minWidth: 280,
                    }}>
                        <p style={{ fontSize: '1rem', fontWeight: 900, color: '#92400e', marginBottom: 12 }}>
                            🎉 Badge-uri noi câștigate!
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {newBadges.map(badge => (
                                <div key={badge.id} style={{
                                    background: '#fffbeb', border: '1.5px solid #fde68a',
                                    borderRadius: 10, padding: '10px 14px', textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 4 }}>{badge.icon}</div>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400e' }}>
                                        {badge.name}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {showFeedback && (
                    <ExerciseFeedbackWidget
                        exerciseId={exerciseId}
                        onDismiss={() => setShowFeedback(false)}
                    />
                )}
            </div>
        </ThemeProvider>
    );
}

const styles = {
    header: {
        width: '100%', background: 'white', borderBottom: '1px solid #e5e7eb',
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    backBtn: {
        background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 10,
        padding: '7px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#6b7280',
    },
    progress: { fontWeight: 800, fontSize: '0.95rem', color: '#1a1d23' },
    description: {
        maxWidth: 640, textAlign: 'center', color: '#6b7280', fontWeight: 600,
        fontSize: '0.9rem', margin: '16px 20px 0',
    },
    canvasContainer: {
        width: '100%', maxWidth: 1240, display: 'flex', justifyContent: 'center',
        padding: '20px', boxSizing: 'border-box',
    },
    hintBox: {
        display: 'flex', alignItems: 'center', gap: 10,
        border: '2px solid', borderRadius: 12,
        padding: '10px 16px', marginTop: 12,
        maxWidth: 480, width: '90%',
    },
    hintIcon: { fontSize: '1.2rem', flexShrink: 0 },
    hintText: { fontSize: '0.88rem', fontWeight: 600, color: '#374151' },
    errorText: { color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', marginTop: 8 },
    hintBtn: {
        padding: '10px 20px', background: '#fffbeb', color: '#92400e',
        border: '2px solid #fde68a', fontSize: '0.9rem', fontWeight: 700,
        cursor: 'pointer',
    },
    finishBtn: {
        padding: '12px 28px', color: 'white', border: 'none',
        fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
    },
    resultPanel: {
        marginTop: 16, border: '2px solid', borderRadius: 14,
        padding: '18px 24px', textAlign: 'center', minWidth: 280, maxWidth: 460,
    },
    resultTitle: { fontSize: '1.1rem', fontWeight: 900, margin: '0 0 6px 0', color: '#1a1d23' },
    resultDetail: { fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', margin: '0 0 12px 0' },
    resultActions: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 },
    retryBtn: {
        padding: '9px 20px', background: '#1a1d23', color: 'white',
        border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
    },
    quizBtn: {
        padding: '9px 20px', color: 'white', border: 'none',
        fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
    },
    exhaustedText: { fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', margin: '12px 0 0 0' },
};