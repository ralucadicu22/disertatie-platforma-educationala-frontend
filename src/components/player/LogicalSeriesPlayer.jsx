import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Group, Image as KonvaImage } from 'react-konva';
import api from '../../api/axios';
import PlayerText from './PlayerText';
import PlayerImage from './PlayerImage';
import PlayerShape from './PlayerShape';
import PlayerHotspot from './PlayerHotspot';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { getTheme } from '../../constants/themes.js';
import ExerciseFeedbackWidget from '../feedback/ExerciseFeedbackWidget';
import useImage from 'use-image';

const CONTAINER_PADDING = 40;

export default function LogicalSeriesPlayer({ exerciseId, config, onExit, isPreview = false }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [selectedOptionId, setSelectedOptionId] = useState(null);
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
    const startTimeRef = useRef(Date.now());
    const hintTimeoutRef = useRef(null);

    const canvasWidth = config.canvas.width;
    const canvasHeight = config.canvas.height;
    const theme = getTheme(config.meta?.themeId || 'formal');

    const correctElementId = config.solution?.correctElementId || null;
    const correctElementIds = config.solution?.correctElementIds || [];

    const allElements = config.elements || [];

    const inputZoneEl = allElements.find(el => el.role === 'input-zone');
    const choiceOptions = inputZoneEl
        ? allElements.filter(el => el.parentId === inputZoneEl.id && el.role === 'choice-option' && !el.isPlaceholder)
        : [];

    const hasChoiceOptions = choiceOptions.length > 0;

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const resize = () => {
            const availableWidth = el.clientWidth - CONTAINER_PADDING;
            const maxH = Math.floor(window.innerHeight * 0.55) - CONTAINER_PADDING;
            setScale(Math.min(1, availableWidth / canvasWidth, maxH / canvasHeight));
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

    const getCorrectId = () => {
        if (correctElementId) return correctElementId;
        if (correctElementIds.length > 0) return correctElementIds[0];
        return null;
    };

    const handleFinish = async () => {
        if (!hasChoiceOptions) return;

        if (isPreview) {
            const correct = selectedOptionId === getCorrectId();
            setResult({
                correct,
                score: correct ? 1 : 0,
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
                answer: { selectedOptionId },
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
        setSelectedOptionId(null);
        setResult(null);
        setSubmitError('');
        setPhase('playing');
        setCurrentHint(null);
        setNewBadges([]);
        setHintsUsed(0);
        setShowSolutionPanel(false);
        startTimeRef.current = Date.now();
    };

    const topLevelElements = allElements.filter(el => {
        if (el.isPlaceholder) return false;
        if (!el.parentId && el.role === 'input-zone') return false;
        return !el.parentId;
    });

    const getChildren = (parentId) => allElements.filter(el =>
        el.parentId === parentId && !el.isPlaceholder
    );

    const renderElement = (element) => {
        if (element.isPlaceholder) return null;

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
    const correctId = getCorrectId();

    const getOptionStyle = (optionId) => {
        const isSelected = selectedOptionId === optionId;
        const isDisabled = phase !== 'playing';

        if (phase === 'result' && result) {
            if (optionId === correctId) {
                return { ...styles.optionCard, ...styles.optionCorrect };
            }
            if (isSelected && optionId !== correctId) {
                return { ...styles.optionCard, ...styles.optionWrong };
            }
        }

        if (isSelected) {
            return {
                ...styles.optionCard,
                border: `2.5px solid ${theme.colors.primary}`,
                background: '#eef2ff',
                transform: 'scale(1.03)',
            };
        }

        return {
            ...styles.optionCard,
            opacity: isDisabled ? 0.7 : 1,
            cursor: isDisabled ? 'default' : 'pointer',
        };
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
                    <div style={styles.progress}>Completează seria</div>
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
                            </Layer>
                        </Stage>
                    </div>
                </div>

                {hasChoiceOptions && phase !== 'result' && (
                    <div style={styles.optionsSection}>
                        <p style={styles.optionsLabel}>Alege răspunsul corect:</p>
                        <div style={styles.optionsRow}>
                            {choiceOptions.map(option => (
                                <button
                                    key={option.id}
                                    style={getOptionStyle(option.id)}
                                    onClick={() => {
                                        if (phase !== 'playing') return;
                                        setSelectedOptionId(option.id);
                                    }}
                                    disabled={phase !== 'playing'}
                                >
                                    <OptionContent option={option} allElements={allElements} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {hasChoiceOptions && phase === 'result' && result && (
                    <div style={styles.optionsSection}>
                        <p style={styles.optionsLabel}>
                            {result.correct ? '✅ Răspuns corect!' : '❌ Răspuns greșit'}
                        </p>
                        <div style={styles.optionsRow}>
                            {choiceOptions.map(option => (
                                <div key={option.id} style={getOptionStyle(option.id)}>
                                    <OptionContent option={option} allElements={allElements} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!hasChoiceOptions && (
                    <div style={styles.noOptionsWarning}>
                        ⚠️ Adaugă variante de răspuns în zona de input (elemente cu rol <code>choice-option</code>)
                    </div>
                )}

                {currentHint && (
                    <div style={styles.hintBox}>
                        <span>💡</span>
                        <span style={styles.hintText}>{currentHint.text || 'Hint disponibil'}</span>
                    </div>
                )}

                {submitError && <p style={styles.errorText}>{submitError}</p>}

                {phase !== 'result' && hasChoiceOptions && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 12, flexShrink: 0 }}>
                        {canShowHint && (
                            <button style={{ ...styles.hintBtn, borderRadius: theme.borderRadius }} onClick={handleHint}>
                                💡 Hint ({hintsAvailable.length - hintsUsed} rămas)
                            </button>
                        )}
                        <button
                            style={{
                                ...styles.finishBtn,
                                background: selectedOptionId ? theme.colors.primary : '#9ca3af',
                                borderRadius: theme.borderRadius,
                                cursor: selectedOptionId && phase === 'playing' ? 'pointer' : 'default',
                            }}
                            onClick={handleFinish}
                            disabled={phase === 'submitting' || !selectedOptionId}
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
                        {showSolutionPanel && correctId && (
                            <div style={styles.solutionBox}>
                                <p style={styles.solutionTitle}>✅ Răspuns corect: varianta marcată cu verde</p>
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

function OptionContent({ option, allElements }) {
    const children = allElements.filter(el => el.parentId === option.id && !el.isPlaceholder);

    if (children.length === 0) {
        return (
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#374151' }}>
                {option.label || '?'}
            </span>
        );
    }

    const firstChild = children[0];

    if (firstChild.type === ELEMENT_TYPES.TEXT) {
        return (
            <span style={{
                fontSize: Math.max(12, (firstChild.fontSize || 16) * 0.7),
                fontWeight: firstChild.fontStyle?.includes('bold') ? 700 : 500,
                color: firstChild.fill || '#374151',
                fontFamily: firstChild.fontFamily || 'inherit',
            }}>
                {firstChild.text}
            </span>
        );
    }

    if (firstChild.type === ELEMENT_TYPES.SHAPE) {
        const size = Math.min(option.width, option.height, 90);
        return <MiniShape shape={firstChild} size={size} />;
    }

    if (firstChild.type === ELEMENT_TYPES.IMAGE) {
        return (
            <img
                src={firstChild.src}
                alt=""
                style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 4 }}
            />
        );
    }

    return (
        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#374151' }}>
            {option.label || '?'}
        </span>
    );
}

function MiniShape({ shape, size }) {
    const s = size || 80;
    const rawShapeType = shape.shapeType || shape.type || shape.kind;
    const normalizedShapeType = typeof rawShapeType === 'string' ? rawShapeType.toLowerCase() : rawShapeType;
    const parsedSides = Number.parseInt(shape.sides, 10);
    const sides = Number.isFinite(parsedSides) && parsedSides >= 3 ? parsedSides : null;

    const isLine = normalizedShapeType === 'line' || normalizedShapeType === 'linie';
    const fill = shape.fill || '#4F6BF6';
    const stroke = shape.stroke || (isLine ? '#1a1d23' : 'transparent');
    const strokeWidth = shape.strokeWidth != null ? shape.strokeWidth : (isLine ? 2 : 0);
    const sw = Math.max(0, strokeWidth) * 2;
    const lineSw = Math.max(2, strokeWidth * 2);

    const regularPolygon = (n) => {
        const cx = 50;
        const cy = 50;
        const radius = 45;
        const offset = -Math.PI / 2;
        return Array.from({ length: n }, (_, i) => {
            const angle = offset + (i * 2 * Math.PI) / n;
            const px = cx + radius * Math.cos(angle);
            const py = cy + radius * Math.sin(angle);
            return `${px.toFixed(2)},${py.toFixed(2)}`;
        }).join(' ');
    };

    if (normalizedShapeType === 'circle' || normalizedShapeType === 'ellipse' || normalizedShapeType === 'cerc') {
        return (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <ellipse cx="50" cy="50" rx="46" ry="46" fill={fill} stroke={stroke} strokeWidth={sw} />
            </svg>
        );
    }

    if (normalizedShapeType === 'star' || normalizedShapeType === 'stea') {
        return (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={fill} stroke={stroke} strokeWidth={sw} />
            </svg>
        );
    }

    if (normalizedShapeType === 'diamond' || normalizedShapeType === 'rhombus' || normalizedShapeType === 'romb') {
        return (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <polygon points="50,5 95,50 50,95 5,50" fill={fill} stroke={stroke} strokeWidth={sw} />
            </svg>
        );
    }

    if (isLine) {
        return (
            <svg width={s} height={Math.max(10, s / 3)} viewBox="0 0 100 30">
                <line x1="5" y1="15" x2="95" y2="15" stroke={shape.stroke || shape.fill || '#1a1d23'} strokeWidth={lineSw} strokeLinecap="round" />
            </svg>
        );
    }

    if (normalizedShapeType === 'triangle' || normalizedShapeType === 'triunghi' || sides === 3) {
        return (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <polygon points="50,8 96,92 4,92" fill={fill} stroke={stroke} strokeWidth={sw} />
            </svg>
        );
    }

    if (normalizedShapeType === 'pentagon' || sides === 5) {
        return (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <polygon points={regularPolygon(5)} fill={fill} stroke={stroke} strokeWidth={sw} />
            </svg>
        );
    }

    if (normalizedShapeType === 'hexagon' || sides === 6) {
        return (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <polygon points={regularPolygon(6)} fill={fill} stroke={stroke} strokeWidth={sw} />
            </svg>
        );
    }

    if (normalizedShapeType === 'octagon' || sides === 8) {
        return (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <polygon points={regularPolygon(8)} fill={fill} stroke={stroke} strokeWidth={sw} />
            </svg>
        );
    }

    if (normalizedShapeType === 'polygon' || normalizedShapeType === 'poligon' || sides) {
        const n = sides || 6;
        return (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <polygon points={regularPolygon(n)} fill={fill} stroke={stroke} strokeWidth={sw} />
            </svg>
        );
    }

    return (
        <svg width={s} height={s} viewBox="0 0 100 100">
            <rect x="5" y="5" width="90" height="90" rx="10" fill={fill} stroke={stroke} strokeWidth={sw} />
        </svg>
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
        flex: '0 0 auto', maxHeight: '55vh', overflow: 'hidden', display: 'flex',
        alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px 20px',
        boxSizing: 'border-box',
    },
    optionsSection: {
        flexShrink: 0, width: '100%', maxWidth: 960,
        padding: '0 20px 12px 20px', boxSizing: 'border-box',
    },
    optionsLabel: {
        fontSize: '0.88rem', fontWeight: 700, color: '#6b7280',
        margin: '0 0 12px 0', textAlign: 'center',
    },
    optionsRow: {
        display: 'flex', flexWrap: 'wrap', gap: 16,
        justifyContent: 'center', alignItems: 'stretch',
    },
    optionCard: {
        width: 160, minHeight: 120,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'white', border: '2px solid #e5e7eb',
        borderRadius: 14, padding: '16px 12px',
        cursor: 'pointer', transition: 'all 0.15s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        flexDirection: 'column', gap: 6,
    },
    optionCorrect: {
        border: '2.5px solid #22c55e',
        background: '#f0fdf4',
    },
    optionWrong: {
        border: '2.5px solid #ef4444',
        background: '#fef2f2',
    },
    noOptionsWarning: {
        flexShrink: 0, margin: '8px 20px',
        padding: '10px 16px', background: '#fff7ed',
        border: '1.5px solid #fdba74', borderRadius: 10,
        fontSize: '0.82rem', color: '#92400e', fontWeight: 600,
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
        fontWeight: 800, fontSize: '0.95rem',
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
        borderRadius: 10, padding: '12px 16px', margin: '10px 0',
    },
    solutionTitle: { fontSize: '0.82rem', fontWeight: 800, color: '#166534', margin: 0 },
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
