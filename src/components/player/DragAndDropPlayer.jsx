import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, RegularPolygon, Line, Image as KonvaImage, Group, Text } from 'react-konva';
import useImage from 'use-image';
import Matter from 'matter-js';
import Konva from 'konva';
import api from '../../api/axios';
import PlayerText from './PlayerText';
import PlayerImage from './PlayerImage';
import PlayerShape from './PlayerShape';
import ParticleBurst from './ParticleBurst';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import { getAbsolutePosition } from '../../utils/elementPosition';

const CONTAINER_PADDING = 40;
const MAGNET_RADIUS = 110;
const SNAP_RADIUS = 70;

const noop = () => {};

// Sunete minimale via Web Audio (fara dependinte)
const audioCtxRef = { current: null };
const getAudioCtx = () => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
};

const playTone = (freq, duration = 0.15, type = 'sine', gain = 0.1) => {
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(gain, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch {}
};

const soundGrab = () => playTone(220, 0.08, 'sine', 0.05);
const soundCorrect = () => {
    playTone(523, 0.12, 'sine', 0.12);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.1), 100);
};
const soundWrong = () => playTone(150, 0.2, 'sawtooth', 0.08);

export default function DragAndDropPlayer({ exerciseId, config, onExit }) {
    const containerRef = useRef(null);
    const stageRef = useRef(null);
    const layerRef = useRef(null);
    const [scale, setScale] = useState(1);

    const [bgImage] = useImage(config.canvas.backgroundImage || '', 'anonymous');

    const canvasWidth = config.canvas.width;
    const canvasHeight = config.canvas.height;

    const draggableElements = useMemo(() => {
        return config.elements
            .filter(el => el.behavior === 'draggable' && !el.hidden)
            .map(el => {
                const abs = getAbsolutePosition(el, config.elements);
                return { ...el, x: abs.x, y: abs.y, parentId: null };
            });
    }, [config.elements]);

    const targetElements = useMemo(() => {
        return config.elements
            .filter(el => el.behavior === 'dropTarget' && !el.hidden)
            .map(el => {
                const abs = getAbsolutePosition(el, config.elements);
                return { ...el, x: abs.x, y: abs.y, parentId: null };
            });
    }, [config.elements]);

    const staticElements = useMemo(
        () => config.elements.filter(el => el.behavior !== 'draggable' && el.behavior !== 'dropTarget'),
        [config.elements]
    );

    const totalCorrect = useMemo(() => config.solution?.correctCount ?? 0, [config.solution]);

    const engineRef = useRef(null);
    const runnerRef = useRef(null);
    const bodiesRef = useRef({});
    const konvaNodeRefs = useRef({});
    const targetNodeRefs = useRef({});
    const draggingIdRef = useRef(null);
    const placedCorrectlyRef = useRef(new Set());

    const [placedCount, setPlacedCount] = useState(0);
    const [activeTargetId, setActiveTargetId] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    const [bursts, setBursts] = useState([]);
    const [phase, setPhase] = useState('playing');
    const [result, setResult] = useState(null);
    const [submitError, setSubmitError] = useState('');

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

    // Pulse la zona activa (magnet)
    useEffect(() => {
        if (!activeTargetId) return;
        const node = targetNodeRefs.current[activeTargetId];
        if (!node) return;

        const tween = new Konva.Tween({
            node,
            duration: 0.4,
            scaleX: 1.08,
            scaleY: 1.08,
            easing: Konva.Easings.EaseInOut,
            yoyo: true,
            onFinish: () => {
                node.scaleX(1);
                node.scaleY(1);
            },
        });
        tween.play();
        return () => tween.destroy();
    }, [activeTargetId]);

    useEffect(() => {
        if (!stageRef.current) return;

        const engine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });
        const world = engine.world;

        const wallThickness = 60;
        const walls = [
            Matter.Bodies.rectangle(canvasWidth / 2, -wallThickness / 2, canvasWidth + wallThickness * 2, wallThickness, { isStatic: true }),
            Matter.Bodies.rectangle(canvasWidth / 2, canvasHeight + wallThickness / 2, canvasWidth + wallThickness * 2, wallThickness, { isStatic: true }),
            Matter.Bodies.rectangle(-wallThickness / 2, canvasHeight / 2, wallThickness, canvasHeight + wallThickness * 2, { isStatic: true }),
            Matter.Bodies.rectangle(canvasWidth + wallThickness / 2, canvasHeight / 2, wallThickness, canvasHeight + wallThickness * 2, { isStatic: true }),
        ];
        Matter.World.add(world, walls);

        const draggableBodies = {};
        draggableElements.forEach(el => {
            const body = Matter.Bodies.rectangle(
                el.x + el.width / 2, el.y + el.height / 2, el.width, el.height,
                { restitution: 0.7, friction: 0.05, frictionAir: 0.06, label: el.id }
            );
            draggableBodies[el.id] = body;
            Matter.World.add(world, body);
        });
        bodiesRef.current = draggableBodies;

        const mouse = Matter.Mouse.create(stageRef.current.container());
        Matter.Mouse.setScale(mouse, { x: 1 / scale, y: 1 / scale });

        const mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse,
            constraint: { stiffness: 0.3, damping: 0.15, render: { visible: false } },
        });
        Matter.World.add(world, mouseConstraint);

        Matter.Events.on(mouseConstraint, 'startdrag', (event) => {
            draggingIdRef.current = event.body?.label ?? null;
            if (event.body) soundGrab();
        });

        Matter.Events.on(mouseConstraint, 'enddrag', (event) => {
            const body = event.body;
            draggingIdRef.current = null;
            setActiveTargetId(null);
            if (body) handleDragEnd(body);
        });

        Matter.Events.on(engine, 'beforeUpdate', () => {
            const draggedId = draggingIdRef.current;
            if (!draggedId) return;
            const body = draggableBodies[draggedId];
            if (!body || body.isStatic) return;

            let nearest = null;
            let nearestDist = Infinity;
            targetElements.forEach(t => {
                if (Object.values(placedCorrectlyRef.current).includes(t.id)) return;
                const cx = t.x + t.width / 2;
                const cy = t.y + t.height / 2;
                const dist = Math.hypot(body.position.x - cx, body.position.y - cy);
                if (dist < nearestDist) { nearestDist = dist; nearest = t; }
            });

            if (nearest && nearestDist < MAGNET_RADIUS) {
                const cx = nearest.x + nearest.width / 2;
                const cy = nearest.y + nearest.height / 2;
                const dx = cx - body.position.x;
                const dy = cy - body.position.y;
                const len = Math.hypot(dx, dy) || 1;
                const strength = 0.0006 * (1 - nearestDist / MAGNET_RADIUS);
                Matter.Body.applyForce(body, body.position, { x: (dx / len) * strength, y: (dy / len) * strength });
                setActiveTargetId(prev => (prev === nearest.id ? prev : nearest.id));
            } else {
                setActiveTargetId(prev => (prev === null ? prev : null));
            }
        });

        const runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);
        engineRef.current = engine;
        runnerRef.current = runner;

        let rafId;
        const syncLoop = () => {
            Object.entries(draggableBodies).forEach(([id, body]) => {
                const node = konvaNodeRefs.current[id];
                if (node) {
                    node.x(body.position.x);
                    node.y(body.position.y);
                    node.rotation((body.angle * 180) / Math.PI);
                }
            });
            layerRef.current?.batchDraw();
            rafId = requestAnimationFrame(syncLoop);
        };
        syncLoop();

        return () => {
            cancelAnimationFrame(rafId);
            Matter.Runner.stop(runner);
            Matter.World.clear(world, false);
            Matter.Engine.clear(engine);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scale, draggableElements, targetElements]);

    const handleDragEnd = async (body) => {
        const draggableId = body.label;
        if (placedCorrectlyRef.current.has(draggableId)) return;
        if (phase !== 'playing') return;

        let nearestTargetId = null;
        let nearestDist = Infinity;
        targetElements.forEach(t => {
            const cx = t.x + t.width / 2;
            const cy = t.y + t.height / 2;
            const dist = Math.hypot(body.position.x - cx, body.position.y - cy);
            if (dist < nearestDist) { nearestDist = dist; nearestTargetId = t.id; }
        });

        if (!nearestTargetId || nearestDist > SNAP_RADIUS) return;

        try {
            const res = await api.post('/exercises/check-placement', {
                exerciseId, draggableId, targetId: nearestTargetId,
            });

            if (res.data.correct) {
                const target = targetElements.find(t => t.id === nearestTargetId);
                const cx = target.x + target.width / 2;
                const cy = target.y + target.height / 2;
                Matter.Body.setPosition(body, { x: cx, y: cy });
                Matter.Body.setVelocity(body, { x: 0, y: 0 });
                Matter.Body.setAngle(body, 0);
                Matter.Body.setStatic(body, true);
                placedCorrectlyRef.current.add(draggableId);
                setPlacedCount(placedCorrectlyRef.current.size);
                setBursts(prev => [...prev, { id: `${draggableId}_${Date.now()}`, x: cx, y: cy }]);
                soundCorrect();
            } else {
                // Bounce spectaculos: impuls in directie aleatorie + rotatie
                const angle = Math.random() * Math.PI * 2;
                const force = 0.03;
                Matter.Body.applyForce(body, body.position, {
                    x: Math.cos(angle) * force,
                    y: Math.sin(angle) * force - 0.02,
                });
                Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.4);
                soundWrong();
            }
        } catch (err) {
            console.error('Eroare la verificarea plasarii:', err);
        }
    };

    const removeBurst = (id) => setBursts(prev => prev.filter(b => b.id !== id));

    const buildCurrentMapping = () => {
        const mapping = {};
        Object.entries(bodiesRef.current).forEach(([id, body]) => {
            let nearestTargetId = null;
            let nearestDist = Infinity;
            targetElements.forEach(t => {
                const cx = t.x + t.width / 2;
                const cy = t.y + t.height / 2;
                const dist = Math.hypot(body.position.x - cx, body.position.y - cy);
                if (dist < nearestDist) { nearestDist = dist; nearestTargetId = t.id; }
            });
            if (nearestTargetId && nearestDist <= SNAP_RADIUS) {
                mapping[id] = nearestTargetId;
            }
        });
        return mapping;
    };

    const handleFinish = async () => {
        setPhase('submitting');
        setSubmitError('');
        try {
            const res = await api.post('/exercises/submit', {
                exerciseId,
                answer: buildCurrentMapping(),
            });
            setResult(res.data);
            setPhase('result');
        } catch (err) {
            console.error('Eroare la trimiterea raspunsului:', err);
            setSubmitError(err.response?.data?.message || 'Eroare la trimiterea răspunsului');
            setPhase('playing');
        }
    };

    const handleRetry = () => {
        placedCorrectlyRef.current = new Set();
        setPlacedCount(0);
        setResult(null);
        setSubmitError('');
        setPhase('playing');
        Object.values(bodiesRef.current).forEach(body => {
            Matter.Body.setStatic(body, false);
        });
        draggableElements.forEach(el => {
            const body = bodiesRef.current[el.id];
            if (body) {
                Matter.Body.setPosition(body, { x: el.x + el.width / 2, y: el.y + el.height / 2 });
                Matter.Body.setVelocity(body, { x: 0, y: 0 });
                Matter.Body.setAngle(body, 0);
                Matter.Body.setAngularVelocity(body, 0);
            }
        });
    };

    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;

    const topLevelStatic = staticElements.filter(el => !el.parentId);
    const getStaticChildren = (parentId) => staticElements.filter(el => el.parentId === parentId);

    const renderStaticElement = (el) => {
        if (el.hidden) return null;

        if (el.type === ELEMENT_TYPES.TEXT) return <PlayerText key={el.id} element={el} />;
        if (el.type === ELEMENT_TYPES.IMAGE) return (
            <PlayerImage key={el.id} element={el} interactionState={undefined} onElementClick={noop} />
        );
        if (el.type === ELEMENT_TYPES.SHAPE) return (
            <PlayerShape key={el.id} element={el} interactionState={undefined} onElementClick={noop} />
        );
        if (el.type === ELEMENT_TYPES.BOX) {
            const children = getStaticChildren(el.id).map(child => renderStaticElement(child));
            return (
                <Group key={el.id} x={el.x} y={el.y} rotation={el.rotation || 0}>
                    <Rect
                        width={el.width}
                        height={el.height}
                        fill={el.bgFill !== 'transparent' ? el.bgFill : undefined}
                        stroke={el.bgStroke !== 'transparent' ? el.bgStroke : undefined}
                        strokeWidth={el.bgStrokeWidth}
                        cornerRadius={el.bgCornerRadius}
                        shadowEnabled={el.shadowEnabled}
                        shadowColor={el.shadowColor}
                        shadowBlur={el.shadowBlur}
                        shadowOpacity={el.shadowOpacity}
                        listening={false}
                    />
                    {children}
                </Group>
            );
        }
        return null;
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={onExit}>← Înapoi la quiz</button>
                <div style={styles.progress}>
                    {totalCorrect > 0 ? `${placedCount}/${totalCorrect} plasate` : ''}
                </div>
                <div style={{ width: 120 }} />
            </div>

            {config.meta?.description && (
                <p style={styles.description}>{config.meta.description}</p>
            )}

            <div ref={containerRef} style={styles.canvasContainer}>
                <div style={{ width: canvasWidth * scale, height: canvasHeight * scale }}>
                    <Stage
                        ref={stageRef}
                        width={canvasWidth * scale}
                        height={canvasHeight * scale}
                        scaleX={scale}
                        scaleY={scale}
                    >
                        <Layer ref={layerRef}>
                            <Rect
                                x={0} y={0} width={canvasWidth} height={canvasHeight}
                                fill={config.canvas.background || '#ffffff'}
                                listening={false}
                            />
                            {bgImage && (
                                <KonvaImage image={bgImage} x={0} y={0} width={canvasWidth} height={canvasHeight} listening={false} />
                            )}

                            {topLevelStatic.map(el => renderStaticElement(el))}

                            {/* Target zones — cu highlight puternic cand sunt active */}
                            {targetElements.map(target => (
                                <TargetSlot
                                    key={target.id}
                                    element={target}
                                    isActive={activeTargetId === target.id}
                                    registerRef={(node) => { targetNodeRefs.current[target.id] = node; }}
                                />
                            ))}

                            {/* Draggable — respecta forma originala */}
                            {draggableElements.map(element => (
                                <DraggableItem
                                    key={element.id}
                                    element={element}
                                    isPlaced={placedCorrectlyRef.current.has(element.id)}
                                    isHovered={hoveredId === element.id}
                                    onHover={() => setHoveredId(element.id)}
                                    onUnhover={() => setHoveredId(prev => prev === element.id ? null : prev)}
                                    registerRef={(node) => { konvaNodeRefs.current[element.id] = node; }}
                                />
                            ))}

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

            {submitError && <p style={styles.errorText}>{submitError}</p>}

            {phase !== 'result' && (
                <button style={styles.finishBtn} onClick={handleFinish} disabled={phase === 'submitting'}>
                    {phase === 'submitting' ? 'Se trimite...' : 'Am terminat'}
                </button>
            )}

            {phase === 'result' && result && (
                <div style={{ ...styles.resultPanel, borderColor: result.correct ? '#22c55e' : '#ef4444' }}>
                    <p style={styles.resultTitle}>
                        {result.correct ? '🎉 Corect!' : '❌ Nu e chiar corect'}
                    </p>
                    <p style={styles.resultDetail}>
                        Scor: {Math.round(result.score * 100)}%
                        {!result.correct && result.attemptsRemaining !== null &&
                            ` · Încercări rămase: ${result.attemptsRemaining}`}
                    </p>
                    {result.correct && config.settings?.explanation && (
                        <p style={styles.explanationText}>{config.settings.explanation}</p>
                    )}
                    <div style={styles.resultActions}>
                        {!result.correct && !attemptsExhausted && (
                            <button style={styles.retryBtn} onClick={handleRetry}>Încearcă din nou</button>
                        )}
                        <button style={styles.quizBtn} onClick={onExit}>Înapoi la quiz</button>
                    </div>
                    {attemptsExhausted && (
                        <p style={styles.exhaustedText}>Ai epuizat numărul de încercări.</p>
                    )}
                </div>
            )}
        </div>
    );
}

function TargetSlot({ element, isActive, registerRef }) {
    const commonShape = {
        fill: isActive ? '#dbeafe' : '#f9fafb',
        stroke: isActive ? '#4F6BF6' : '#d1d5db',
        strokeWidth: isActive ? 4 : 2,
        dash: isActive ? undefined : [10, 6],
        shadowEnabled: isActive,
        shadowColor: '#4F6BF6',
        shadowBlur: isActive ? 25 : 0,
        shadowOpacity: 0.5,
        listening: false,
    };

    return (
        <Group
            ref={registerRef}
            x={element.x + element.width / 2}
            y={element.y + element.height / 2}
            offsetX={element.width / 2}
            offsetY={element.height / 2}
        >
            {element.shapeType === 'circle' && (
                <Circle
                    {...commonShape}
                    x={element.width / 2}
                    y={element.height / 2}
                    radius={Math.min(element.width, element.height) / 2}
                />
            )}
            {element.shapeType === 'polygon' && (
                <RegularPolygon
                    {...commonShape}
                    x={element.width / 2}
                    y={element.height / 2}
                    sides={6}
                    radius={Math.min(element.width, element.height) / 2}
                />
            )}
            {(!element.shapeType || element.shapeType === 'rect') && (
                <Rect
                    {...commonShape}
                    width={element.width}
                    height={element.height}
                    cornerRadius={element.cornerRadius || 12}
                />
            )}
        </Group>
    );
}

function DraggableItem({ element, isPlaced, isHovered, onHover, onUnhover, registerRef }) {
    const [image] = useImage(element.type === ELEMENT_TYPES.IMAGE ? (element.src || '') : '', 'anonymous');
    const hoverScale = isHovered && !isPlaced ? 1.06 : 1;

    const groupProps = {
        ref: registerRef,
        x: element.x + element.width / 2,
        y: element.y + element.height / 2,
        offsetX: element.width / 2,
        offsetY: element.height / 2,
        scaleX: hoverScale,
        scaleY: hoverScale,
        onMouseEnter: (e) => {
            e.target.getStage().container().style.cursor = isPlaced ? 'default' : 'grab';
            if (!isPlaced) onHover();
        },
        onMouseLeave: (e) => {
            e.target.getStage().container().style.cursor = 'default';
            onUnhover();
        },
        onMouseDown: (e) => {
            e.target.getStage().container().style.cursor = 'grabbing';
        },
        onMouseUp: (e) => {
            e.target.getStage().container().style.cursor = 'grab';
        },
    };

    const shadowProps = {
        shadowEnabled: true,
        shadowColor: '#000000',
        shadowBlur: isHovered && !isPlaced ? 18 : 10,
        shadowOpacity: isHovered && !isPlaced ? 0.35 : 0.2,
        shadowOffsetY: isHovered && !isPlaced ? 6 : 3,
    };

    if (element.type === ELEMENT_TYPES.IMAGE) {
        return (
            <Group {...groupProps}>
                <Rect
                    width={element.width}
                    height={element.height}
                    fill={image ? undefined : '#e5e7eb'}
                    cornerRadius={element.cornerRadius || 12}
                    {...shadowProps}
                />
                {image && (
                    <KonvaImage
                        image={image}
                        width={element.width}
                        height={element.height}
                        cornerRadius={element.cornerRadius || 12}
                    />
                )}
                {isPlaced && (
                    <Text
                        text="✓"
                        width={element.width}
                        height={element.height}
                        align="center"
                        verticalAlign="middle"
                        fontSize={element.width * 0.4}
                        fontStyle="bold"
                        fill="#16a34a"
                    />
                )}
            </Group>
        );
    }

    // SHAPE — respecta shapeType
    const shapeCommonProps = {
        fill: element.fill || '#4F6BF6',
        stroke: element.stroke || '#1a1d23',
        strokeWidth: element.strokeWidth || 2,
        ...shadowProps,
    };

    return (
        <Group {...groupProps}>
            {element.shapeType === 'circle' && (
                <Circle
                    {...shapeCommonProps}
                    x={element.width / 2}
                    y={element.height / 2}
                    radius={Math.min(element.width, element.height) / 2}
                />
            )}
            {element.shapeType === 'polygon' && (
                <RegularPolygon
                    {...shapeCommonProps}
                    x={element.width / 2}
                    y={element.height / 2}
                    sides={6}
                    radius={Math.min(element.width, element.height) / 2}
                />
            )}
            {element.shapeType === 'line' && (
                <Line
                    {...shapeCommonProps}
                    points={[0, element.height / 2, element.width, element.height / 2]}
                    fill={undefined}
                    stroke={element.fill || '#4F6BF6'}
                    strokeWidth={Math.max(element.strokeWidth || 4, 4)}
                />
            )}
            {(!element.shapeType || element.shapeType === 'rect') && (
                <Rect
                    {...shapeCommonProps}
                    width={element.width}
                    height={element.height}
                    cornerRadius={element.cornerRadius || 12}
                />
            )}
            {isPlaced && (
                <Text
                    text="✓"
                    width={element.width}
                    height={element.height}
                    align="center"
                    verticalAlign="middle"
                    fontSize={Math.min(element.width, element.height) * 0.4}
                    fontStyle="bold"
                    fill="#16a34a"
                />
            )}
        </Group>
    );
}

const styles = {
    page: {
        minHeight: '100vh', background: '#f0f2f5', display: 'flex',
        flexDirection: 'column', alignItems: 'center', paddingBottom: 32,
    },
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
    errorText: { color: '#dc2626', fontWeight: 700, fontSize: '0.85rem' },
    finishBtn: {
        marginTop: 12, padding: '12px 28px', background: '#4F6BF6', color: 'white',
        border: 'none', borderRadius: 12, fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
        boxShadow: '0 4px 0 #3a52c4',
    },
    resultPanel: {
        marginTop: 16, background: 'white', border: '2px solid', borderRadius: 14,
        padding: '18px 24px', textAlign: 'center', minWidth: 280, maxWidth: 460,
    },
    resultTitle: { fontSize: '1.1rem', fontWeight: 900, margin: '0 0 6px 0', color: '#1a1d23' },
    resultDetail: { fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', margin: '0 0 12px 0' },
    explanationText: {
        fontSize: '0.85rem', fontWeight: 600, color: '#374151', margin: '0 0 14px 0',
        lineHeight: 1.5, background: '#f9fafb', padding: '10px 14px', borderRadius: 10,
    },
    resultActions: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
    retryBtn: {
        padding: '9px 20px', background: '#1a1d23', color: 'white', border: 'none',
        borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
    },
    quizBtn: {
        padding: '9px 20px', background: '#4F6BF6', color: 'white', border: 'none',
        borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
    },
    exhaustedText: { fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', margin: '12px 0 0 0' },
};