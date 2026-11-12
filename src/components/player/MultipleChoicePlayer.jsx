import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Group } from 'react-konva';
import { apiWithOverride as api } from '../../api/axios';
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
const OPTION_COLORS = {
    default: { fill: '#f8fafc', stroke: '#e2e8f0' },
    hover: { fill: '#eff6ff', stroke: '#93c5fd' },
    selected: { fill: '#dbeafe', stroke: '#3b82f6' },
    correct: { fill: '#dcfce7', stroke: '#22c55e' },
    wrong: { fill: '#fee2e2', stroke: '#ef4444' },
};
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function MultipleChoicePlayer({ exerciseId, config, onExit, isPreview = false }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [selectedOption, setSelectedOption] = useState(null);
    const [hoveredOption, setHoveredOption] = useState(null);
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

    const allElements = config.elements || [];
    const correctElementIds = config.solution?.correctElementIds || [];
    const isSubmitted = phase === 'submitted' || phase === 'correct' || phase === 'wrong';

    const optionElements = allElements.filter(el =>
        el.role === 'choice-option' && el.parentId
    );

    useEffect(() => {
        const hints = (config.settings?.hints || []).filter(h => h.text);
        setHintsAvailable(hints);
    }, [config.settings?.hints]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            const available = entry.contentRect.width - CONTAINER_PADDING * 2;
            setScale(Math.min(1, available / canvasWidth));
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [canvasWidth]);

    const handleOptionClick = (optionEl) => {
        if (isSubmitted) return;
        if (config.settings?.feedbackType === 'instant') {
            const isCorrect = correctElementIds.includes(optionEl.id);
            setSelectedOption(optionEl.id);
            setPhase(isCorrect ? 'correct' : 'wrong');
            setResult({ correct: isCorrect, score: isCorrect ? 100 : 0 });
            if (!isCorrect && config.settings?.behaviorOnFail === 'showHints' && hintsAvailable.length > 0) {
                showNextHint();
            }
            if (config.settings?.behaviorOnFail === 'showSolution' && !isCorrect) {
                setShowSolutionPanel(true);
            }
        } else {
            setSelectedOption(optionEl.id);
        }
    };

    const showNextHint = () => {
        const hint = hintsAvailable[hintsUsed];
        if (!hint) return;
        setCurrentHint(hint);
        setHintsUsed(prev => prev + 1);
        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = setTimeout(() => setCurrentHint(null), 5000);
    };

    const handleSubmit = async () => {
        if (!selectedOption || isSubmitted) return;
        if (isPreview) {
            const isCorrect = correctElementIds.includes(selectedOption);
            setResult({ correct: isCorrect, score: isCorrect ? 100 : 0, newBadges: [] });
            setPhase(isCorrect ? 'correct' : 'wrong');
            if (!isCorrect && config.settings?.behaviorOnFail === 'showSolution') setShowSolutionPanel(true);
            if (!isCorrect && config.settings?.behaviorOnFail === 'showHints' && hintsAvailable.length > 0) showNextHint();
            return;
        }
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
            const res = await api.post(`/exercises/${exerciseId}/submit`, {
                answer: { selectedElementId: selectedOption },
                timeSpent: elapsed,
                hintsUsed,
            });
            const data = res.data;
            setResult(data);
            setPhase(data.correct ? 'correct' : 'wrong');
            setNewBadges(data.newBadges || []);
            setShowFeedback(true);
            if (data.behaviorOnFail === 'showSolution' && !data.correct) setShowSolutionPanel(true);
            if (data.behaviorOnFail === 'showHints' && !data.correct && hintsAvailable.length > 0) showNextHint();
        } catch {
            setSubmitError('Eroare la trimitere. Încearcă din nou.');
        }
    };

    const handleRetry = () => {
        setSelectedOption(null);
        setPhase('playing');
        setResult(null);
        setSubmitError('');
        setShowSolutionPanel(false);
        startTimeRef.current = Date.now();
    };

    const getOptionState = (optionEl) => {
        if (!isSubmitted) {
            if (selectedOption === optionEl.id) return 'selected';
            if (hoveredOption === optionEl.id) return 'hover';
            return 'default';
        }
        if (correctElementIds.includes(optionEl.id)) return 'correct';
        if (selectedOption === optionEl.id) return 'wrong';
        return 'default';
    };

    const getChildren = (parentId) => allElements.filter(el => el.parentId === parentId && !el.isPlaceholder);
    const getAllChildren = (parentId) => allElements.filter(el => el.parentId === parentId);

    const renderChildElement = (el) => {
        const props = { key: el.id, element: el, isSelected: false, isPreview: true };
        switch (el.type) {
            case ELEMENT_TYPES.TEXT: return <PlayerText {...props} />;
            case ELEMENT_TYPES.IMAGE: return <PlayerImage {...props} />;
            case ELEMENT_TYPES.SHAPE: return <PlayerShape {...props} />;
            default: return null;
        }
    };

    const nonOptionElements = allElements.filter(el =>
        el.role !== 'choice-option' && !el.parentId
    );

    const renderNonOption = (el) => {
        if (el.hidden) return null;
        const props = { key: el.id, element: el, isSelected: false, isPreview: true };
        if (el.type === ELEMENT_TYPES.BOX) {
            const children = getAllChildren(el.id);
            return (
                <Group key={el.id} x={el.x} y={el.y} rotation={el.rotation || 0}>
                    <Rect
                        width={el.width}
                        height={el.height}
                        fill={el.bgFill && el.bgFill !== 'transparent' ? el.bgFill : undefined}
                        stroke={el.bgStroke && el.bgStroke !== 'transparent' ? el.bgStroke : undefined}
                        strokeWidth={el.bgStrokeWidth || 0}
                        cornerRadius={el.bgCornerRadius || 0}
                        listening={false}
                    />
                    {children.map(child => renderChildElement(child))}
                </Group>
            );
        }
        switch (el.type) {
            case ELEMENT_TYPES.TEXT: return <PlayerText {...props} />;
            case ELEMENT_TYPES.IMAGE: return <PlayerImage {...props} />;
            case ELEMENT_TYPES.SHAPE: return <PlayerShape {...props} />;
            case ELEMENT_TYPES.HOTSPOT: return <PlayerHotspot {...props} onClick={() => {}} />;
            default: return null;
        }
    };

    const canSubmit = selectedOption && !isSubmitted;

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

    const renderOptions = () => {
        return optionElements.map((optEl) => {
            const state = getOptionState(optEl);
            const colors = OPTION_COLORS[state];
            const children = getChildren(optEl.id);
            const absPos = getAbsolutePos(optEl);

            return (
                <Group
                    key={optEl.id}
                    x={absPos.x}
                    y={absPos.y}
                    onClick={() => handleOptionClick(optEl)}
                    onTap={() => handleOptionClick(optEl)}
                    onMouseEnter={() => !isSubmitted && setHoveredOption(optEl.id)}
                    onMouseLeave={() => setHoveredOption(null)}
                >
                    <Rect
                        width={optEl.width || 200}
                        height={optEl.height || 60}
                        fill={colors.fill}
                        stroke={colors.stroke}
                        strokeWidth={state === 'default' ? 1.5 : 2.5}
                        cornerRadius={optEl.bgCornerRadius ?? 10}
                        shadowColor={state !== 'default' ? colors.stroke : 'transparent'}
                        shadowBlur={state !== 'default' ? 8 : 0}
                        shadowOpacity={0.3}
                    />
                    {children.map(child => renderChildElement(child))}
                </Group>
            );
        });
    };

    return (
        <ThemeProvider theme={theme}>
            <div ref={containerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: CONTAINER_PADDING, boxSizing: 'border-box', userSelect: 'none' }}>
                {currentHint && (
                    <div style={{ marginBottom: 16, background: '#fefce8', border: '1.5px solid #fde047', borderRadius: 10, padding: '10px 16px', fontSize: '0.9rem', color: '#713f12', maxWidth: canvasWidth * scale, width: '100%', boxSizing: 'border-box' }}>
                        💡 {currentHint.text}
                    </div>
                )}

                <Stage width={canvasWidth * scale} height={canvasHeight * scale} scaleX={scale} scaleY={scale} style={{ cursor: isSubmitted ? 'default' : 'pointer' }}>
                    <Layer>
                        {bgImage && (
                            <Rect width={canvasWidth} height={canvasHeight} fillPatternImage={bgImage} fillPatternRepeat="repeat" />
                        )}
                        {nonOptionElements.map(renderNonOption)}
                        {renderOptions()}
                    </Layer>
                </Stage>

                {showSolutionPanel && (
                    <div style={{ marginTop: 16, background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '14px 18px', maxWidth: canvasWidth * scale, width: '100%', boxSizing: 'border-box' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#15803d' }}>
                            ✓ Răspunsul corect: {optionElements.filter(o => correctElementIds.includes(o.id)).map((o, i) => o.label || OPTION_LABELS[i]).join(', ')}
                        </p>
                        {config.settings?.explanation && (
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: '#166534' }}>{config.settings.explanation}</p>
                        )}
                    </div>
                )}

                <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {hintsAvailable.length > 0 && !isSubmitted && hintsUsed < hintsAvailable.length && (
                        <button onClick={showNextHint} style={{ background: '#fefce8', border: '1.5px solid #fde047', color: '#713f12', padding: '8px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                            💡 Hint ({hintsAvailable.length - hintsUsed} rămas{hintsAvailable.length - hintsUsed !== 1 ? 'e' : ''})
                        </button>
                    )}

                    {config.settings?.feedbackType !== 'instant' && !isSubmitted && (
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            style={{ background: canSubmit ? '#4F6BF6' : '#e5e7eb', color: canSubmit ? 'white' : '#9ca3af', border: 'none', padding: '10px 28px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
                        >
                            Verifică răspunsul
                        </button>
                    )}

                    {isSubmitted && result && (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: result.correct ? '#15803d' : '#b91c1c' }}>
                                {result.correct ? '✓ Corect!' : '✗ Incorect'}
                            </span>
                            {config.settings?.behaviorOnFail === 'retry' && !result.correct && (
                                <button onClick={handleRetry} style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#15803d', padding: '8px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                                    🔄 Încearcă din nou
                                </button>
                            )}
                        </div>
                    )}

                    {submitError && <p style={{ color: '#b91c1c', fontSize: '0.82rem', margin: 0 }}>{submitError}</p>}
                </div>

                {showFeedback && result && !isPreview && (
                    <ExerciseFeedbackWidget
                        result={result}
                        newBadges={newBadges}
                        onClose={() => setShowFeedback(false)}
                        onExit={onExit}
                        onRetry={handleRetry}
                        isPreview={isPreview}
                    />
                )}
            </div>
        </ThemeProvider>
    );
}
