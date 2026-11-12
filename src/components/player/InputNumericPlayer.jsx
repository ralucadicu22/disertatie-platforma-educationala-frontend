import { useRef, useState, useEffect, useMemo } from 'react';
import { Stage, Layer, Rect, Group, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import api from '../../api/axios';
import PlayerText from './PlayerText';
import PlayerImage from './PlayerImage';
import PlayerShape from './PlayerShape';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { getTheme } from '../../constants/themes.js';
import ExerciseFeedbackWidget from '../feedback/ExerciseFeedbackWidget';

const CONTAINER_PADDING = 40;

export default function InputNumericPlayer({ exerciseId, config, onExit, isPreview = false }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [answers, setAnswers] = useState({});
    const [phase, setPhase] = useState('playing');
    const [result, setResult] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [hintsAvailable, setHintsAvailable] = useState([]);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [currentHint, setCurrentHint] = useState(null);
    const [showSolutionPanel, setShowSolutionPanel] = useState(false);
    const [newBadges, setNewBadges] = useState([]);
    const [bgImage] = useImage(config.canvas.backgroundImage || '', 'anonymous');
    const hintTimeoutRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    const theme = getTheme(config.meta?.themeId || 'formal');
    const canvasWidth = config.canvas.width;
    const canvasHeight = config.canvas.height;
    const tolerance = config.settings?.tolerance ?? 0;

    const inputElements = useMemo(
        () => config.elements.filter(el => el.type === ELEMENT_TYPES.INPUT || el.inputType === 'numeric' || el.role === 'input'),
        [config.elements]
    );

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
        const hints = config.settings?.hints || [];
        if (hints.length > 0) { setHintsAvailable(hints); return; }
        if (isPreview || !exerciseId || exerciseId === -1) return;
        api.get(`/exercises/${exerciseId}/hints/available`)
            .then(res => setHintsAvailable(res.data || []))
            .catch(() => {});
    }, [exerciseId, isPreview, config.settings]);

    const handleHint = () => {
        if (hintsUsed >= hintsAvailable.length) return;
        const hint = hintsAvailable[hintsUsed];
        setHintsUsed(p => p + 1);
        setCurrentHint(hint);
        if (hint.type === 'TEXT') {
            clearTimeout(hintTimeoutRef.current);
            hintTimeoutRef.current = setTimeout(() => setCurrentHint(null), 4000);
        }
    };

    const handleFinish = async () => {
        if (isPreview) {
            const correct = config.solution?.correctAnswers || {};
            const allCorrect = Object.keys(correct).every(id => {
                const given = parseFloat(answers[id]);
                const expected = parseFloat(correct[id]);
                if (isNaN(given) || isNaN(expected)) return false;
                return Math.abs(given - expected) <= tolerance;
            });
            setResult({ correct: allCorrect, score: allCorrect ? 1 : 0, attemptsRemaining: null, newBadges: [] });
            setPhase('result');
            return;
        }
        setPhase('submitting');
        setSubmitError('');
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
            const res = await api.post('/exercises/submit', {
                exerciseId,
                answer: answers,
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
        setAnswers({});
        setResult(null);
        setSubmitError('');
        setPhase('playing');
        setCurrentHint(null);
        setHintsUsed(0);
        setShowSolutionPanel(false);
        setNewBadges([]);
        startTimeRef.current = Date.now();
    };

    const topLevelElements = config.elements.filter(el => !el.parentId);
    const getChildren = (parentId) => config.elements.filter(el => el.parentId === parentId);

    const renderElement = (element) => {
        if (element.hidden) return null;
        if (element.type === ELEMENT_TYPES.BOX) {
            const children = getChildren(element.id);
            return (
                <Group key={element.id} x={element.x} y={element.y} rotation={element.rotation || 0}>
                    <Rect
                        width={element.width} height={element.height}
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
        if (element.type === ELEMENT_TYPES.IMAGE) return <PlayerImage key={element.id} element={element} interactionState={undefined} onElementClick={() => {}} />;
        if (element.type === ELEMENT_TYPES.SHAPE) return <PlayerShape key={element.id} element={element} interactionState={undefined} onElementClick={() => {}} />;
        return null;
    };

    const correctAnswers = config.solution?.correctAnswers || {};
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
                    <div style={styles.progress}>
                        {Object.keys(correctAnswers).length > 0
                            ? `${Object.keys(answers).filter(k => answers[k] !== '' && answers[k] !== undefined).length}/${Object.keys(correctAnswers).length} completate`
                            : ''}
                    </div>
                    {tolerance > 0 && (
                        <div style={styles.toleranceBadge}>± {tolerance}</div>
                    )}
                    {tolerance === 0 && <div style={{ width: 80 }} />}
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
                    <div style={{ position: 'relative', width: canvasWidth * scale, height: canvasHeight * scale }}>
                        <Stage
                            width={canvasWidth * scale}
                            height={canvasHeight * scale}
                            scaleX={scale} scaleY={scale}
                        >
                            <Layer>
                                <Rect
                                    x={0} y={0} width={canvasWidth} height={canvasHeight}
                                    fill={config.canvas.background || '#ffffff'} listening={false}
                                />
                                {bgImage && (
                                    <KonvaImage image={bgImage} x={0} y={0}
                                                width={canvasWidth} height={canvasHeight} listening={false} />
                                )}
                                {topLevelElements
                                    .filter(el => el.type !== ELEMENT_TYPES.INPUT && el.role !== 'input' && el.inputType !== 'numeric')
                                    .map(el => renderElement(el))}
                            </Layer>
                        </Stage>

                        {inputElements.map(el => {
                            const absX = el.x * scale;
                            const absY = el.y * scale;
                            const w = el.width * scale;
                            const h = el.height * scale;
                            const isCorrect = result?.details?.correctElementIds?.includes(el.id);
                            const isWrong = result?.details?.incorrectElementIds?.includes(el.id);
                            return (
                                <div key={el.id} style={{
                                    position: 'absolute',
                                    left: absX, top: absY,
                                    width: w, height: h,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                }}>
                                    <input
                                        type="number"
                                        value={answers[el.id] ?? ''}
                                        onChange={e => setAnswers(prev => ({ ...prev, [el.id]: e.target.value }))}
                                        disabled={phase === 'result' || phase === 'submitting'}
                                        placeholder={el.placeholder || '0'}
                                        step={tolerance > 0 ? tolerance : 'any'}
                                        style={{
                                            width: '100%', height: '100%',
                                            fontSize: (el.fontSize || 16) * scale,
                                            fontFamily: el.fontFamily || theme.font.family,
                                            textAlign: el.align || 'center',
                                            border: isCorrect ? '2px solid #22c55e'
                                                : isWrong ? '2px solid #ef4444'
                                                    : '2px solid #d1d5db',
                                            borderRadius: el.bgCornerRadius || 8,
                                            background: isCorrect ? '#f0fdf4'
                                                : isWrong ? '#fef2f2'
                                                    : '#ffffff',
                                            color: '#1a1d23',
                                            padding: '0 8px',
                                            boxSizing: 'border-box',
                                            outline: 'none',
                                            boxShadow: isCorrect ? '0 0 0 3px rgba(34,197,94,0.2)'
                                                : isWrong ? '0 0 0 3px rgba(239,68,68,0.2)'
                                                    : 'none',
                                            transition: 'border-color 0.2s, box-shadow 0.2s',
                                            MozAppearance: 'textfield',
                                        }}
                                    />
                                    {isWrong && tolerance > 0 && (
                                        <span style={{
                                            position: 'absolute', top: '105%',
                                            fontSize: 10 * scale, color: '#dc2626', fontWeight: 700,
                                            whiteSpace: 'nowrap',
                                        }}>
                                            ± {tolerance} toleranță
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {currentHint && (
                    <div style={{ ...styles.hintBox, borderColor: '#4F6BF6', background: '#f0f4ff' }}>
                        <span style={styles.hintIcon}>💡</span>
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
                        {showSolutionPanel && config.settings?.explanation && (
                            <div style={styles.explanationBox}>
                                <p style={styles.explanationTitle}>💡 Explicație</p>
                                <p style={styles.explanationBody}>{config.settings.explanation}</p>
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
                    <div style={styles.badgesPanel}>
                        <p style={styles.badgesTitle}>🎉 Badge-uri noi câștigate!</p>
                        <div style={styles.badgesList}>
                            {newBadges.map(badge => (
                                <div key={badge.id} style={styles.badgeCard}>
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
        background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 10,
        padding: '7px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#6b7280',
    },
    progress: { fontWeight: 800, fontSize: '0.95rem', color: '#1a1d23' },
    toleranceBadge: {
        background: '#f0f4ff', border: '1.5px solid #c7d2fe',
        borderRadius: 8, padding: '4px 10px',
        fontSize: '0.8rem', fontWeight: 700, color: '#4F6BF6',
    },
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
    explanationBox: {
        marginTop: 12, background: '#f0fdf4', border: '2px solid #86efac',
        borderRadius: 12, padding: '14px 16px', textAlign: 'left',
    },
    explanationTitle: { fontSize: '0.8rem', fontWeight: 800, color: '#166534', margin: '0 0 6px 0' },
    explanationBody: { fontSize: '0.85rem', color: '#374151', margin: 0, lineHeight: 1.5 },
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
    badgesPanel: {
        marginTop: 16, background: 'white', border: '2px solid #fbbf24',
        borderRadius: 14, padding: '18px 24px', textAlign: 'center', minWidth: 280,
    },
    badgesTitle: { fontSize: '1rem', fontWeight: 900, color: '#92400e', marginBottom: 12 },
    badgesList: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
    badgeCard: {
        background: '#fffbeb', border: '1.5px solid #fde68a',
        borderRadius: 10, padding: '10px 14px', textAlign: 'center',
    },
    badgeName: { fontSize: '0.8rem', fontWeight: 800, color: '#92400e', margin: 0 },
};
