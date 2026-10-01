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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useImage from 'use-image';

const CONTAINER_PADDING = 40;

export default function FindAndSelectPlayer({ exerciseId, config, onExit, isPreview = false }) {
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
    const [bgImage] = useImage(config.canvas.backgroundImage || '', 'anonymous');
    const [hintsAvailable, setHintsAvailable] = useState([]);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [currentHint, setCurrentHint] = useState(null);
    const [highlightedIds, setHighlightedIds] = useState(new Set());
    const [animatingIds, setAnimatingIds] = useState(new Set());
    const [wrongClicks, setWrongClicks] = useState(0);
    const [wrongBanner, setWrongBanner] = useState(false);
    const [wrongIds, setWrongIds] = useState(() => new Set());

    const wrongBannerTimeoutRef = useRef(null);
    const shakeTimeoutRef = useRef(null);
    const hintTimeoutRef = useRef(null);

    const canvasWidth = config.canvas.width;
    const canvasHeight = config.canvas.height;

    const correctElementIds = useMemo(
        () => new Set(config.solution?.correctElementIds || []),
        [config.solution]
    );
    const totalCorrect = correctElementIds.size;
    const theme = getTheme(config.meta?.themeId || 'formal');

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

    const triggerSmartHint = (wrongCount) => {
        const round = Math.floor(wrongCount / 3);
        if (round === 1) {
            const textHint = hintsAvailable.find(h => h.type === 'TEXT');
            if (textHint) {
                setCurrentHint(textHint);
                clearTimeout(hintTimeoutRef.current);
                hintTimeoutRef.current = setTimeout(() => setCurrentHint(null), 4000);
            }
            return;
        }
        const notFoundYet = [...correctElementIds].filter(id => !foundIds.has(id));
        if (notFoundYet.length === 0) return;
        const targetId = notFoundYet[Math.floor(Math.random() * notFoundYet.length)];
        const highlightHint = hintsAvailable.find(
            h => h.type === 'HIGHLIGHT' && h.targetElementId === targetId
        ) || {
            id: `auto_${targetId}`,
            type: 'HIGHLIGHT',
            targetElementId: targetId,
            text: 'Uită-te la elementul evidențiat!',
        };
        setCurrentHint(highlightHint);
        setHighlightedIds(prev => new Set([...prev, targetId]));
        setTimeout(() => {
            setHighlightedIds(prev => {
                const next = new Set(prev);
                next.delete(targetId);
                return next;
            });
            setCurrentHint(null);
        }, 3000);
    };

    const handleElementClick = (element) => {
        if (phase !== 'playing') return;
        if (foundIds.has(element.id)) return;

        if (correctElementIds.has(element.id)) {
            setFoundIds(prev => new Set(prev).add(element.id));
            setBursts(prev => [...prev, {
                id: `${element.id}_${Date.now()}`,
                x: element.x + element.width / 2,
                y: element.y + element.height / 2,
            }]);
        } else {
            // Shake animation
            clearTimeout(shakeTimeoutRef.current);
            setShakingId(element.id);
            shakeTimeoutRef.current = setTimeout(() => setShakingId(null), 320);

            setWrongIds(prev => new Set(prev).add(element.id));
            setTimeout(() => {
                setWrongIds(prev => {
                    const next = new Set(prev);
                    next.delete(element.id);
                    return next;
                });
            }, 60);

            clearTimeout(wrongBannerTimeoutRef.current);
            setWrongBanner(true);
            wrongBannerTimeoutRef.current = setTimeout(() => setWrongBanner(false), 1500);

            setWrongClicks(prev => {
                const next = prev + 1;
                if (next % 3 === 0) setTimeout(() => triggerSmartHint(next), 400);
                return next;
            });
        }
    };

    const handleStageClick = (e) => {
        if (phase !== 'playing') return;
        const clickedOnStage = e.target === e.target.getStage();
        const clickedOnRect = e.target.getClassName() === 'Rect' && !e.target.id();
        const clickedOnImage = e.target.getClassName() === 'Image';
        if (clickedOnStage || clickedOnRect || clickedOnImage) {
            clearTimeout(wrongBannerTimeoutRef.current);
            setWrongBanner(true);
            wrongBannerTimeoutRef.current = setTimeout(() => setWrongBanner(false), 1500);
            setWrongClicks(prev => {
                const next = prev + 1;
                if (next % 3 === 0) setTimeout(() => triggerSmartHint(next), 400);
                return next;
            });
        }
    };

    const removeBurst = (id) => setBursts(prev => prev.filter(b => b.id !== id));

    const handleHint = () => {
        if (!hintsAvailable || hintsUsed >= hintsAvailable.length) return;
        const hint = hintsAvailable[hintsUsed];
        setHintsUsed(prev => prev + 1);
        setCurrentHint(hint);

        if (hint.type === 'TEXT') {
            clearTimeout(hintTimeoutRef.current);
            hintTimeoutRef.current = setTimeout(() => setCurrentHint(null), 4000);
        }
        if (hint.type === 'HIGHLIGHT' && hint.targetElementId) {
            setHighlightedIds(prev => new Set([...prev, hint.targetElementId]));
            setTimeout(() => {
                setHighlightedIds(prev => {
                    const next = new Set(prev);
                    next.delete(hint.targetElementId);
                    return next;
                });
                setCurrentHint(null);
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
                setCurrentHint(null);
            }, 1500);
        }
    };

    const handleFinish = async () => {
        if (isPreview) {
            setResult({
                correct: foundIds.size === totalCorrect && totalCorrect > 0,
                score: totalCorrect > 0 ? foundIds.size / totalCorrect : 0,
                attemptsRemaining: null,
                newBadges: [],
            });
            setPhase('result');
            return;
        }
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
            if (res.data.newBadges?.length > 0) setNewBadges(res.data.newBadges);
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
        clearTimeout(hintTimeoutRef.current);
        setHighlightedIds(new Set());
        setAnimatingIds(new Set());
        setNewBadges([]);
        setWrongClicks(0);
        setWrongBanner(false);
        setWrongIds(new Set());
        setHintsUsed(0);
    };

    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;
    const canShowHint = !isPreview && hintsAvailable.length > 0 && hintsUsed < hintsAvailable.length && phase === 'playing';

    const topLevelElements = config.elements.filter(el => !el.parentId);
    const getChildren = (parentId) => config.elements.filter(el => el.parentId === parentId);

    const renderElement = (element) => {
        const interactionState =
            foundIds.has(element.id) ? 'found'
                : wrongIds.has(element.id) ? 'wrong'
                    : shakingId === element.id ? 'shake'
                        : highlightedIds.has(element.id) ? 'highlight'
                            : animatingIds.has(element.id) ? 'animate'
                                : undefined;

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
        if (element.type === ELEMENT_TYPES.IMAGE) return (
            <PlayerImage key={element.id} element={element} interactionState={interactionState} onElementClick={handleElementClick} />
        );
        if (element.type === ELEMENT_TYPES.SHAPE) return (
            <PlayerShape key={element.id} element={element} interactionState={interactionState} onElementClick={handleElementClick} />
        );
        if (element.type === ELEMENT_TYPES.HOTSPOT) return (
            <PlayerHotspot key={element.id} element={element} interactionState={interactionState} onElementClick={handleElementClick} />
        );
        return null;
    };

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
                    <div style={styles.progress}>
                        {totalCorrect > 0 ? `${foundIds.size}/${totalCorrect} găsite` : ''}
                    </div>
                    <div style={{ width: 80 }} />
                </div>

                {isPreview && (
                    <div style={styles.previewBanner}>
                        🔍 PREVIZUALIZARE — răspunsurile nu se salvează
                    </div>
                )}

                {config.meta?.description && (
                    <p style={styles.description}>{config.meta.description}</p>
                )}

                <div ref={containerRef} style={styles.canvasContainer}>
                    <div style={{ width: canvasWidth * scale, height: canvasHeight * scale }}>
                        <Stage
                            width={canvasWidth * scale}
                            height={canvasHeight * scale}
                            scaleX={scale} scaleY={scale}
                            onClick={handleStageClick}
                            onTap={handleStageClick}
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
                                        onComplete={() => removeBurst(burst.id)}
                                    />
                                ))}
                            </Layer>
                        </Stage>
                    </div>
                </div>

                {wrongBanner && (
                    <div style={styles.wrongBanner}>
                        ❌ Nu e obiectul căutat. Încearcă altundeva!
                    </div>
                )}

                {currentHint && (
                    <div style={{
                        ...styles.hintBox,
                        borderColor: currentHint.type === 'HIGHLIGHT' ? '#f59e0b'
                            : currentHint.type === 'ANIMATION' ? '#8b5cf6' : '#4F6BF6',
                        background: currentHint.type === 'HIGHLIGHT' ? '#fffbeb'
                            : currentHint.type === 'ANIMATION' ? '#f5f3ff' : '#f0f4ff',
                    }}>
                        <span style={styles.hintIcon}>
                            {currentHint.type === 'HIGHLIGHT' ? '🔦'
                                : currentHint.type === 'ANIMATION' ? '✨' : '💡'}
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
                                border: '1.5px solid #e0e7ff', borderRadius: 12, padding: '14px 16px',
                            }}>
                                <p style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4F6BF6', margin: '0 0 10px 0', textAlign: 'center' }}>
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
                                        <Tooltip formatter={value => [`${value}%`, 'Scor']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.8rem' }} />
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
                    <div style={{ marginTop: 16, background: 'white', border: '2px solid #fbbf24', borderRadius: 14, padding: '18px 24px', textAlign: 'center', minWidth: 280 }}>
                        <p style={{ fontSize: '1rem', fontWeight: 900, color: '#92400e', marginBottom: 12 }}>
                            🎉 Badge-uri noi câștigate!
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {newBadges.map(badge => (
                                <div key={badge.id} style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 4 }}>{badge.icon}</div>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400e' }}>{badge.name}</p>
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
        background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 10,
        padding: '7px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#6b7280',
    },
    progress: { fontWeight: 800, fontSize: '0.95rem', color: '#1a1d23' },
    previewBanner: {
        width: '100%', background: '#fef3c7', borderBottom: '1px solid #fde68a',
        padding: '8px 20px', textAlign: 'center', fontSize: '0.82rem',
        fontWeight: 700, color: '#92400e', flexShrink: 0,
    },
    description: {
        maxWidth: 640, textAlign: 'center', color: '#6b7280', fontWeight: 600,
        fontSize: '0.9rem', margin: '16px 20px 0', flexShrink: 0,
    },
    canvasContainer: {
        flex: 1, minHeight: 0, width: '100%', maxWidth: 1240,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '20px', boxSizing: 'border-box',
    },
    hintBox: {
        display: 'flex', alignItems: 'center', gap: 10,
        border: '2px solid', borderRadius: 12,
        padding: '10px 16px', marginTop: 8,
        maxWidth: 480, width: '90%', flexShrink: 0,
    },
    hintIcon: { fontSize: '1.2rem', flexShrink: 0 },
    hintText: { fontSize: '0.88rem', fontWeight: 600, color: '#374151' },
    errorText: { color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', marginTop: 8, flexShrink: 0 },
    hintBtn: {
        padding: '10px 20px', background: '#fffbeb', color: '#92400e',
        border: '2px solid #fde68a', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
    },
    finishBtn: {
        padding: '12px 28px', color: 'white', border: 'none',
        fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
    },
    resultPanel: {
        marginTop: 16, border: '2px solid', borderRadius: 14,
        padding: '18px 24px', textAlign: 'center', minWidth: 280, maxWidth: 460, flexShrink: 0,
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
    wrongBanner: {
        background: '#fee2e2', border: '2px solid #fca5a5', borderRadius: 12,
        padding: '10px 20px', marginTop: 8, fontSize: '0.9rem',
        fontWeight: 800, color: '#b91c1c', maxWidth: 480, textAlign: 'center', flexShrink: 0,
    },
};
