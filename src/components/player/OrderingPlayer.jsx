import { useRef, useState, useEffect } from 'react';
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

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function OrderingPlayer({ exerciseId, config, onExit, isPreview = false }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [phase, setPhase] = useState('playing');
    const [result, setResult] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [hintsAvailable, setHintsAvailable] = useState([]);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [currentHint, setCurrentHint] = useState(null);
    const [showSolutionPanel, setShowSolutionPanel] = useState(false);
    const [newBadges, setNewBadges] = useState([]);
    const [dragIdx, setDragIdx] = useState(null);
    const [dragOverIdx, setDragOverIdx] = useState(null);
    const [bgImage] = useImage(config.canvas.backgroundImage || '', 'anonymous');
    const hintTimeoutRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    const theme = getTheme(config.meta?.themeId || 'formal');
    const canvasWidth = config.canvas.width;
    const canvasHeight = config.canvas.height;

    const orderItems = config.elements?.filter(el =>
        el.role === 'ordering-item' || el.role === 'item' || el.orderable
    ) || [];

    const [orderedItems, setOrderedItems] = useState(() => shuffleArray(orderItems));

    useEffect(() => {
        setOrderedItems(shuffleArray(orderItems));
    }, [config]);

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

    const moveItem = (fromIdx, toIdx) => {
        if (fromIdx === toIdx) return;
        setOrderedItems(prev => {
            const next = [...prev];
            const [removed] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, removed);
            return next;
        });
    };

    const moveUp = (idx) => {
        if (idx === 0 || phase !== 'playing') return;
        moveItem(idx, idx - 1);
    };

    const moveDown = (idx) => {
        if (idx === orderedItems.length - 1 || phase !== 'playing') return;
        moveItem(idx, idx + 1);
    };

    const handleDragStart = (idx) => {
        if (phase !== 'playing') return;
        setDragIdx(idx);
    };

    const handleDragOver = (e, idx) => {
        e.preventDefault();
        setDragOverIdx(idx);
    };

    const handleDrop = (idx) => {
        if (dragIdx === null) return;
        moveItem(dragIdx, idx);
        setDragIdx(null);
        setDragOverIdx(null);
    };

    const handleDragEnd = () => {
        setDragIdx(null);
        setDragOverIdx(null);
    };

    const handleFinish = async () => {
        const answerIds = orderedItems.map(it => it.id);
        if (isPreview) {
            const correctIds = config.solution?.correctOrder || config.solution?.correctElementIds || [];
            const scoringMode = config.settings?.scoringMode || 'integral';
            const correctPositions = correctIds.filter((id, idx) => answerIds[idx] === id).length;
            const isCorrect = correctIds.length > 0 && correctPositions === correctIds.length;
            const score = correctIds.length === 0
                ? 0
                : scoringMode === 'partial'
                    ? correctPositions / correctIds.length
                    : isCorrect ? 1 : 0;
            setResult({ correct: isCorrect, score, attemptsRemaining: null, newBadges: [] });
            setPhase('result');
            return;
        }
        setPhase('submitting');
        setSubmitError('');
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
            const res = await api.post('/exercises/submit', {
                exerciseId,
                answer: answerIds,
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
        setOrderedItems(shuffleArray(orderItems));
        setResult(null);
        setSubmitError('');
        setPhase('playing');
        setCurrentHint(null);
        setHintsUsed(0);
        setShowSolutionPanel(false);
        setNewBadges([]);
        startTimeRef.current = Date.now();
    };

    const topLevelElements = (config.elements || []).filter(el =>
        !el.parentId && el.role !== 'ordering-item' && el.role !== 'item' && !el.orderable
    );
    const getChildren = (parentId) => (config.elements || []).filter(el => el.parentId === parentId);

    const LIST_MAX_W = 860;
    const CARD_PADDING_H = 20 + 10 + 28 + 10 + 28 + 10 + 24 + 10 + 20;
    const [listWidth, setListWidth] = useState(640);
    const listRef = useRef(null);
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const obs = new ResizeObserver(() => setListWidth(el.clientWidth));
        obs.observe(el);
        setListWidth(el.clientWidth);
        return () => obs.disconnect();
    }, []);

    const renderElement = (element) => {
        if (element.hidden) return null;
        if (element.type === ELEMENT_TYPES.BOX) {
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
                    {getChildren(element.id).map(child => renderElement(child))}
                </Group>
            );
        }
        if (element.type === ELEMENT_TYPES.TEXT) return <PlayerText key={element.id} element={element} />;
        if (element.type === ELEMENT_TYPES.IMAGE) return <PlayerImage key={element.id} element={element} interactionState={undefined} onElementClick={() => {}} />;
        if (element.type === ELEMENT_TYPES.SHAPE) return <PlayerShape key={element.id} element={element} interactionState={undefined} onElementClick={() => {}} />;
        return null;
    };

    const correctOrder = config.solution?.correctOrder || config.solution?.correctElementIds || [];
    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;
    const canShowHint = !isPreview && hintsAvailable.length > 0 && hintsUsed < hintsAvailable.length && phase === 'playing';

    const getItemState = (item, idx) => {
        if (!result) return 'idle';
        if (correctOrder.length === 0) return 'idle';
        if (correctOrder[idx] === item.id) return 'correct';
        return 'wrong';
    };

    const hasBgCanvas = topLevelElements.length > 0 || bgImage || config.canvas.background !== '#ffffff';

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
                    <div style={styles.progressText}>Aranjează elementele în ordine</div>
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

                {hasBgCanvas && (
                    <div ref={containerRef} style={{ ...styles.canvasContainer, flexShrink: 0, flex: 'none' }}>
                        <div style={{ width: canvasWidth * scale, height: canvasHeight * scale }}>
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
                                    {topLevelElements.map(el => renderElement(el))}
                                </Layer>
                            </Stage>
                        </div>
                    </div>
                )}

                <div ref={listRef} style={{ ...styles.orderList, maxWidth: LIST_MAX_W }}>
                    {orderedItems.map((item, idx) => {
                        const state = getItemState(item, idx);
                        const isDragging = dragIdx === idx;
                        const isDragOver = dragOverIdx === idx;
                        const availW = Math.max(60, listWidth - CARD_PADDING_H);
                        const itemOrigW = item.width || 400;
                        const itemOrigH = item.height || 120;
                        const scaleToFit = Math.min(1, availW / itemOrigW);
                        const cardH = Math.max(60, itemOrigH * scaleToFit);
                        return (
                            <div
                                key={item.id}
                                draggable={phase === 'playing'}
                                onDragStart={() => handleDragStart(idx)}
                                onDragOver={e => handleDragOver(e, idx)}
                                onDrop={() => handleDrop(idx)}
                                onDragEnd={handleDragEnd}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    background: state === 'correct' ? '#f0fdf4'
                                        : state === 'wrong' ? '#fef2f2'
                                            : isDragOver ? '#eef2ff'
                                                : '#ffffff',
                                    border: state === 'correct' ? '2px solid #22c55e'
                                        : state === 'wrong' ? '2px solid #ef4444'
                                            : isDragOver ? '2px dashed #4F6BF6'
                                                : '2px solid #e5e7eb',
                                    borderRadius: 12,
                                    padding: '8px 10px',
                                    minHeight: cardH + 16,
                                    cursor: phase === 'playing' ? 'grab' : 'default',
                                    opacity: isDragging ? 0.4 : 1,
                                    transition: 'background 0.12s, border-color 0.12s, opacity 0.12s',
                                    userSelect: 'none',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <div style={styles.dragHandle}>
                                    ⠿
                                </div>
                                <div style={styles.itemIndex}>
                                    {idx + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                    <ItemPreview item={item} itemChildren={getChildren(item.id)} availW={availW} />
                                </div>
                                {phase === 'playing' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <button
                                            onClick={() => moveUp(idx)}
                                            disabled={idx === 0}
                                            style={{
                                                ...styles.arrowBtn,
                                                opacity: idx === 0 ? 0.3 : 1,
                                            }}
                                        >▲</button>
                                        <button
                                            onClick={() => moveDown(idx)}
                                            disabled={idx === orderedItems.length - 1}
                                            style={{
                                                ...styles.arrowBtn,
                                                opacity: idx === orderedItems.length - 1 ? 0.3 : 1,
                                            }}
                                        >▼</button>
                                    </div>
                                )}
                                {state === 'correct' && (
                                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>✅</span>
                                )}
                                {state === 'wrong' && (
                                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>❌</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {currentHint && (
                    <div style={{ ...styles.hintBox, borderColor: '#4F6BF6', background: '#f0f4ff' }}>
                        <span style={styles.hintIcon}>💡</span>
                        <span style={styles.hintText}>{currentHint.text || 'Hint disponibil'}</span>
                    </div>
                )}

                {submitError && <p style={styles.errorText}>{submitError}</p>}

                {phase !== 'result' && (
                    <div style={{ display: 'flex', gap: 12, margin: '12px 0', flexShrink: 0 }}>
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

function ItemPreview({ item, itemChildren, availW }) {
    const itemOrigW = item.width || 400;
    const itemOrigH = item.height || 120;
    const scale = Math.min(1, availW / itemOrigW);
    const previewW = itemOrigW * scale;
    const previewH = itemOrigH * scale;

    return (
        <Stage width={previewW} height={previewH} scaleX={scale} scaleY={scale} listening={false}
               style={{ display: 'block', pointerEvents: 'none' }}>
            <Layer>
                <Rect
                    x={0} y={0}
                    width={itemOrigW} height={itemOrigH}
                    fill={item.bgFill && item.bgFill !== 'transparent' ? item.bgFill : '#ffffff'}
                    stroke={item.bgStroke && item.bgStroke !== 'transparent' ? item.bgStroke : undefined}
                    strokeWidth={item.bgStrokeWidth || 0}
                    cornerRadius={item.bgCornerRadius || 0}
                    listening={false}
                />
                {itemChildren.map(child => <ItemChildEl key={child.id} el={child} />)}
            </Layer>
        </Stage>
    );
}

function ItemChildEl({ el }) {
    const BASE_URL = 'http://localhost:8080';
    const src = el.src
        ? (el.src.startsWith('http') || el.src.startsWith('data:') ? el.src : `${BASE_URL}${el.src}`)
        : null;
    const [img] = useImage(src || '', 'anonymous');

    const x = el.x ?? 0;
    const y = el.y ?? 0;

    if (el.type === ELEMENT_TYPES.IMAGE && img) {
        return (
            <KonvaImage
                x={x} y={y}
                width={el.width} height={el.height}
                image={img}
                cornerRadius={el.cornerRadius || 0}
                listening={false}
            />
        );
    }
    if (el.type === ELEMENT_TYPES.TEXT) {
        return (
            <PlayerText element={{ ...el, x, y }} />
        );
    }
    if (el.type === ELEMENT_TYPES.SHAPE) {
        return (
            <PlayerShape element={{ ...el, x, y }} interactionState={undefined} onElementClick={() => {}} />
        );
    }
    if (el.type === ELEMENT_TYPES.BOX) {
        return (
            <Group x={x} y={y}>
                <Rect
                    width={el.width} height={el.height}
                    fill={el.bgFill && el.bgFill !== 'transparent' ? el.bgFill : undefined}
                    stroke={el.bgStroke && el.bgStroke !== 'transparent' ? el.bgStroke : undefined}
                    strokeWidth={el.bgStrokeWidth || 0}
                    cornerRadius={el.bgCornerRadius || 0}
                    listening={false}
                />
            </Group>
        );
    }
    return null;
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
    progressText: { fontWeight: 800, fontSize: '0.95rem', color: '#1a1d23' },
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
        width: '100%', maxWidth: 1240,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '16px 20px 0', boxSizing: 'border-box',
    },
    orderList: {
        flex: 1, overflowY: 'auto', width: '100%',
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: '16px 20px', boxSizing: 'border-box',
    },
    dragHandle: {
        fontSize: '1.2rem', color: '#9ca3af', cursor: 'grab', flexShrink: 0,
        lineHeight: 1, userSelect: 'none',
    },
    itemIndex: {
        width: 28, height: 28, borderRadius: '50%',
        background: '#f3f4f6', border: '1.5px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: '0.8rem', color: '#6b7280', flexShrink: 0,
    },
    arrowBtn: {
        background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4,
        width: 24, height: 20, fontSize: '0.65rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, color: '#374151', padding: 0, lineHeight: 1,
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
        margin: '0 20px 16px', border: '2px solid', borderRadius: 14,
        padding: '18px 24px', textAlign: 'center', flexShrink: 0,
        width: '100%', maxWidth: 600, boxSizing: 'border-box',
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
        margin: '0 20px 16px', background: 'white', border: '2px solid #fbbf24',
        borderRadius: 14, padding: '18px 24px', textAlign: 'center',
        width: '100%', maxWidth: 600, boxSizing: 'border-box', flexShrink: 0,
    },
    badgesTitle: { fontSize: '1rem', fontWeight: 900, color: '#92400e', marginBottom: 12 },
    badgesList: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
    badgeCard: {
        background: '#fffbeb', border: '1.5px solid #fde68a',
        borderRadius: 10, padding: '10px 14px', textAlign: 'center',
    },
    badgeName: { fontSize: '0.8rem', fontWeight: 800, color: '#92400e', margin: 0 },
};
