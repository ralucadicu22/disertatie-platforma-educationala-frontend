import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';
import api from '../../api/axios';
import PlayerText from './PlayerText';
import PlayerShape from './PlayerShape';
import PlayerImage from './PlayerImage';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { getTheme } from '../../constants/themes.js';
import ExerciseFeedbackWidget from '../feedback/ExerciseFeedbackWidget';
import useImage from 'use-image';

const CONTAINER_PADDING = 40;

const DEFAULT_PALETTE = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#ffffff','#000000','#6b7280'];

const isColorZone = (el) => el.role === 'color-zone' || el.behavior === 'colorZone';

const isImageElement = (el) => el.type === ELEMENT_TYPES.IMAGE;

export default function ColoringPlayer({ exerciseId, config, onExit, isPreview = false }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const palette = (config.settings?.palette && config.settings.palette.length > 0)
        ? config.settings.palette
        : DEFAULT_PALETTE;
    const [selectedColor, setSelectedColor] = useState(palette[0]);
    const [colorMap, setColorMap] = useState({});
    const [phase, setPhase] = useState('playing');
    const [result, setResult] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [showSolutionPanel, setShowSolutionPanel] = useState(false);
    const [bgImage] = useImage(config.canvas.backgroundImage || '', 'anonymous');
    const startTimeRef = useRef(Date.now());

    const theme = getTheme(config.meta?.themeId || 'formal');
    const canvasWidth = config.canvas.width;
    const canvasHeight = config.canvas.height;

    const allElements = config.elements || [];
    const colorZones = allElements.filter(isColorZone);

    const coloringMode = config.settings?.coloringMode || 'perZone';
    const correctColors = config.solution?.correctColors || {};
    const requiredCount = config.solution?.coloringCount || 0;

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

    const handleZoneClick = useCallback((zoneId) => {
        if (phase !== 'playing') return;
        setColorMap(prev => {
            const next = { ...prev };
            if (next[zoneId] === selectedColor) {
                delete next[zoneId];
            } else {
                next[zoneId] = selectedColor;
            }
            return next;
        });
    }, [phase, selectedColor]);

    const computeResult = () => {
        const coloredIds = Object.keys(colorMap).filter(id => !!colorMap[id]);
        if (coloringMode === 'count') {
            const coloredCount = coloredIds.length;
            const isCorrect = coloredCount === requiredCount && requiredCount > 0;
            const score = requiredCount > 0
                ? Math.max(0, 1 - Math.abs(coloredCount - requiredCount) / Math.max(requiredCount, 1))
                : 0;
            return {
                correct: isCorrect,
                score,
                coloredCount,
                requiredCount,
                mode: 'count',
            };
        }
        const totalExpected = Object.keys(correctColors).length;
        let correctZones = 0;
        let wrongZones = 0;
        colorZones.forEach(z => {
            const expected = correctColors[z.id];
            const given = colorMap[z.id];
            if (!expected) return;
            if (given && given.toLowerCase() === expected.toLowerCase()) correctZones++;
            else if (given) wrongZones++;
        });
        const missed = totalExpected - correctZones;
        const isCorrect = wrongZones === 0 && missed === 0 && totalExpected > 0;
        const score = totalExpected > 0 ? correctZones / totalExpected : 0;
        return {
            correct: isCorrect,
            score,
            correctZones,
            wrongZones,
            missed,
            totalExpected,
            mode: 'perZone',
        };
    };

    const handleFinish = async () => {
        if (isPreview) {
            const res = computeResult();
            setResult({ ...res, attemptsRemaining: null, newBadges: [] });
            setPhase('result');
            return;
        }
        setPhase('submitting');
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
            const res = await api.post('/exercises/submit', { exerciseId, answer: colorMap, durationSeconds });
            setResult(res.data);
            if (!res.data.correct && res.data.attemptsRemaining === 0 && res.data.behaviorOnFail === 'showSolution') setShowSolutionPanel(true);
            setPhase('result');
            setShowFeedback(true);
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Eroare la trimitere');
            setPhase('playing');
        }
    };

    const handleRetry = () => {
        setColorMap({}); setResult(null); setSubmitError(''); setPhase('playing');
        setShowSolutionPanel(false); startTimeRef.current = Date.now();
    };

    const topLevelElements = allElements.filter(el => !isColorZone(el));

    const getAbsolutePos = (el) => {
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
    };

    const getAbsoluteZonePos = (zone) => getAbsolutePos(zone);

    const renderElement = (el) => {
        if (el.hidden) return null;
        if (el.type === ELEMENT_TYPES.TEXT) return <PlayerText key={el.id} element={el} />;
        if (el.type === ELEMENT_TYPES.IMAGE) return <PlayerImage key={el.id} element={el} />;
        if (el.type === ELEMENT_TYPES.SHAPE) return <PlayerShape key={el.id} element={el} />;
        return null;
    };

    const renderHtmlElement = (el) => {
        if (el.hidden || isColorZone(el)) return null;
        const pos = getAbsolutePos(el);
        if (el.type === ELEMENT_TYPES.IMAGE) {
            const src = el.src ? (el.src.startsWith('http') ? el.src : `http://localhost:8080${el.src}`) : null;
            if (!src) return null;
            return (
                <img
                    key={el.id}
                    src={src}
                    alt=""
                    style={{
                        position: 'absolute',
                        left: pos.x * scale,
                        top: pos.y * scale,
                        width: el.width * scale,
                        height: el.height * scale,
                        objectFit: el.fitMode === 'fill' ? 'cover' : el.fitMode === 'stretch' ? 'fill' : 'contain',
                        borderRadius: (el.cornerRadius || 0) * scale,
                        opacity: el.opacity ?? 1,
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                    draggable={false}
                />
            );
        }
        if (el.type === ELEMENT_TYPES.BOX) {
            return (
                <div
                    key={el.id}
                    style={{
                        position: 'absolute',
                        left: pos.x * scale,
                        top: pos.y * scale,
                        width: el.width * scale,
                        height: el.height * scale,
                        background: el.bgFill === 'transparent' ? 'transparent' : (el.bgFill || 'transparent'),
                        border: el.bgStroke && el.bgStroke !== 'transparent' ? `${(el.bgStrokeWidth || 1) * scale}px solid ${el.bgStroke}` : 'none',
                        borderRadius: (el.bgCornerRadius || 0) * scale,
                        pointerEvents: 'none',
                    }}
                />
            );
        }
        return null;
    };

    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;
    const canFinish = coloringMode === 'count'
        ? Object.keys(colorMap).length > 0
        : (colorZones.length === 0 || colorZones.every(z => colorMap[z.id]));

    const renderZoneContent = (zone) => {
        if (!isImageElement(zone)) return null;
        if (!zone.src) return null;
        const src = zone.src.startsWith('http') ? zone.src : `http://localhost:8080${zone.src}`;
        return (
            <img
                src={src}
                alt=""
                style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'contain', pointerEvents: 'none', userSelect: 'none',
                }}
                draggable={false}
            />
        );
    };

    const getZoneFeedback = (zone) => {
        if (!result || coloringMode !== 'perZone') return null;
        const expected = correctColors[zone.id];
        const given = colorMap[zone.id];
        if (!expected) return null;
        if (given && given.toLowerCase() === expected.toLowerCase()) return 'ok';
        if (given) return 'wrong';
        return 'missed';
    };

    return (
        <ThemeProvider themeId={config.meta?.themeId}>
            <div style={{ height: '100vh', overflow: 'hidden', background: theme.colors.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: theme.font.family }}>
                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={onExit}>← Ieși</button>
                    <span style={styles.title}>{config.meta?.name || 'Colorare'}</span>
                    <div style={{ width: 80 }} />
                </div>
                {isPreview && <div style={styles.previewBanner}>🔍 PREVIZUALIZARE — răspunsurile nu se salvează</div>}
                {config.meta?.description && <p style={styles.description}>{config.meta.description}</p>}

                <div style={styles.palette}>
                    {palette.map(color => (
                        <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            style={{
                                width: 32, height: 32, borderRadius: '50%',
                                border: selectedColor === color ? '3px solid #1a1d23' : '2px solid #e5e7eb',
                                background: color, cursor: 'pointer', flexShrink: 0,
                                boxShadow: selectedColor === color ? '0 0 0 2px white, 0 0 0 4px #1a1d23' : 'none',
                                transition: 'transform 0.1s',
                                transform: selectedColor === color ? 'scale(1.2)' : 'scale(1)',
                            }}
                            title={color}
                        />
                    ))}
                </div>

                <div ref={containerRef} style={styles.canvasContainer}>
                    <div style={{ position: 'relative', width: canvasWidth * scale, height: canvasHeight * scale, background: config.canvas.background || '#ffffff', overflow: 'hidden' }}>
                        {config.canvas.backgroundImage && (
                            <img src={config.canvas.backgroundImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} draggable={false} />
                        )}
                        <Stage width={canvasWidth * scale} height={canvasHeight * scale} scaleX={scale} scaleY={scale} style={{ position: 'absolute', inset: 0 }}>
                            <Layer>
                                {topLevelElements.filter(el => el.type === ELEMENT_TYPES.TEXT || el.type === ELEMENT_TYPES.SHAPE).map(el => renderElement(el))}
                            </Layer>
                        </Stage>
                        {topLevelElements.filter(el => el.type === ELEMENT_TYPES.IMAGE || el.type === ELEMENT_TYPES.BOX).map(el => renderHtmlElement(el))}

                        {colorZones.map(zone => {
                            const currentColor = colorMap[zone.id];
                            const feedback = getZoneFeedback(zone);
                            const borderColor = feedback === 'ok' ? '#22c55e'
                                : feedback === 'wrong' ? '#ef4444'
                                    : feedback === 'missed' ? '#f59e0b'
                                        : currentColor ? '#1a1d23' : 'rgba(150,150,150,0.3)';
                            const borderWidth = feedback ? 3 : currentColor ? 2 : 1;
                            const borderStyle = currentColor || feedback ? 'solid' : 'dashed';
                            const isImg = isImageElement(zone);
                            const overlayOpacity = currentColor ? (isImg ? 0.55 : 1) : 0;
                            const zonePos = getAbsoluteZonePos(zone);
                            return (
                                <div
                                    key={zone.id}
                                    onClick={() => handleZoneClick(zone.id)}
                                    style={{
                                        position: 'absolute',
                                        left: zonePos.x * scale,
                                        top: zonePos.y * scale,
                                        width: zone.width * scale,
                                        height: zone.height * scale,
                                        background: isImg ? 'transparent' : (currentColor || 'transparent'),
                                        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
                                        borderRadius: (zone.cornerRadius || zone.borderRadius || 0) * scale,
                                        cursor: phase === 'playing' ? 'pointer' : 'default',
                                        boxSizing: 'border-box',
                                        overflow: 'hidden',
                                        userSelect: 'none',
                                    }}
                                    title={zone.label || zone.id}
                                >
                                    {renderZoneContent(zone)}
                                    {isImg && currentColor && (
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: currentColor,
                                            opacity: overlayOpacity,
                                            mixBlendMode: 'multiply',
                                            pointerEvents: 'none',
                                        }} />
                                    )}
                                    {!isImg && !currentColor && zone.label && (
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11 * scale, color: '#6b7280', fontWeight: 600,
                                            pointerEvents: 'none',
                                        }}>
                                            {zone.label}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {showSolutionPanel && coloringMode === 'perZone' && (
                    <div style={styles.solutionRow}>
                        {colorZones.map(zone => (
                            <div key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 20, height: 20, borderRadius: 4, background: correctColors[zone.id] || '#ccc', border: '1px solid #e5e7eb' }} />
                                <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 600 }}>{zone.label || zone.id.substring(0, 8)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {submitError && <p style={styles.errorText}>{submitError}</p>}
                {phase !== 'result' && (
                    <button style={{ ...styles.finishBtn, background: theme.colors.primary, borderRadius: theme.borderRadius }}
                            onClick={handleFinish} disabled={phase === 'submitting' || !canFinish}>
                        {phase === 'submitting' ? 'Se trimite...' : 'Verifică'}
                    </button>
                )}
                {phase === 'result' && result && (
                    <div style={{ ...styles.resultPanel, borderColor: result.correct ? '#22c55e' : '#ef4444', borderRadius: theme.borderRadius }}>
                        <p style={styles.resultTitle}>{result.correct ? '🎉 Corect!' : '❌ Nu e chiar corect'}</p>
                        <p style={styles.resultDetail}>Scor: {Math.round(result.score * 100)}%</p>
                        {result.mode === 'perZone' && typeof result.correctZones === 'number' && (
                            <p style={{ ...styles.resultDetail, color: '#374151' }}>
                                {result.correctZones} corecte · {result.wrongZones} greșite · {result.missed} necolorate (din {result.totalExpected})
                            </p>
                        )}
                        {result.mode === 'count' && (
                            <p style={{ ...styles.resultDetail, color: '#374151' }}>
                                Ai colorat {result.coloredCount} zone (cerut: {result.requiredCount})
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
    palette: { display: 'flex', gap: 8, padding: '12px 20px', flexWrap: 'wrap', justifyContent: 'center', flexShrink: 0 },
    canvasContainer: { flex: 1, minHeight: 0, width: '100%', maxWidth: 1240, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 20px', boxSizing: 'border-box' },
    solutionRow: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', padding: '8px 20px', flexShrink: 0 },
    errorText: { color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', marginTop: 8, flexShrink: 0 },
    finishBtn: { padding: '12px 28px', color: 'white', border: 'none', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', marginTop: 8, flexShrink: 0 },
    resultPanel: { marginTop: 12, border: '2px solid', padding: '18px 24px', textAlign: 'center', minWidth: 280, maxWidth: 460, flexShrink: 0 },
    resultTitle: { fontSize: '1.1rem', fontWeight: 900, margin: '0 0 6px 0', color: '#1a1d23' },
    resultDetail: { fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', margin: '0 0 8px 0' },
    resultActions: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 },
    retryBtn: { padding: '9px 20px', background: '#1a1d23', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },
    quizBtn: { padding: '9px 20px', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },
};
