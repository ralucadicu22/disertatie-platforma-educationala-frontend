import { useMemo, useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import api from '../../api/axios';
import PlayerText from './PlayerText';
import PlayerImage from './PlayerImage';
import PlayerShape from './PlayerShape';
import ParticleBurst from './ParticleBurst';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { getTheme } from '../../constants/themes.js';
import ExerciseFeedbackWidget from '../feedback/ExerciseFeedbackWidget';

const CONTAINER_PADDING = 40;
const SNAP_RADIUS = 80;

const audioCtx = { current: null };
const getCtx = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx.current;
};
const playTone = (freq, dur = 0.15, type = 'sine', gain = 0.1) => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type; osc.frequency.value = freq;
        g.gain.setValueAtTime(gain, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + dur);
    } catch {}
};
const soundCorrect = () => {
    playTone(523, 0.12, 'sine', 0.12);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.1), 100);
};
const soundWrong = () => playTone(150, 0.2, 'sawtooth', 0.08);

export default function DragAndDropPlayer({ exerciseId, config, onExit, isPreview = false }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);

    const theme = getTheme(config.meta?.themeId || 'formal');
    const canvasWidth = config.canvas.width;
    const canvasHeight = config.canvas.height;
    const allElements = config.elements;

    const draggableDefs = useMemo(() =>
            allElements.filter(el => el.behavior === 'draggable' && !el.hidden),
        [allElements]
    );

    const targetDefs = useMemo(() =>
            allElements.filter(el => el.behavior === 'dropTarget' && !el.hidden),
        [allElements]
    );

    const staticElements = useMemo(() =>
            allElements.filter(el => el.behavior !== 'draggable' && el.behavior !== 'dropTarget'),
        [allElements]
    );

    const dropMapping = config.solution?.dropMapping || {};
    const totalCorrect = Object.keys(dropMapping).length;

    const [positions, setPositions] = useState(() => {
        const init = {};
        draggableDefs.forEach(el => { init[el.id] = { x: el.x, y: el.y }; });
        return init;
    });

    const originPositions = useMemo(() => {
        const orig = {};
        draggableDefs.forEach(el => { orig[el.id] = { x: el.x, y: el.y }; });
        return orig;
    }, [draggableDefs]);

    const [placed, setPlaced] = useState({});
    const [activeTargetId, setActiveTargetId] = useState(null);
    const draggingRef = useRef(null);
    const [bursts, setBursts] = useState([]);
    const [phase, setPhase] = useState('playing');
    const [result, setResult] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [wrongId, setWrongId] = useState(null);
    const wrongTimeoutRef = useRef(null);
    const [wrongClicks, setWrongClicks] = useState(0);
    const [hintsAvailable, setHintsAvailable] = useState([]);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [showSolutionPanel, setShowSolutionPanel] = useState(false);
    const [currentHint, setCurrentHint] = useState(null);
    const [highlightedIds, setHighlightedIds] = useState(new Set());
    const startTime = useRef(Date.now());

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
        if (hint.targetElementId) {
            setHighlightedIds(prev => new Set([...prev, hint.targetElementId]));
            setTimeout(() => setHighlightedIds(prev => {
                const n = new Set(prev); n.delete(hint.targetElementId); return n;
            }), 3000);
        }
    };
    const triggerSmartHint = (wrongCount) => {
        const round = Math.floor(wrongCount / 3);

        if (round === 1) {
            const textHint = hintsAvailable.find(h => h.type === 'TEXT');
            if (textHint) {
                setCurrentHint(textHint);
                setTimeout(() => setCurrentHint(null), 4000);
            }
            return;
        }

        const notPlacedYet = draggableDefs.filter(el => !placed[el.id]);
        if (notPlacedYet.length === 0) return;

        const target = notPlacedYet[Math.floor(Math.random() * notPlacedYet.length)];

        const highlightHint = hintsAvailable.find(
            h => h.type === 'HIGHLIGHT' && h.targetElementId === target.id
        ) || {
            id: `auto_${target.id}`,
            type: 'HIGHLIGHT',
            targetElementId: target.id,
            text: 'Încearcă să plasezi elementul evidențiat!',
        };

        setCurrentHint(highlightHint);
        setHighlightedIds(prev => new Set([...prev, target.id]));
        setTimeout(() => {
            setHighlightedIds(prev => {
                const n = new Set(prev);
                n.delete(target.id);
                return n;
            });
            setCurrentHint(null);
        }, 3000);
    };

    const getAbsPos = (el) => {
        if (!el.parentId) return { x: el.x, y: el.y };
        const parent = allElements.find(p => p.id === el.parentId);
        if (!parent) return { x: el.x, y: el.y };
        const parentAbs = getAbsPos(parent);
        return { x: parentAbs.x + el.x, y: parentAbs.y + el.y };
    };

    const getNearestTarget = (x, y, w, h) => {
        const cx = x + w / 2;
        const cy = y + h / 2;
        let nearest = null;
        let nearestDist = Infinity;
        targetDefs.forEach(t => {
            const tAbs = getAbsPos(t);
            const tcx = tAbs.x + t.width / 2;
            const tcy = tAbs.y + t.height / 2;
            const dist = Math.hypot(cx - tcx, cy - tcy);
            if (dist < nearestDist) { nearestDist = dist; nearest = { ...t, absX: tAbs.x, absY: tAbs.y }; }
        });
        return nearestDist <= SNAP_RADIUS ? nearest : null;
    };

    const snapToTarget = (el, target, node) => {
        soundCorrect();
        const targetX = target.absX;
        const targetY = target.absY;
        new Konva.Tween({
            node, duration: 0.25,
            x: targetX, y: targetY,
            easing: Konva.Easings.ElasticEaseOut,
        }).play();
        setPositions(prev => ({ ...prev, [el.id]: { x: targetX, y: targetY } }));
        setPlaced(prev => ({ ...prev, [el.id]: target.id }));
        setBursts(prev => [...prev, {
            id: `${el.id}_${Date.now()}`,
            x: targetX + el.width / 2,
            y: targetY + el.height / 2,
        }]);
    };

    const snapBack = (elId, node) => {
        const origin = originPositions[elId];
        new Konva.Tween({
            node, duration: 0.4,
            x: origin.x, y: origin.y,
            easing: Konva.Easings.ElasticEaseOut,
        }).play();
        setPositions(prev => ({ ...prev, [elId]: origin }));
    };

    const handleWrong = (elId, node) => {
        soundWrong();
        setWrongId(elId);
        clearTimeout(wrongTimeoutRef.current);
        wrongTimeoutRef.current = setTimeout(() => setWrongId(null), 600);
        snapBack(elId, node);
        setWrongClicks(prev => {
            const next = prev + 1;
            if (next % 3 === 0) setTimeout(() => triggerSmartHint(next), 400);
            return next;
        });
    };

    const handleDragMove = (el, e) => {
        if (placed[el.id]) return;
        const node = e.target;
        const nearest = getNearestTarget(node.x(), node.y(), el.width, el.height);
        setActiveTargetId(nearest ? nearest.id : null);
    };

    const handleDragEnd = (el, e) => {
        if (placed[el.id]) return;
        draggingRef.current = null;
        setActiveTargetId(null);

        const node = e.target;
        const nearest = getNearestTarget(node.x(), node.y(), el.width, el.height);

        if (!nearest) {
            snapBack(el.id, node);
            return;
        }

        if (isPreview) {
            if (dropMapping[el.id] === nearest.id) {
                snapToTarget(el, nearest, node);
            } else {
                handleWrong(el.id, node);
            }
        } else {
            api.post('/exercises/check-placement', {
                exerciseId, draggableId: el.id, targetId: nearest.id,
            }).then(res => {
                if (res.data.correct) {
                    snapToTarget(el, nearest, node);
                } else {
                    handleWrong(el.id, node);
                }
            }).catch(() => snapBack(el.id, node));
        }
    };


    const handleFinish = async () => {
        if (isPreview) {
            const correctCount = Object.entries(placed).filter(
                ([dId, tId]) => dropMapping[dId] === tId
            ).length;
            setResult({
                correct: correctCount === totalCorrect && totalCorrect > 0,
                score: totalCorrect > 0 ? correctCount / totalCorrect : 0,
                attemptsRemaining: null,
                newBadges: [],
            });
            setPhase('result');
            return;
        }
        setPhase('submitting');
        try {
            const durationSeconds = Math.floor((Date.now() - startTime.current) / 1000);
            const res = await api.post('/exercises/submit', {
                exerciseId,
                answer: placed,
                durationSeconds,
            });
            setResult(res.data);
            if (!res.data.correct && res.data.attemptsRemaining === 0) {
                const bof = res.data.behaviorOnFail;
                if (bof === 'showSolution') {
                    setShowSolutionPanel(true);
                }
            }
            setPhase('result');
            setShowFeedback(true);
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Eroare la trimitere');
            setPhase('playing');
        }
    };

    const handleRetry = () => {
        setPositions(() => {
            const init = {};
            draggableDefs.forEach(el => { init[el.id] = { x: el.x, y: el.y }; });
            return init;
        });
        setPlaced({});
        setResult(null);
        setSubmitError('');
        setPhase('playing');
        setCurrentHint(null);
        setHighlightedIds(new Set());
        setHintsUsed(0);
        setWrongId(null);
        setWrongClicks(0);
        setBursts([]);
        startTime.current = Date.now();
    };

    const topLevel = staticElements.filter(el => !el.parentId);
    const getChildren = (parentId) => staticElements.filter(el => el.parentId === parentId);

    const renderStatic = (el) => {
        if (el.hidden) return null;
        if (el.type === ELEMENT_TYPES.TEXT) return <PlayerText key={el.id} element={el} />;
        if (el.type === ELEMENT_TYPES.IMAGE) return (
            <PlayerImage key={el.id} element={el} interactionState={undefined} onElementClick={() => {}} />
        );
        if (el.type === ELEMENT_TYPES.SHAPE) return (
            <PlayerShape key={el.id} element={el} interactionState={undefined} onElementClick={() => {}} />
        );
        if (el.type === ELEMENT_TYPES.BOX) {
            return (
                <Group key={el.id} x={el.x} y={el.y} rotation={el.rotation || 0}>
                    <Rect
                        width={el.width} height={el.height}
                        fill={el.bgFill !== 'transparent' ? el.bgFill : undefined}
                        stroke={el.bgStroke !== 'transparent' ? el.bgStroke : undefined}
                        strokeWidth={el.bgStrokeWidth}
                        cornerRadius={el.bgCornerRadius}
                        listening={false}
                    />
                    {getChildren(el.id).map(child => renderStatic(child))}
                </Group>
            );
        }
        return null;
    };

    const placedCount = Object.keys(placed).length;
    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;
    const canShowHint = hintsAvailable.length > 0 && hintsUsed < hintsAvailable.length && phase === 'playing';

    return (
        <ThemeProvider themeId={config.meta?.themeId}>
            <div style={{
                height: '100vh', overflow: 'hidden',
                background: theme.colors.surface,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center',
                fontFamily: theme.font.family,
                color: theme.colors.text,
            }}>

                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={onExit}>← Ieși</button>
                    <div style={styles.progress}>
                        {totalCorrect > 0 ? `${placedCount}/${totalCorrect} plasate` : ''}
                    </div>
                    <div style={{ width: 80 }} />
                </div>

                {isPreview && (
                    <div style={styles.previewBanner}>
                        🔍 PREVIZUALIZARE — răspunsurile nu se salvează
                    </div>
                )}


                <div ref={containerRef} style={styles.canvasContainer}>
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

                                {topLevel.map(el => renderStatic(el))}


                                {targetDefs.map(target => {
                                    const abs = getAbsPos(target);
                                    const isActive = activeTargetId === target.id;
                                    const isOccupied = Object.values(placed).includes(target.id);
                                    return (
                                        <Group key={target.id} x={abs.x} y={abs.y}>
                                            <Rect
                                                width={target.width} height={target.height}
                                                fill={isOccupied ? 'rgba(34,197,94,0.15)'
                                                    : isActive ? 'rgba(79,107,246,0.15)'
                                                        : 'rgba(0,0,0,0.03)'}
                                                stroke={isOccupied ? '#22c55e'
                                                    : isActive ? '#4F6BF6'
                                                        : '#d1d5db'}
                                                strokeWidth={isActive ? 3 : 2}
                                                dash={isOccupied ? undefined : [10, 6]}
                                                cornerRadius={target.cornerRadius || 12}
                                                shadowEnabled={isActive}
                                                shadowColor="#4F6BF6"
                                                shadowBlur={isActive ? 20 : 0}
                                                shadowOpacity={0.4}
                                                listening={false}
                                            />
                                            {!isOccupied && (
                                                <Text
                                                    text="↓"
                                                    width={target.width} height={target.height}
                                                    align="center" verticalAlign="middle"
                                                    fontSize={24}
                                                    fill={isActive ? '#4F6BF6' : '#d1d5db'}
                                                    listening={false}
                                                />
                                            )}
                                        </Group>
                                    );
                                })}


                                {draggableDefs.map(el => {
                                    const pos = positions[el.id] || { x: el.x, y: el.y };
                                    return (
                                        <DraggableItem
                                            key={el.id}
                                            element={el}
                                            x={pos.x}
                                            y={pos.y}
                                            isPlaced={!!placed[el.id]}
                                            isWrong={wrongId === el.id}
                                            isHighlighted={highlightedIds.has(el.id)}
                                            onDragMove={(e) => handleDragMove(el, e)}
                                            onDragEnd={(e) => handleDragEnd(el, e)}
                                        />
                                    );
                                })}

                                {bursts.map(burst => (
                                    <ParticleBurst
                                        key={burst.id}
                                        x={burst.x} y={burst.y}
                                        onComplete={() => setBursts(prev => prev.filter(b => b.id !== burst.id))}
                                    />
                                ))}
                            </Layer>
                        </Stage>
                    </div>
                </div>


                {currentHint && (
                    <div style={{
                        ...styles.hintBox,
                        borderColor: currentHint.type === 'HIGHLIGHT' ? '#f59e0b' : '#4F6BF6',
                        background: currentHint.type === 'HIGHLIGHT' ? '#fffbeb' : '#f0f4ff',
                    }}>
                        <span style={styles.hintIcon}>
                            {currentHint.type === 'HIGHLIGHT' ? '🔦' : '💡'}
                        </span>
                        <span style={styles.hintText}>{currentHint.text || 'Hint disponibil'}</span>
                    </div>
                )}

                {submitError && <p style={styles.errorText}>{submitError}</p>}


                {phase !== 'result' && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        {canShowHint && (
                            <button
                                style={{ ...styles.hintBtn, borderRadius: theme.borderRadius }}
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
                        {config.settings?.explanation && result.correct && (
                            <p style={styles.explanationText}>{config.settings.explanation}</p>
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
                                {showSolutionPanel && config.settings?.explanation && (
                                    <div style={{
                                        marginTop: 12, background: '#f0fdf4', border: '2px solid #86efac',
                                        borderRadius: 12, padding: '14px 16px', maxWidth: 420, textAlign: 'left',
                                    }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#166534', margin: '0 0 6px 0' }}>
                                            💡 Explicație
                                        </p>
                                        <p style={{ fontSize: '0.85rem', color: '#374151', margin: 0, lineHeight: 1.5 }}>
                                            {config.settings.explanation}
                                        </p>
                                    </div>
                                )}

                                {isPreview ? 'Închide preview' : 'Înapoi la quiz'}
                            </button>
                        </div>
                        {attemptsExhausted && (
                            <p style={styles.exhaustedText}>Ai epuizat numărul de încercări.</p>
                        )}
                    </div>
                )}

                {!isPreview && showFeedback && (
                    <ExerciseFeedbackWidget
                        exerciseId={exerciseId}
                        onDismiss={() => setShowFeedback(false)}
                    />
                )}
            </div>
        </ThemeProvider>
    );
}

function DraggableItem({ element, x, y, isPlaced, isWrong, isHighlighted, onDragMove, onDragEnd }) {
    const [image] = useImage(
        element.type === ELEMENT_TYPES.IMAGE ? (element.src || '') : '',
        'anonymous'
    );
    const groupRef = useRef(null);


    useEffect(() => {
        if (!isWrong || !groupRef.current) return;
        const node = groupRef.current;
        const origX = node.x();
        const tween = new Konva.Tween({
            node, duration: 0.06, x: origX + 10, yoyo: true,
            easing: Konva.Easings.EaseInOut,
        });
        let count = 0;
        tween.onFinish = () => {
            if (count++ < 4) { tween.reset(); tween.play(); }
            else node.x(origX);
        };
        tween.play();
        return () => tween.destroy();
    }, [isWrong]);

    useEffect(() => {
        if (!isHighlighted || !groupRef.current) return;
        const node = groupRef.current;
        const tween = new Konva.Tween({
            node, duration: 0.5, scaleX: 1.1, scaleY: 1.1,
            easing: Konva.Easings.EaseInOut, yoyo: true,
            onFinish: () => { node.scaleX(1); node.scaleY(1); },
        });
        tween.play();
        return () => tween.destroy();
    }, [isHighlighted]);

    const w = element.width;
    const h = element.height;

    return (
        <Group
            ref={groupRef}
            x={x} y={y}
            draggable={!isPlaced}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onMouseEnter={(e) => {
                if (!isPlaced) e.target.getStage().container().style.cursor = 'grab';
            }}
            onMouseLeave={(e) => {
                e.target.getStage().container().style.cursor = 'default';
            }}
            onMouseDown={(e) => {
                if (!isPlaced) e.target.getStage().container().style.cursor = 'grabbing';
            }}
            onMouseUp={(e) => {
                e.target.getStage().container().style.cursor = 'grab';
            }}
            opacity={isPlaced ? 0.85 : 1}
        >

            {isHighlighted && (
                <Rect
                    x={-6} y={-6} width={w + 12} height={h + 12}
                    fill="transparent" stroke="#f59e0b" strokeWidth={4}
                    cornerRadius={10} dash={[8, 4]} listening={false}
                />
            )}


            {isWrong && (
                <Rect
                    x={-4} y={-4} width={w + 8} height={h + 8}
                    fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth={3}
                    cornerRadius={10} listening={false}
                />
            )}


            <Rect
                width={w} height={h}
                fill={element.type === ELEMENT_TYPES.SHAPE
                    ? (element.fill || '#4F6BF6')
                    : (image ? undefined : '#e5e7eb')}
                stroke={isPlaced ? '#22c55e' : (isWrong ? '#ef4444' : (element.stroke || '#e5e7eb'))}
                strokeWidth={isPlaced || isWrong ? 3 : (element.strokeWidth || 1)}
                cornerRadius={element.cornerRadius || 12}
                shadowEnabled={!isPlaced}
                shadowColor="#000"
                shadowBlur={12}
                shadowOpacity={0.15}
                shadowOffsetY={4}
            />

            {element.type === ELEMENT_TYPES.IMAGE && image && (
                <KonvaImage
                    image={image} width={w} height={h}
                    cornerRadius={element.cornerRadius || 12}
                    listening={false}
                />
            )}


            {element.type === ELEMENT_TYPES.TEXT && (
                <Text
                    text={element.text || ''}
                    width={w} height={h}
                    align="center" verticalAlign="middle"
                    fontSize={element.fontSize || 18}
                    fontFamily={element.fontFamily || 'Nunito'}
                    fill={element.fill || '#1a1d23'}
                    listening={false}
                />
            )}


            {isPlaced && (
                <Text
                    text="✓" width={w} height={h}
                    align="center" verticalAlign="middle"
                    fontSize={Math.min(w, h) * 0.4}
                    fontStyle="bold" fill="#22c55e"
                    listening={false}
                />
            )}
        </Group>
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
    errorText: { color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', marginTop: 8 },
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
        padding: '18px 24px', textAlign: 'center', minWidth: 280, maxWidth: 460,
        flexShrink: 0,
    },
    resultTitle: { fontSize: '1.1rem', fontWeight: 900, margin: '0 0 6px 0', color: '#1a1d23' },
    resultDetail: { fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', margin: '0 0 12px 0' },
    explanationText: {
        fontSize: '0.85rem', fontWeight: 600, color: '#374151', margin: '0 0 14px 0',
        lineHeight: 1.5, background: '#f9fafb', padding: '10px 14px', borderRadius: 10,
    },
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
