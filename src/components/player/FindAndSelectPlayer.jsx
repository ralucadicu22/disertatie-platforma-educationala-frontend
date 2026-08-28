import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Group } from 'react-konva';
import useImage from 'use-image';
import { apiWithOverride as api } from '../../api/axios';
import PlayerText from './PlayerText';
import PlayerImage from './PlayerImage';
import PlayerShape from './PlayerShape';
import PlayerVideo from './PlayerVideo';
import ParticleBurst from './ParticleBurst';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import PlayerPdf from "./PlayerPDF.jsx";
import {getAbsolutePosition} from "../../utils/elementPosition.js";

const CONTAINER_PADDING = 40;
const HINT_AFTER_MISTAKES = 2;

export default function FindAndSelectPlayer({ exerciseId, config, onExit }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);

    const [bgImage] = useImage(config.canvas.backgroundImage || '', 'anonymous');

    const feedbackType = config.settings?.feedbackType || 'instant';
    const behaviorOnFail = config.settings?.behaviorOnFail || 'retry';
    const isInstant = feedbackType === 'instant';

    const [foundIds, setFoundIds] = useState(() => new Set());
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [shakingId, setShakingId] = useState(null);
    const [bursts, setBursts] = useState([]);
    const [checkingId, setCheckingId] = useState(null);
    const [mistakeCount, setMistakeCount] = useState(0);
    const [hintVisible, setHintVisible] = useState(false);
    const [showSolutionRequested, setShowSolutionRequested] = useState(false);
    const [phase, setPhase] = useState('playing');
    const [result, setResult] = useState(null);
    const [submitError, setSubmitError] = useState('');

    const canvasWidth = config.canvas.width;
    const canvasHeight = config.canvas.height;

    const totalCorrect = useMemo(
        () => config.solution?.correctCount ?? 0,
        [config.solution]
    );

    const hintText = config.settings?.hint;

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

    const shakeTimeoutRef = useRef(null);

    const handleInstantClick = async (element) => {
        if (foundIds.has(element.id)) return;
        if (checkingId) return;

        setCheckingId(element.id);
        try {
            const res = await api.post('/exercises/check-element', {
                exerciseId,
                elementId: element.id,
            });

            if (res.data.correct) {
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

                setMistakeCount(prev => {
                    const next = prev + 1;
                    if (next >= HINT_AFTER_MISTAKES && hintText) setHintVisible(true);
                    return next;
                });
            }
        } catch (err) {
            console.error('Eroare la verificarea elementului:', err);
        } finally {
            setCheckingId(null);
        }
    };

    const handleFinalClick = (element) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(element.id)) next.delete(element.id);
            else next.add(element.id);
            return next;
        });
    };

    const handleElementClick = (element) => {
        if (phase !== 'playing') return;
        if (isInstant) handleInstantClick(element);
        else handleFinalClick(element);
    };

    const removeBurst = (id) => {
        setBursts(prev => prev.filter(b => b.id !== id));
    };

    const handleFinish = async () => {
        setPhase('submitting');
        setSubmitError('');
        const answer = Array.from(isInstant ? foundIds : selectedIds);
        try {
            const res = await api.post('/exercises/submit', { exerciseId, answer });
            setResult(res.data);
            setPhase('result');
            if (!res.data.correct && hintText) setHintVisible(true);
        } catch (err) {
            console.error('Eroare la trimiterea raspunsului:', err);
            setSubmitError(err.response?.data?.message || 'Eroare la trimiterea răspunsului');
            setPhase('playing');
        }
    };

    const handleRetry = () => {
        setFoundIds(new Set());
        setSelectedIds(new Set());
        setResult(null);
        setSubmitError('');
        setShowSolutionRequested(false);
        setPhase('playing');
    };

    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;

    const getInteractionState = (elementId) => {
        if (phase === 'result' && result) {
            const details = result.details || {};
            const correctlySelected = new Set(details.correctlySelectedIds || []);
            const incorrectlySelected = new Set(details.incorrectlySelectedIds || []);
            const allCorrect = new Set(details.correctElementIds || []);

            if (correctlySelected.has(elementId)) return 'correct';
            if (incorrectlySelected.has(elementId)) return 'incorrect';
            if (showSolutionRequested && allCorrect.has(elementId)) return 'missed';
            return undefined;
        }

        if (isInstant) {
            if (foundIds.has(elementId)) return 'found';
            if (shakingId === elementId) return 'shake';
            return undefined;
        }

        return selectedIds.has(elementId) ? 'selected' : undefined;
    };


    const topLevelElements = config.elements.filter(el => !el.parentId);
    const getChildren = (parentId) => config.elements.filter(el => el.parentId === parentId);

    const renderElement = (element) => {
        if (element.hidden) return null;

        const interactionState = getInteractionState(element.id);

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

            case ELEMENT_TYPES.VIDEO:
                return <PlayerVideo key={element.id} element={element} />;

            case ELEMENT_TYPES.BOX: {
                const children = getChildren(element.id).map(child => renderElement(child));
                return (
                    <Group key={element.id} x={element.x} y={element.y} rotation={element.rotation || 0}>
                        <Rect
                            width={element.width}
                            height={element.height}
                            fill={element.bgFill !== 'transparent' ? element.bgFill : undefined}
                            stroke={element.bgStroke !== 'transparent' ? element.bgStroke : undefined}
                            strokeWidth={element.bgStrokeWidth}
                            cornerRadius={element.bgCornerRadius}
                            shadowEnabled={element.shadowEnabled}
                            shadowColor={element.shadowColor}
                            shadowBlur={element.shadowBlur}
                            shadowOpacity={element.shadowOpacity}
                            listening={false}
                        />
                        {children}
                    </Group>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={onExit}>← Înapoi la quiz</button>
                <div style={styles.progress}>
                    {isInstant && totalCorrect > 0 ? `${foundIds.size}/${totalCorrect} găsite` : ''}
                    {!isInstant && phase === 'playing' ? `${selectedIds.size} selectate` : ''}
                </div>
                <div style={{ width: 120 }} />
            </div>

            {config.meta?.description && (
                <p style={styles.description}>{config.meta.description}</p>
            )}

            {!isInstant && phase === 'playing' && (
                <p style={styles.modeHint}>Selectează toate elementele corecte, apoi apasă „Am terminat”.</p>
            )}

            {hintVisible && hintText && (
                <div style={styles.hintBanner}>
                    <span style={styles.hintIcon}>💡</span>
                    <span style={styles.hintText}>{hintText}</span>
                </div>
            )}

            <div ref={containerRef} style={styles.canvasContainer}>
                <div style={{ width: canvasWidth * scale, height: canvasHeight * scale }}>
                    <Stage width={canvasWidth * scale} height={canvasHeight * scale} scaleX={scale} scaleY={scale}>
                        <Layer>
                            <Rect
                                x={0} y={0}
                                width={canvasWidth}
                                height={canvasHeight}
                                fill={config.canvas.background || '#ffffff'}
                                listening={false}
                            />
                            {bgImage && (
                                <KonvaImage
                                    image={bgImage}
                                    x={0} y={0}
                                    width={canvasWidth}
                                    height={canvasHeight}
                                    listening={false}
                                />
                            )}
                            {topLevelElements.map(el => renderElement(el))}
                            {isInstant && bursts.map(burst => (
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
                {config.elements
                    .filter(el => el.type === ELEMENT_TYPES.PDF && !el.hidden)
                    .map(el => {
                        const abs = getAbsolutePosition(el, config.elements);
                        return (
                            <PlayerPdf
                                key={el.id}
                                element={{ ...el, x: abs.x * scale, y: abs.y * scale }}
                            />
                        );
                    })}
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
                        {!result.correct && behaviorOnFail === 'showSolution' && !showSolutionRequested && (
                            <button style={styles.solutionBtn} onClick={() => setShowSolutionRequested(true)}>
                                Arată soluția
                            </button>
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
    modeHint: {
        fontSize: '0.8rem', color: '#4F6BF6', fontWeight: 700, margin: '8px 20px 0',
    },
    hintBanner: {
        display: 'flex', alignItems: 'center', gap: 10, marginTop: 14,
        background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12,
        padding: '10px 18px', maxWidth: 560,
    },
    hintIcon: { fontSize: '1.2rem' },
    hintText: { fontSize: '0.88rem', fontWeight: 700, color: '#92400e' },
    canvasContainer: {
        width: '100%', maxWidth: 1240, display: 'flex', justifyContent: 'center',
        padding: '20px', boxSizing: 'border-box',
        position:'relative'
    },
    errorText: { color: '#dc2626', fontWeight: 700, fontSize: '0.85rem' },
    finishBtn: {
        marginTop: 12, padding: '12px 28px', background: '#4F6BF6', color: 'white',
        border: 'none', borderRadius: 12, fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
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
    solutionBtn: {
        padding: '9px 20px', background: '#f59e0b', color: 'white', border: 'none',
        borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
    },
    quizBtn: {
        padding: '9px 20px', background: '#4F6BF6', color: 'white', border: 'none',
        borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
    },
    exhaustedText: { fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', margin: '12px 0 0 0' },
};