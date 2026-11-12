import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Group, Text as KonvaText, Image as KonvaImage } from 'react-konva';
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

export default function TablesChartsPlayer({ exerciseId, config, onExit, isPreview = false }) {
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
    const [bgImage] = useImage(config.canvas?.backgroundImage || '', 'anonymous');
    const startTimeRef = useRef(Date.now());
    const hintTimeoutRef = useRef(null);

    const canvasWidth = config.canvas.width;
    const canvasHeight = config.canvas.height;
    const theme = getTheme(config.meta?.themeId || 'formal');

    const correctAnswers = config.solution?.correctAnswers || {};
    const allElements = config.elements || [];

    const getAbsolutePos = (el) => {
        let x = el.x || 0;
        let y = el.y || 0;
        let current = el;
        while (current.parentId) {
            const parent = allElements.find(e => e.id === current.parentId);
            if (!parent) break;
            x += parent.x || 0;
            y += parent.y || 0;
            current = parent;
        }
        return { x, y };
    };

    const computeCellDims = (grid) => {
        const gap = grid.gap || 0;
        const totalGapW = gap * (grid.cols - 1);
        const totalGapH = gap * (grid.rows - 1);
        const cellW = (grid.width - totalGapW) / grid.cols;
        const cellH = (grid.height - totalGapH) / grid.rows;
        return { cellW, cellH, gap };
    };

    const tableGrids = allElements.filter(el =>
        el.type === ELEMENT_TYPES.GRID && el.gridMode === 'table'
    );

    const tableInputCells = tableGrids.flatMap(grid => {
        const gridAbs = getAbsolutePos(grid);
        const { cellW, cellH, gap } = computeCellDims(grid);
        const cells = [];
        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                const key = `${r}_${c}`;
                const cellType = (grid.cellTypes || {})[key] || 'static';
                if (cellType !== 'input') continue;
                cells.push({
                    id: `${grid.id}__${key}`,
                    gridId: grid.id,
                    cellKey: key,
                    x: gridAbs.x + c * (cellW + gap),
                    y: gridAbs.y + r * (cellH + gap),
                    width: cellW,
                    height: cellH,
                    inputType: (grid.cellInputTypes || {})[key] || 'text',
                });
            }
        }
        return cells;
    });

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

    const handleAnswerChange = (cellId, value) => {
        if (phase !== 'playing') return;
        setAnswers(prev => ({ ...prev, [cellId]: value }));
    };

    const handleFinish = async () => {
        if (isPreview) {
            const cellIds = Object.keys(correctAnswers);
            let correct = 0;
            const tolerance = config.settings?.tolerance || 0;
            cellIds.forEach(cellId => {
                const submitted = (answers[cellId] || '').replace(',', '.').trim().toLowerCase();
                const expected = (correctAnswers[cellId] || '').replace(',', '.').trim().toLowerCase();
                if (submitted === expected) {
                    correct++;
                } else if (tolerance > 0) {
                    const sNum = parseFloat(submitted);
                    const eNum = parseFloat(expected);
                    if (!isNaN(sNum) && !isNaN(eNum) && Math.abs(sNum - eNum) <= Math.abs(eNum) * tolerance) {
                        correct++;
                    }
                }
            });
            setResult({
                correct: correct === cellIds.length && cellIds.length > 0,
                score: cellIds.length > 0 ? correct / cellIds.length : 0,
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
        setNewBadges([]);
        setHintsUsed(0);
        setShowSolutionPanel(false);
        startTimeRef.current = Date.now();
    };

    const renderTableGrid = (grid) => {
        const { cellW, cellH, gap } = computeCellDims(grid);
        const cellContent = grid.cellContent || {};
        const cellTypes = grid.cellTypes || {};
        const padding = grid.cellPadding || 6;
        const cells = [];
        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                const key = `${r}_${c}`;
                const cx = c * (cellW + gap);
                const cy = r * (cellH + gap);
                const isInput = cellTypes[key] === 'input';
                const text = cellContent[key] || '';
                const isHeader = r === 0 || c === 0;
                cells.push(
                    <Group key={key} x={cx} y={cy}>
                        <Rect
                            width={cellW}
                            height={cellH}
                            fill={isInput ? '#eff6ff' : isHeader ? '#e0e7ff' : '#ffffff'}
                            stroke="#c7d2fe"
                            strokeWidth={1}
                            listening={false}
                        />
                        {!isInput && text !== '' && (
                            <KonvaText
                                x={padding}
                                y={cellH / 2 - 9}
                                width={cellW - padding * 2}
                                height={18}
                                text={text}
                                fontSize={13}
                                fontStyle={isHeader ? 'bold' : 'normal'}
                                fill="#1e1b4b"
                                align="center"
                                verticalAlign="middle"
                                listening={false}
                            />
                        )}
                        {isInput && (
                            <KonvaText
                                x={padding}
                                y={cellH / 2 - 8}
                                width={cellW - padding * 2}
                                height={16}
                                text="?"
                                fontSize={13}
                                fill="#818cf8"
                                align="center"
                                listening={false}
                            />
                        )}
                    </Group>
                );
            }
        }
        return (
            <Group key={grid.id} x={grid.x} y={grid.y}>
                {cells}
            </Group>
        );
    };

    const topLevelElements = allElements.filter(el => !el.parentId && el.isPlaceholder !== true);
    const getChildren = (parentId) => allElements.filter(el => el.parentId === parentId && el.isPlaceholder !== true);

    const renderElement = (element) => {
        if (element.hidden) return null;
        if (element.type === ELEMENT_TYPES.GRID && element.gridMode === 'table') {
            return renderTableGrid(element);
        }
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
                    <div style={styles.progress}>Completează tabelul</div>
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

                        {tableInputCells.map(cell => {
                            const cellId = cell.id;
                            const answered = answers[cellId] || '';
                            const isResultPhase = phase === 'result' && result;
                            const expected = correctAnswers[cellId];
                            const isCorrect = isResultPhase && answered.replace(',', '.').trim().toLowerCase() === (expected || '').replace(',', '.').trim().toLowerCase();
                            const isWrong = isResultPhase && !!expected && !isCorrect;
                            return (
                                <input
                                    key={cellId}
                                    type={cell.inputType === 'numeric' ? 'number' : 'text'}
                                    value={answered}
                                    onChange={e => handleAnswerChange(cellId, e.target.value)}
                                    disabled={phase !== 'playing'}
                                    placeholder="?"
                                    style={{
                                        position: 'absolute',
                                        left: cell.x * scale,
                                        top: cell.y * scale,
                                        width: cell.width * scale,
                                        height: cell.height * scale,
                                        fontSize: 14 * scale,
                                        fontWeight: 700,
                                        textAlign: 'center',
                                        border: `2px solid ${isCorrect ? '#22c55e' : isWrong ? '#ef4444' : '#818cf8'}`,
                                        borderRadius: 0,
                                        background: isCorrect ? '#f0fdf4' : isWrong ? '#fef2f2' : '#eff6ff',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        padding: `${2 * scale}px ${4 * scale}px`,
                                        color: isWrong ? '#ef4444' : '#1e1b4b',
                                        transition: 'border-color 0.2s, background 0.2s',
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                {currentHint && (
                    <div style={styles.hintBox}>
                        <span>💡</span>
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
                            }}
                            onClick={handleFinish}
                            disabled={phase === 'submitting'}
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
                        {showSolutionPanel && tableInputCells.length > 0 && (
                            <div style={styles.solutionBox}>
                                <p style={styles.solutionTitle}>✅ Răspunsuri corecte:</p>
                                {tableInputCells.map(cell => {
                                    const expected = correctAnswers[cell.id];
                                    if (!expected) return null;
                                    const [r, c] = cell.cellKey.split('_');
                                    const grid = tableGrids.find(g => g.id === cell.gridId);
                                    const labelRow = grid?.cellContent?.[`0_${c}`] || `Col ${parseInt(c) + 1}`;
                                    const labelCol = grid?.cellContent?.[`${r}_0`] || `Rând ${parseInt(r) + 1}`;
                                    const label = `${labelCol} / ${labelRow}`;
                                    return (
                                        <p key={cell.id} style={styles.solutionItem}>
                                            {label}: <strong>{expected}</strong>
                                        </p>
                                    );
                                })}
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
        flex: 1, overflow: 'hidden', display: 'flex',
        alignItems: 'center', justifyContent: 'center', width: '100%', padding: 20,
        boxSizing: 'border-box',
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
        fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
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
        borderRadius: 10, padding: '12px 16px', margin: '10px 0', textAlign: 'left',
    },
    solutionTitle: { fontSize: '0.82rem', fontWeight: 800, color: '#166534', margin: '0 0 6px 0' },
    solutionItem: { fontSize: '0.85rem', color: '#374151', margin: '3px 0' },
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
