import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Image as KonvaImage, Line, Text as KonvaText } from 'react-konva';
import useImage from 'use-image';
import { apiWithOverride as api } from '../../api/axios';
import PlayerText from './PlayerText';
import PlayerImage from './PlayerImage';
import PlayerShape from './PlayerShape';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { getTheme } from '../../constants/themes.js';
import ExerciseFeedbackWidget from '../feedback/ExerciseFeedbackWidget';

const CONTAINER_PADDING = 40;
const CONNECTOR_COLOR = '#4F6BF6';
const CONNECTOR_COLOR_CORRECT = '#22c55e';
const CONNECTOR_COLOR_WRONG = '#ef4444';
const CONNECTOR_WIDTH = 3;
const CARD_MIN_H = 64;
const CARD_MAX_PREVIEW_W = 320;

function useContainerScale(containerRef, canvasWidth, canvasHeight) {
    const [scale, setScale] = useState(1);
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const resize = () => {
            const w = el.clientWidth - CONTAINER_PADDING;
            const h = el.clientHeight - CONTAINER_PADDING;
            setScale(Math.min(1, w / canvasWidth, h / canvasHeight));
        };
        resize();
        const obs = new ResizeObserver(resize);
        obs.observe(el);
        return () => obs.disconnect();
    }, [canvasWidth, canvasHeight]);
    return scale;
}

function ElementPreview({ element, childElements, availW, availH }) {
    const origW = element.width || 200;
    const origH = element.height || 60;
    const scaleX = Math.min(1, availW / origW);
    const scaleY = availH ? Math.min(scaleX, availH / origH) : scaleX;
    const s = Math.min(scaleX, scaleY);
    const pw = origW * s;
    const ph = origH * s;

    const isLeaf = element.type === ELEMENT_TYPES.IMAGE || element.type === ELEMENT_TYPES.SHAPE;

    return (
        <Stage width={pw} height={ph} scaleX={s} scaleY={s} listening={false}
               style={{ display: 'block', pointerEvents: 'none' }}>
            <Layer>
                {!isLeaf && (
                    <Rect x={0} y={0} width={origW} height={origH}
                          fill={element.bgFill && element.bgFill !== 'transparent' ? element.bgFill : '#ffffff'}
                          stroke={element.bgStroke && element.bgStroke !== 'transparent' ? element.bgStroke : undefined}
                          strokeWidth={element.bgStrokeWidth || 0}
                          cornerRadius={element.bgCornerRadius || 0}
                          listening={false} />
                )}
                {isLeaf
                    ? <InlineElement el={{ ...element, x: 0, y: 0 }} />
                    : childElements.map(child => <InlineElement key={child.id} el={child} />)
                }
            </Layer>
        </Stage>
    );
}

function InlineElement({ el }) {
    if (el.hidden) return null;
    if (el.type === ELEMENT_TYPES.TEXT) return <PlayerText element={el} />;
    if (el.type === ELEMENT_TYPES.IMAGE) return <PlayerImage element={el} interactionState={undefined} onElementClick={() => {}} />;
    if (el.type === ELEMENT_TYPES.SHAPE) return <PlayerShape element={el} interactionState={undefined} onElementClick={() => {}} />;
    if (el.type === ELEMENT_TYPES.BOX) {
        return (
            <Group x={el.x} y={el.y} rotation={el.rotation || 0}>
                <Rect width={el.width} height={el.height}
                      fill={el.bgFill !== 'transparent' ? el.bgFill : undefined}
                      stroke={el.bgStroke !== 'transparent' ? el.bgStroke : undefined}
                      strokeWidth={el.bgStrokeWidth}
                      cornerRadius={el.bgCornerRadius}
                      listening={false} />
            </Group>
        );
    }
    return null;
}

function TextOnlyCard({ item }) {
    const text = item.label || item.text || item.id;
    return (
        <span style={{
            fontSize: (item.fontSize || 15),
            fontWeight: 700,
            color: '#1a1d23',
            textAlign: 'center',
            wordBreak: 'break-word',
            lineHeight: 1.35,
        }}>
            {text}
        </span>
    );
}

function MatchItemContent({ item, childElements, cardW }) {
    const hasChildren = childElements.length > 0;
    const isBoxOrImage = item.type === ELEMENT_TYPES.BOX || item.type === ELEMENT_TYPES.IMAGE || item.type === ELEMENT_TYPES.SHAPE;
    const hasVisualContent = hasChildren || isBoxOrImage;

    if (!hasVisualContent) {
        return <TextOnlyCard item={item} />;
    }

    const availW = Math.min(cardW - 24, CARD_MAX_PREVIEW_W);
    const availH = 160;
    return (
        <ElementPreview
            element={item}
            childElements={childElements}
            availW={availW}
            availH={availH}
        />
    );
}

export default function MatchingPlayer({ exerciseId, config, onExit, isPreview = false }) {
    const containerRef = useRef(null);
    const leftColRef = useRef(null);
    const [leftColW, setLeftColW] = useState(300);
    const [selectedLeft, setSelectedLeft] = useState(null);
    const [pairs, setPairs] = useState({});
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
    const hintTimeoutRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    const theme = getTheme(config.meta?.themeId || 'formal');
    const canvasWidth = config.canvas?.width || 1200;
    const canvasHeight = config.canvas?.height || 700;
    const scale = useContainerScale(containerRef, canvasWidth, canvasHeight);

    const allElements = config.elements || [];
    const isLeftEl = (el) =>
        el.behavior === 'match-left' || el.behavior === 'matching-left' ||
        el.role === 'match-left' || el.role === 'matching-left' ||
        el.matchSide === 'left';
    const isRightEl = (el) =>
        el.behavior === 'match-right' || el.behavior === 'matching-right' ||
        el.role === 'match-right' || el.role === 'matching-right' ||
        el.matchSide === 'right';
    const isZoneBox = (el) =>
        !el.parentId && (el.role === 'matching-left' || el.role === 'matching-right' ||
            el.role === 'match-left' || el.role === 'match-right');
    const leftItems = allElements.filter(el => el.parentId && isLeftEl(el) && !el.isPlaceholder);
    const rightItems = allElements.filter(el => el.parentId && isRightEl(el) && !el.isPlaceholder);
    const topLevelElements = allElements.filter(el =>
        !el.parentId && !isZoneBox(el) &&
        el.role !== 'title' && el.id?.indexOf('instr_') !== 0
    );
    const getChildren = (parentId) => allElements.filter(el => el.parentId === parentId);

    useEffect(() => {
        const el = leftColRef.current;
        if (!el) return;
        const obs = new ResizeObserver(() => setLeftColW(el.clientWidth));
        obs.observe(el);
        setLeftColW(el.clientWidth);
        return () => obs.disconnect();
    }, []);

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

    const handleLeftClick = (id) => {
        if (phase !== 'playing') return;
        setSelectedLeft(prev => prev === id ? null : id);
    };

    const handleRightClick = (id) => {
        if (phase !== 'playing' || !selectedLeft) return;
        const currentLeftOwner = Object.keys(pairs).find(k => pairs[k] === id);
        const newPairs = { ...pairs };
        if (currentLeftOwner) delete newPairs[currentLeftOwner];
        newPairs[selectedLeft] = id;
        setPairs(newPairs);
        setSelectedLeft(null);
    };

    const removePair = (leftId) => {
        if (phase !== 'playing') return;
        setPairs(prev => {
            const next = { ...prev };
            delete next[leftId];
            return next;
        });
        setSelectedLeft(null);
    };

    const handleFinish = async () => {
        if (isPreview) {
            const correctMapping = config.solution?.matchMapping || config.solution?.correctAnswers || {};
            const scoringMode = config.settings?.scoringMode || 'integral';
            const total = Object.keys(correctMapping).length;
            const correctCount = Object.entries(correctMapping).filter(([k, v]) => pairs[k] === v).length;
            const isCorrect = total > 0 && correctCount === total;
            const score = total === 0
                ? 0
                : scoringMode === 'partial'
                    ? correctCount / total
                    : isCorrect ? 1 : 0;
            const correctPairs = Object.keys(correctMapping).filter(k => pairs[k] === correctMapping[k]);
            const incorrectPairs = Object.keys(correctMapping).filter(k => pairs[k] !== correctMapping[k]);
            setResult({
                correct: isCorrect,
                score,
                attemptsRemaining: null,
                newBadges: [],
                details: { correctPairs, incorrectPairs },
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
                answer: pairs,
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
        setPairs({});
        setSelectedLeft(null);
        setResult(null);
        setSubmitError('');
        setPhase('playing');
        setCurrentHint(null);
        setHintsUsed(0);
        setShowSolutionPanel(false);
        setNewBadges([]);
        startTimeRef.current = Date.now();
    };

    const renderCanvasElement = (element) => {
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
                    {getChildren(element.id).map(child => renderCanvasElement(child))}
                </Group>
            );
        }
        if (element.type === ELEMENT_TYPES.TEXT) return <PlayerText key={element.id} element={element} />;
        if (element.type === ELEMENT_TYPES.IMAGE) return <PlayerImage key={element.id} element={element} interactionState={undefined} onElementClick={() => {}} />;
        if (element.type === ELEMENT_TYPES.SHAPE) return <PlayerShape key={element.id} element={element} interactionState={undefined} onElementClick={() => {}} />;
        return null;
    };

    const getItemState = (leftId) => {
        if (!result) return 'idle';
        const correctPairs = result.details?.correctPairs || [];
        const incorrectPairs = result.details?.incorrectPairs || [];
        if (correctPairs.includes(leftId)) return 'correct';
        if (incorrectPairs.includes(leftId)) return 'wrong';
        return 'idle';
    };

    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;
    const canShowHint = !isPreview && hintsAvailable.length > 0 && hintsUsed < hintsAvailable.length && phase === 'playing';
    const canFinish = Object.keys(pairs).length >= leftItems.length && phase !== 'submitting';

    const cardBorder = (state, isSelected, isPaired) => {
        if (isSelected) return `2px solid ${CONNECTOR_COLOR}`;
        if (state === 'correct') return '2px solid #22c55e';
        if (state === 'wrong') return '2px solid #ef4444';
        if (isPaired) return `2px solid ${CONNECTOR_COLOR}55`;
        return '2px solid #e5e7eb';
    };

    const cardBackground = (state, isSelected, extra) => {
        if (isSelected) return '#eef2ff';
        if (state === 'correct') return '#f0fdf4';
        if (state === 'wrong') return '#fef2f2';
        return extra || '#ffffff';
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
                        {`${Object.keys(pairs).length}/${leftItems.length} conectate`}
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

                {selectedLeft && phase === 'playing' && (
                    <div style={styles.instructionBanner}>
                        Selectează elementul din dreapta cu care vrei să îl asociezi
                    </div>
                )}

                {config.canvas && (
                    <div ref={containerRef} style={styles.canvasContainer}>
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
                                {topLevelElements.map(el => renderCanvasElement(el))}
                            </Layer>
                        </Stage>
                    </div>
                )}

                <div style={styles.matchArea}>
                    <div ref={leftColRef} style={styles.column}>
                        <div style={styles.columnLabel}>◀</div>
                        {leftItems.map(item => {
                            const isSelected = selectedLeft === item.id;
                            const isPaired = !!pairs[item.id];
                            const state = getItemState(item.id);
                            const children = getChildren(item.id);
                            return (
                                <div
                                    key={item.id}
                                    id={`match-left-${item.id}`}
                                    onClick={() => isPaired ? removePair(item.id) : handleLeftClick(item.id)}
                                    style={{
                                        ...styles.card,
                                        background: cardBackground(state, isSelected),
                                        border: cardBorder(state, isSelected, isPaired),
                                        boxShadow: isSelected ? `0 0 0 3px ${CONNECTOR_COLOR}33` : 'none',
                                        cursor: phase === 'playing' ? 'pointer' : 'default',
                                        position: 'relative',
                                    }}
                                >
                                    <MatchItemContent item={item} childElements={children} cardW={leftColW} />
                                    {isPaired && phase === 'playing' && (
                                        <span style={styles.removeHint}>✕</span>
                                    )}
                                    {state === 'correct' && <span style={styles.stateBadgeCorrect}>✓</span>}
                                    {state === 'wrong' && <span style={styles.stateBadgeWrong}>✗</span>}
                                </div>
                            );
                        })}
                    </div>

                    <div style={styles.connectorArea}>
                        <svg
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {Object.entries(pairs).map(([leftId, rightId]) => {
                                const leftEl = document.getElementById(`match-left-${leftId}`);
                                const rightEl = document.getElementById(`match-right-${rightId}`);
                                const areaEl = document.getElementById('match-connector-area');
                                if (!leftEl || !rightEl || !areaEl) return null;
                                const areaRect = areaEl.getBoundingClientRect();
                                const lRect = leftEl.getBoundingClientRect();
                                const rRect = rightEl.getBoundingClientRect();
                                const x1 = lRect.right - areaRect.left;
                                const y1 = lRect.top + lRect.height / 2 - areaRect.top;
                                const x2 = rRect.left - areaRect.left;
                                const y2 = rRect.top + rRect.height / 2 - areaRect.top;
                                const state = getItemState(leftId);
                                const color = state === 'correct' ? CONNECTOR_COLOR_CORRECT : state === 'wrong' ? CONNECTOR_COLOR_WRONG : CONNECTOR_COLOR;
                                const cx = (x1 + x2) / 2;
                                return (
                                    <path
                                        key={leftId}
                                        d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                                        stroke={color}
                                        strokeWidth={CONNECTOR_WIDTH}
                                        strokeDasharray="8 4"
                                        fill="none"
                                        strokeLinecap="round"
                                    />
                                );
                            })}
                        </svg>
                    </div>

                    <div style={styles.column}>
                        <div style={styles.columnLabel}>▶</div>
                        {rightItems.map(item => {
                            const isTargeted = Object.values(pairs).includes(item.id);
                            const leftId = Object.keys(pairs).find(k => pairs[k] === item.id);
                            const state = leftId ? getItemState(leftId) : 'idle';
                            const children = getChildren(item.id);
                            return (
                                <div
                                    id={`match-right-${item.id}`}
                                    key={item.id}
                                    onClick={() => handleRightClick(item.id)}
                                    style={{
                                        ...styles.card,
                                        background: cardBackground(state, false, isTargeted ? '#f5f3ff' : selectedLeft ? '#f0f4ff' : '#ffffff'),
                                        border: cardBorder(state, false, isTargeted) || (selectedLeft ? `2px dashed ${CONNECTOR_COLOR}` : '2px solid #e5e7eb'),
                                        cursor: selectedLeft && phase === 'playing' ? 'pointer' : 'default',
                                    }}
                                >
                                    <MatchItemContent item={item} childElements={children} cardW={leftColW} />
                                    {state === 'correct' && <span style={styles.stateBadgeCorrect}>✓</span>}
                                    {state === 'wrong' && <span style={styles.stateBadgeWrong}>✗</span>}
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
                                opacity: canFinish ? 1 : 0.6,
                            }}
                            onClick={handleFinish}
                            disabled={!canFinish}
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
    previewBanner: {
        width: '100%', background: '#fef3c7', borderBottom: '1px solid #fde68a',
        padding: '8px 20px', textAlign: 'center', fontSize: '0.82rem',
        fontWeight: 700, color: '#92400e', flexShrink: 0,
    },
    instructionBanner: {
        background: '#eef2ff', borderBottom: '1px solid #c7d2fe',
        width: '100%', padding: '7px 20px', textAlign: 'center',
        fontSize: '0.82rem', fontWeight: 700, color: '#4338ca', flexShrink: 0,
    },
    description: {
        maxWidth: 640, textAlign: 'center', color: '#6b7280', fontWeight: 600,
        fontSize: '0.9rem', margin: '16px 20px 0', flexShrink: 0,
    },
    canvasContainer: {
        flexShrink: 0, width: '100%', display: 'flex', justifyContent: 'center',
        padding: '8px 20px 0', boxSizing: 'border-box',
    },
    matchArea: {
        flex: 1, minHeight: 0, width: '100%', maxWidth: 1200,
        display: 'flex', gap: 0, padding: '16px 24px',
        boxSizing: 'border-box', overflowY: 'auto', position: 'relative',
    },
    column: {
        flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0,
    },
    columnLabel: {
        fontSize: '0.65rem', fontWeight: 900, color: '#d1d5db',
        textAlign: 'center', letterSpacing: 2, marginBottom: 2,
    },
    connectorArea: {
        flexShrink: 0, width: 80, position: 'relative',
    },
    card: {
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: CARD_MIN_H,
        boxSizing: 'border-box',
        userSelect: 'none',
        transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
        position: 'relative',
        overflow: 'hidden',
    },
    removeHint: {
        position: 'absolute', top: 4, right: 6,
        fontSize: 10, color: '#9ca3af', fontWeight: 600,
    },
    stateBadgeCorrect: {
        position: 'absolute', top: 4, right: 6,
        fontSize: '0.7rem', fontWeight: 900, color: '#22c55e',
    },
    stateBadgeWrong: {
        position: 'absolute', top: 4, right: 6,
        fontSize: '0.7rem', fontWeight: 900, color: '#ef4444',
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
