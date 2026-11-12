import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {getTheme} from "../../constants/themes.js";
import {ThemeProvider} from "../../contexts/ThemeContext.jsx";
import ExerciseFeedbackWidget from "../feedback/ExerciseFeedbackWidget.jsx";
import {ELEMENT_TYPES} from "../../constants/elementTypes.js";
import api from "../../api/axios.js";



const CONTAINER_PADDING = 40;

const resolveSrc = (src) => {
    if (!src) return null;
    return src.startsWith('http') || src.startsWith('data:') ? src : `http://localhost:8080${src}`;
};

const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

export default function PuzzlePlayer({ exerciseId, config, onExit, isPreview = false }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [placements, setPlacements] = useState({});
    const [draggingId, setDraggingId] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [shuffledOrder, setShuffledOrder] = useState([]);
    const [phase, setPhase] = useState('playing');
    const [result, setResult] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackPerPiece, setFeedbackPerPiece] = useState({});
    const startTimeRef = useRef(Date.now());

    const theme = getTheme(config?.meta?.themeId || 'formal');
    const canvasWidth = config?.canvas?.width || 800;
    const canvasHeight = config?.canvas?.height || 600;

    const allElements = config?.elements || [];
    const settings = config?.settings || {};
    const snapTolerance = settings.snapTolerance ?? 40;
    const validationMode = settings.feedbackType === 'instant' ? 'instant' : 'onCheck';
    const shuffleOnStart = settings.shuffleOnStart !== false;

    const piecesZone = useMemo(() => allElements.find(el => el.role === 'pieces-zone'), [allElements]);
    const boardZone = useMemo(() => allElements.find(el => el.role === 'board-zone'), [allElements]);

    const pieces = useMemo(() => {
        if (!piecesZone) return [];
        return allElements.filter(el => el.parentId === piecesZone.id && el.type === ELEMENT_TYPES.IMAGE && !el.isPlaceholder);
    }, [allElements, piecesZone]);

    const slots = useMemo(() => {
        if (!boardZone) return [];
        return allElements.filter(el => el.parentId === boardZone.id && el.role === 'puzzle-slot');
    }, [allElements, boardZone]);

    const ghostElements = useMemo(() => {
        if (!boardZone) return [];
        return allElements.filter(el => el.parentId === boardZone.id && el.role === 'puzzle-ghost');
    }, [allElements, boardZone]);

    const puzzleMapping = config.solution?.puzzleMapping || {};

    const getAbsolutePos = useCallback((el) => {
        let x = el.x || 0;
        let y = el.y || 0;
        let current = el;
        while (current.parentId) {
            const parent = allElements.find(p => p.id === current.parentId);
            if (!parent) break;
            x += parent.x || 0;
            y += parent.y || 0;
            current = parent;
        }
        return { x, y };
    }, [allElements]);

    useEffect(() => {
        if (pieces.length === 0) return;
        setShuffledOrder(shuffleOnStart ? shuffle(pieces.map(p => p.id)) : pieces.map(p => p.id));
    }, [pieces, shuffleOnStart]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const resize = () => {
            const aw = el.clientWidth - CONTAINER_PADDING;
            const ah = el.clientHeight - CONTAINER_PADDING;
            setScale(Math.min(1, aw / canvasWidth, ah / canvasHeight));
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        return () => ro.disconnect();
    }, [canvasWidth, canvasHeight]);

    const pieceSlotPositions = useMemo(() => {
        if (!piecesZone || pieces.length === 0) return {};
        const positions = {};
        pieces.forEach(p => {
            if (p.x !== undefined && p.y !== undefined) {
                positions[p.id] = { x: p.x, y: p.y };
            }
        });
        return positions;
    }, [piecesZone, pieces]);

    const getPieceDrawerPos = useCallback((pieceId) => {
        if (!piecesZone) return { x: 0, y: 0 };
        const zonePos = getAbsolutePos(piecesZone);
        const shuffledIdx = shuffledOrder.indexOf(pieceId);
        if (shuffledIdx === -1) return { x: zonePos.x, y: zonePos.y };
        const originalPieceAtSlot = pieces[shuffledIdx];
        if (!originalPieceAtSlot) return { x: zonePos.x, y: zonePos.y };
        const slotPos = pieceSlotPositions[originalPieceAtSlot.id];
        if (slotPos) {
            return {
                x: zonePos.x + slotPos.x,
                y: zonePos.y + slotPos.y,
            };
        }
        const piece = pieces.find(p => p.id === pieceId);
        const pieceW = piece?.width || 100;
        const pieceH = piece?.height || 100;
        const padding = piecesZone.padding || 16;
        const availW = piecesZone.width - padding * 2;
        const perRow = Math.max(1, Math.floor(availW / (pieceW + 10)));
        const row = Math.floor(shuffledIdx / perRow);
        const col = shuffledIdx % perRow;
        return {
            x: zonePos.x + padding + col * (pieceW + 10),
            y: zonePos.y + padding + row * (pieceH + 10),
        };
    }, [shuffledOrder, piecesZone, pieces, pieceSlotPositions, getAbsolutePos]);

    const getPieceCurrentPos = useCallback((pieceId) => {
        if (draggingId === pieceId) return dragPos;
        const slotId = placements[pieceId];
        if (slotId) {
            const slot = slots.find(s => s.id === slotId);
            if (slot) return getAbsolutePos(slot);
        }
        return getPieceDrawerPos(pieceId);
    }, [draggingId, dragPos, placements, slots, getAbsolutePos, getPieceDrawerPos]);

    const handleMouseDown = (e, piece) => {
        if (phase !== 'playing') return;
        e.preventDefault();
        const canvasEl = containerRef.current?.querySelector('[data-puzzle-canvas]');
        if (!canvasEl) return;
        const rect = canvasEl.getBoundingClientRect();
        const current = getPieceCurrentPos(piece.id);
        setDraggingId(piece.id);
        setDragOffset({
            x: (e.clientX - rect.left) / scale - current.x,
            y: (e.clientY - rect.top) / scale - current.y,
        });
        setDragPos(current);
    };

    useEffect(() => {
        if (!draggingId) return;
        const handleMouseMove = (e) => {
            const canvasEl = containerRef.current?.querySelector('[data-puzzle-canvas]');
            if (!canvasEl) return;
            const rect = canvasEl.getBoundingClientRect();
            setDragPos({
                x: (e.clientX - rect.left) / scale - dragOffset.x,
                y: (e.clientY - rect.top) / scale - dragOffset.y,
            });
        };
        const handleMouseUp = () => {
            const piece = pieces.find(p => p.id === draggingId);
            if (!piece) {
                setDraggingId(null);
                return;
            }
            const pieceCenterX = dragPos.x + (piece.width || 100) / 2;
            const pieceCenterY = dragPos.y + (piece.height || 100) / 2;
            let bestSlot = null;
            let bestDist = Infinity;
            for (const slot of slots) {
                const taken = Object.entries(placements).find(([pid, sid]) => sid === slot.id && pid !== draggingId);
                if (taken) continue;
                const slotPos = getAbsolutePos(slot);
                const slotCenterX = slotPos.x + slot.width / 2;
                const slotCenterY = slotPos.y + slot.height / 2;
                const dist = Math.hypot(pieceCenterX - slotCenterX, pieceCenterY - slotCenterY);
                if (dist < snapTolerance && dist < bestDist) {
                    bestDist = dist;
                    bestSlot = slot;
                }
            }
            setPlacements(prev => {
                const next = { ...prev };
                if (bestSlot) {
                    next[draggingId] = bestSlot.id;
                    if (validationMode === 'instant') {
                        const expected = puzzleMapping[draggingId];
                        setFeedbackPerPiece(fp => ({ ...fp, [draggingId]: expected === bestSlot.id ? 'ok' : 'wrong' }));
                    }
                } else {
                    delete next[draggingId];
                    setFeedbackPerPiece(fp => {
                        const n = { ...fp };
                        delete n[draggingId];
                        return n;
                    });
                }
                return next;
            });
            setDraggingId(null);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingId, dragOffset, dragPos, scale, pieces, slots, placements, snapTolerance, getAbsolutePos, validationMode, puzzleMapping]);

    const computeScore = () => {
        const total = Object.keys(puzzleMapping).length;
        if (total === 0) return { correct: false, score: 0, correctCount: 0, total: 0 };
        let correctCount = 0;
        Object.entries(puzzleMapping).forEach(([pieceId, expectedSlotId]) => {
            if (placements[pieceId] === expectedSlotId) correctCount++;
        });
        const scoringMode = settings.scoringMode || 'integral';
        const scoreValue = scoringMode === 'partial' ? correctCount / total : (correctCount === total ? 1 : 0);
        return { correct: correctCount === total, score: scoreValue, correctCount, total };
    };

    const handleFinish = async () => {
        const scoreData = computeScore();
        if (isPreview) {
            setResult({ ...scoreData, attemptsRemaining: null, newBadges: [] });
            setPhase('result');
            return;
        }
        setPhase('submitting');
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
            const res = await api.post('/exercises/submit', { exerciseId, answer: placements, durationSeconds });
            setResult(res.data);
            setPhase('result');
            setShowFeedback(true);
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Eroare la trimitere');
            setPhase('playing');
        }
    };

    const handleRetry = () => {
        setPlacements({});
        setFeedbackPerPiece({});
        setResult(null);
        setSubmitError('');
        setPhase('playing');
        setShuffledOrder(shuffleOnStart ? shuffle(pieces.map(p => p.id)) : pieces.map(p => p.id));
        startTimeRef.current = Date.now();
    };

    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;
    const allPlaced = pieces.length > 0 && pieces.every(p => placements[p.id]);

    const renderStaticEl = (el) => {
        if (el.hidden || el.isPlaceholder) return null;
        if (el.role === 'pieces-zone' || el.role === 'board-zone') {
            const pos = getAbsolutePos(el);
            return (
                <div
                    key={el.id}
                    style={{
                        position: 'absolute',
                        left: pos.x * scale,
                        top: pos.y * scale,
                        width: el.width * scale,
                        height: el.height * scale,
                        background: el.bgFill === 'transparent' ? 'transparent' : (el.bgFill || '#f9fafb'),
                        border: el.bgStroke && el.bgStroke !== 'transparent' ? `${(el.bgStrokeWidth || 1) * scale}px solid ${el.bgStroke}` : 'none',
                        borderRadius: (el.bgCornerRadius || 0) * scale,
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                >
                    {el.label && (
                        <div style={{
                            position: 'absolute', top: 8 * scale, left: 12 * scale,
                            fontSize: Math.max(10, 13 * scale), fontWeight: 800, color: '#6b7280',
                            letterSpacing: 0.5, textTransform: 'uppercase',
                        }}>
                            {el.label}
                        </div>
                    )}
                </div>
            );
        }
        if (el.role === 'puzzle-slot') {
            const pos = getAbsolutePos(el);
            const occupantId = Object.entries(placements).find(([, sid]) => sid === el.id)?.[0];
            const occupantFeedback = occupantId ? feedbackPerPiece[occupantId] : null;
            const slotColor = occupantFeedback === 'ok' ? '#86efac'
                : occupantFeedback === 'wrong' ? '#fca5a5'
                    : '#f3f4f6';
            const slotStroke = occupantFeedback === 'ok' ? '#22c55e'
                : occupantFeedback === 'wrong' ? '#ef4444'
                    : '#cbd5e1';
            return (
                <div
                    key={el.id}
                    style={{
                        position: 'absolute',
                        left: pos.x * scale,
                        top: pos.y * scale,
                        width: el.width * scale,
                        height: el.height * scale,
                        background: slotColor,
                        border: `${Math.max(1, 2 * scale)}px dashed ${slotStroke}`,
                        borderRadius: (el.bgCornerRadius || 8) * scale,
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                />
            );
        }
        if (el.role === 'puzzle-ghost' && el.type === ELEMENT_TYPES.IMAGE) {
            const pos = getAbsolutePos(el);
            const src = resolveSrc(el.src);
            if (!src) return null;
            return (
                <img
                    key={el.id}
                    src={src}
                    alt=""
                    draggable={false}
                    style={{
                        position: 'absolute',
                        left: pos.x * scale,
                        top: pos.y * scale,
                        width: el.width * scale,
                        height: el.height * scale,
                        objectFit: 'contain',
                        opacity: el.opacity ?? 0.25,
                        pointerEvents: 'none',
                        zIndex: 1,
                        userSelect: 'none',
                    }}
                />
            );
        }
        if (el.type === ELEMENT_TYPES.TEXT) {
            const pos = getAbsolutePos(el);
            return (
                <div
                    key={el.id}
                    style={{
                        position: 'absolute',
                        left: pos.x * scale,
                        top: pos.y * scale,
                        width: el.width * scale,
                        height: el.height * scale,
                        display: 'flex',
                        alignItems: el.verticalAlign === 'top' ? 'flex-start' : el.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                        justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center',
                        padding: (el.padding || 0) * scale,
                        background: el.bgFill === 'transparent' ? 'transparent' : (el.bgFill || 'transparent'),
                        border: el.bgStroke && el.bgStroke !== 'transparent' ? `${(el.bgStrokeWidth || 1) * scale}px solid ${el.bgStroke}` : 'none',
                        borderRadius: (el.bgCornerRadius || 0) * scale,
                        fontFamily: el.fontFamily || 'Nunito',
                        fontSize: (el.fontSize || 16) * scale,
                        fontWeight: el.fontStyle?.includes('bold') ? 'bold' : 'normal',
                        fontStyle: el.fontStyle?.includes('italic') ? 'italic' : 'normal',
                        color: el.fill || '#1a1d23',
                        textAlign: el.align || 'left',
                        pointerEvents: 'none',
                        boxSizing: 'border-box',
                        zIndex: 2,
                    }}
                >
                    {el.text}
                </div>
            );
        }
        if (el.type === ELEMENT_TYPES.IMAGE && el.parentId !== piecesZone?.id) {
            const pos = getAbsolutePos(el);
            const src = resolveSrc(el.src);
            if (!src) return null;
            return (
                <img
                    key={el.id}
                    src={src}
                    alt=""
                    draggable={false}
                    style={{
                        position: 'absolute',
                        left: pos.x * scale,
                        top: pos.y * scale,
                        width: el.width * scale,
                        height: el.height * scale,
                        objectFit: 'contain',
                        opacity: el.opacity ?? 1,
                        pointerEvents: 'none',
                        zIndex: 1,
                        userSelect: 'none',
                    }}
                />
            );
        }
        return null;
    };

    const renderPiece = (piece) => {
        const pos = getPieceCurrentPos(piece.id);
        const src = resolveSrc(piece.src);
        if (!src) return null;
        const isDragging = draggingId === piece.id;
        const feedback = feedbackPerPiece[piece.id];
        const placed = !!placements[piece.id];
        const borderColor = feedback === 'ok' ? '#22c55e'
            : feedback === 'wrong' ? '#ef4444'
                : placed ? '#6366f1' : '#9ca3af';
        return (
            <div
                key={piece.id}
                onMouseDown={(e) => handleMouseDown(e, piece)}
                style={{
                    position: 'absolute',
                    left: pos.x * scale,
                    top: pos.y * scale,
                    width: (piece.width || 100) * scale,
                    height: (piece.height || 100) * scale,
                    cursor: phase === 'playing' ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    border: `${Math.max(1, 2 * scale)}px solid ${borderColor}`,
                    borderRadius: (piece.cornerRadius || 8) * scale,
                    background: 'white',
                    boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    zIndex: isDragging ? 100 : 10,
                    transition: isDragging ? 'none' : 'left 0.2s, top 0.2s',
                    userSelect: 'none',
                }}
            >
                <img
                    src={src}
                    alt=""
                    draggable={false}
                    style={{
                        width: '100%', height: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                />
            </div>
        );
    };

    const noContent = pieces.length === 0 || slots.length === 0;

    return (
        <ThemeProvider themeId={config.meta?.themeId}>
            <div style={{ height: '100vh', overflow: 'hidden', background: theme.colors.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: theme.font.family }}>
                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={onExit}>← Ieși</button>
                    <span style={styles.title}>{config.meta?.name || 'Puzzle'}</span>
                    <div style={{ width: 80 }} />
                </div>
                {isPreview && <div style={styles.previewBanner}>🔍 PREVIZUALIZARE — răspunsurile nu se salvează</div>}
                {config.meta?.description && <p style={styles.description}>{config.meta.description}</p>}

                <div ref={containerRef} style={styles.canvasContainer}>
                    <div
                        data-puzzle-canvas
                        style={{
                            position: 'relative',
                            width: canvasWidth * scale,
                            height: canvasHeight * scale,
                            background: config.canvas.background || '#ffffff',
                            overflow: 'hidden',
                        }}
                    >
                        {noContent && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#9ca3af', fontSize: '0.95rem', fontWeight: 600, padding: 20, textAlign: 'center',
                            }}>
                                Puzzle incomplet — adaugă piese în Sertar și sloturi în Tablă (din editor).
                            </div>
                        )}
                        {allElements.map(el => renderStaticEl(el))}
                        {pieces.map(renderPiece)}
                    </div>
                </div>

                {submitError && <p style={styles.errorText}>{submitError}</p>}

                {phase !== 'result' && !noContent && (
                    <button
                        style={{ ...styles.finishBtn, background: theme.colors.primary, borderRadius: theme.borderRadius }}
                        onClick={handleFinish}
                        disabled={phase === 'submitting' || !allPlaced}
                    >
                        {phase === 'submitting' ? 'Se trimite...' : 'Verifică'}
                    </button>
                )}

                {phase === 'result' && result && (
                    <div style={{ ...styles.resultPanel, borderColor: result.correct ? '#22c55e' : '#ef4444', borderRadius: theme.borderRadius }}>
                        <p style={styles.resultTitle}>{result.correct ? '🎉 Corect!' : '❌ Nu e chiar corect'}</p>
                        {settings.explanation && (
                            <p style={{ ...styles.resultDetail, color: '#374151', fontStyle: 'italic' }}>
                                {settings.explanation}
                            </p>
                        )}
                        <p style={styles.resultDetail}>Scor: {Math.round(result.score * 100)}%</p>
                        {typeof result.correctCount === 'number' && (
                            <p style={{ ...styles.resultDetail, color: '#374151' }}>
                                {result.correctCount} / {result.total} piese plasate corect
                            </p>
                        )}
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
    canvasContainer: { flex: 1, minHeight: 0, width: '100%', maxWidth: 1240, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' },
    errorText: { color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', marginTop: 8, flexShrink: 0 },
    finishBtn: { padding: '12px 28px', color: 'white', border: 'none', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', marginTop: 12, flexShrink: 0 },
    resultPanel: { marginTop: 16, border: '2px solid', padding: '18px 24px', textAlign: 'center', minWidth: 280, maxWidth: 460, flexShrink: 0 },
    resultTitle: { fontSize: '1.1rem', fontWeight: 900, margin: '0 0 6px 0', color: '#1a1d23' },
    resultDetail: { fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', margin: '0 0 12px 0' },
    resultActions: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
    retryBtn: { padding: '9px 20px', background: '#1a1d23', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },
    quizBtn: { padding: '9px 20px', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },
};