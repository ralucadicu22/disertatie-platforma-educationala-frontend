import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';
import api from '../../api/axios';
import PlayerText from './PlayerText';
import PlayerImage from './PlayerImage';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { getTheme } from '../../constants/themes.js';
import ExerciseFeedbackWidget from '../feedback/ExerciseFeedbackWidget';
import { getGridCellRect } from '../../utils/elementPosition';
import useImage from 'use-image';

const CONTAINER_PADDING = 40;

export default function GridBasedPlayer({ exerciseId, config, onExit, isPreview = false }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [selectedCells, setSelectedCells] = useState({});
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
    const gridElements = allElements.filter(el => el.type === ELEMENT_TYPES.GRID && el.gridMode !== 'table');

    const correctCellKeys = config.solution?.correctCellKeys || [];
    const correctSet = new Set(correctCellKeys);

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

    const toggleCell = useCallback((gridId, cellKey) => {
        if (phase !== 'playing') return;
        const fullKey = `${gridId}::${cellKey}`;
        setSelectedCells(prev => {
            const next = { ...prev };
            if (next[fullKey]) delete next[fullKey];
            else next[fullKey] = true;
            return next;
        });
    }, [phase]);

    const handleFinish = async () => {
        const answerArray = Object.keys(selectedCells);
        if (isPreview) {
            const correctSelected = answerArray.filter(k => correctSet.has(k)).length;
            const wrongSelected = answerArray.length - correctSelected;
            const missed = correctCellKeys.length - correctSelected;
            const isAllCorrect = wrongSelected === 0 && missed === 0;
            const partialScore = correctCellKeys.length > 0
                ? correctSelected / correctCellKeys.length
                : 0;
            setResult({
                correct: isAllCorrect,
                score: partialScore,
                correctSelected,
                wrongSelected,
                missed,
                totalCorrect: correctCellKeys.length,
                attemptsRemaining: null,
                newBadges: [],
            });
            setPhase('result');
            return;
        }
        setPhase('submitting');
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
            const res = await api.post('/exercises/submit', { exerciseId, answer: answerArray, durationSeconds });
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
        setSelectedCells({});
        setResult(null);
        setSubmitError('');
        setPhase('playing');
        setShowSolutionPanel(false);
        startTimeRef.current = Date.now();
    };

    const topLevelElements = allElements.filter(el => !el.parentId && el.type !== ELEMENT_TYPES.GRID);
    const renderKonvaElement = (el) => {
        if (el.hidden) return null;
        if (el.type === ELEMENT_TYPES.TEXT) return <PlayerText key={el.id} element={el} />;
        if (el.type === ELEMENT_TYPES.IMAGE) return <PlayerImage key={el.id} element={el} />;
        return null;
    };

    const getCellColor = (fullKey, isFixed) => {
        if (isFixed) return '#f3f4f6';
        if (result) {
            const isSelected = !!selectedCells[fullKey];
            const isCorrect = correctSet.has(fullKey);
            if (showSolutionPanel && isCorrect) return '#bbf7d0';
            if (isSelected && isCorrect) return '#86efac';
            if (isSelected && !isCorrect) return '#fca5a5';
            if (!isSelected && isCorrect && showSolutionPanel) return '#bbf7d0';
            return isSelected ? '#c7d2fe' : 'white';
        }
        return selectedCells[fullKey] ? '#6366f1' : 'white';
    };

    const attemptsExhausted = result && !result.correct && result.attemptsRemaining === 0;

    return (
        <ThemeProvider themeId={config.meta?.themeId}>
            <div style={{ height: '100vh', overflow: 'hidden', background: theme.colors.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: theme.font.family }}>
                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={onExit}>← Ieși</button>
                    <span style={styles.title}>{config.meta?.name || 'Grilă'}</span>
                    <div style={{ width: 80 }} />
                </div>
                {isPreview && <div style={styles.previewBanner}>🔍 PREVIZUALIZARE — răspunsurile nu se salvează</div>}
                {config.meta?.description && <p style={styles.description}>{config.meta.description}</p>}
                <div ref={containerRef} style={styles.canvasContainer}>
                    <div style={{ position: 'relative', width: canvasWidth * scale, height: canvasHeight * scale }}>
                        <Stage width={canvasWidth * scale} height={canvasHeight * scale} scaleX={scale} scaleY={scale}>
                            <Layer>
                                <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill={config.canvas.background || '#f9fafb'} listening={false} />
                                {bgImage && <KonvaImage image={bgImage} x={0} y={0} width={canvasWidth} height={canvasHeight} listening={false} />}
                                {topLevelElements.map(el => renderKonvaElement(el))}
                            </Layer>
                        </Stage>

                        {gridElements.map(grid => {
                            const rows = grid.rows || 1;
                            const cols = grid.cols || 1;
                            const cellContent = grid.cellContent || {};
                            const cellTypes = grid.cellTypes || {};
                            const cellImages = grid.cellImages || {};
                            const totalCells = rows * cols;
                            return Array.from({ length: totalCells }, (_, i) => {
                                const r = Math.floor(i / cols);
                                const c = i % cols;
                                const key = `${r}_${c}`;
                                const fullKey = `${grid.id}::${key}`;
                                const hasImage = !!cellImages[key];
                                const content = cellContent[key] || '';
                                const imgSrc = cellImages[key] || '';
                                const rect = getGridCellRect(grid, i);
                                const cellX = (grid.x + rect.x) * scale;
                                const cellY = (grid.y + rect.y) * scale;
                                const cellW = rect.width * scale;
                                const cellH = rect.height * scale;
                                const bg = getCellColor(fullKey, false);
                                const isSelected = !!selectedCells[fullKey];
                                const pad = 4 * scale;
                                return (
                                    <div
                                        key={fullKey}
                                        onClick={() => toggleCell(grid.id, key)}
                                        style={{
                                            position: 'absolute',
                                            left: cellX, top: cellY,
                                            width: cellW, height: cellH,
                                            background: bg,
                                            border: `1.5px solid ${isSelected ? '#4f46e5' : '#e5e7eb'}`,
                                            borderRadius: (grid.cellCornerRadius || 4) * scale,
                                            cursor: phase === 'playing' ? 'pointer' : 'default',
                                            boxSizing: 'border-box',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: Math.max(10, Math.min(14, cellH * 0.45)) * scale,
                                            fontWeight: 800,
                                            color: isSelected ? 'white' : '#374151',
                                            transition: 'background 0.1s',
                                            userSelect: 'none',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {hasImage ? (
                                            <img
                                                src={imgSrc}
                                                alt=""
                                                style={{
                                                    maxWidth: cellW - pad * 2,
                                                    maxHeight: cellH - pad * 2,
                                                    objectFit: 'contain',
                                                    borderRadius: (grid.cellCornerRadius || 4) * scale,
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        ) : (
                                            content
                                        )}
                                    </div>
                                );
                            });
                        })}
                    </div>
                </div>
                {submitError && <p style={styles.errorText}>{submitError}</p>}
                {phase !== 'result' && (
                    <button
                        style={{ ...styles.finishBtn, background: theme.colors.primary, borderRadius: theme.borderRadius }}
                        onClick={handleFinish}
                        disabled={phase === 'submitting'}
                    >
                        {phase === 'submitting' ? 'Se trimite...' : 'Verifică'}
                    </button>
                )}
                {phase === 'result' && result && (
                    <div style={{ ...styles.resultPanel, borderColor: result.correct ? '#22c55e' : '#ef4444', borderRadius: theme.borderRadius }}>
                        <p style={styles.resultTitle}>{result.correct ? '🎉 Corect!' : '❌ Nu e chiar corect'}</p>
                        <p style={styles.resultDetail}>Scor: {Math.round(result.score * 100)}%</p>
                        {typeof result.correctSelected === 'number' && (
                            <p style={{ ...styles.resultDetail, color: '#374151' }}>
                                {result.correctSelected} corecte · {result.wrongSelected} greșite · {result.missed} ratate (din {result.totalCorrect})
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
