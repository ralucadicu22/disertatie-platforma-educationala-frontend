import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Line, Transformer } from 'react-konva';
import { useEditor } from '../../store/editorStore.jsx';
import CanvasText from './elements/CanvasText';
import CanvasImage from './elements/CanvasImage';
import CanvasShape from './elements/CanvasShape';
import {DEFAULT_CANVAS} from "../../constants/canvas.js";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

export default function EditorCanvas() {
    const {
        elements, selectedIds, selectOne, toggleSelection, clearSelection,
        updateElement, zoom, setZoom, stageOffset, setStageOffset,
        snapEnabled, snapToGrid, GRID_SIZE,
        mode, solution,   //
    } = useEditor();

    const stageRef = useRef(null);
    const transformerRef = useRef(null);
    const containerRef = useRef(null);


    const [isSpacePressed, setIsSpacePressed] = useState(false);

    const [guides, setGuides] = useState({ vertical: [], horizontal: [] });


    useEffect(() => {
        if (!transformerRef.current || !stageRef.current) return;
        if (selectedIds.length > 0) {
            const nodes = selectedIds
                .map(id => stageRef.current.findOne(`#${id}`))
                .filter(Boolean);
            transformerRef.current.nodes(nodes);
            transformerRef.current.getLayer().batchDraw();
        } else {
            transformerRef.current.nodes([]);
        }
    }, [selectedIds, elements]);


    useEffect(() => {
        const onKeyDown = (e) => {
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (e.key === ' ' && !isSpacePressed) {
                e.preventDefault();
                setIsSpacePressed(true);
            }
        };
        const onKeyUp = (e) => {
            if (e.key === ' ') setIsSpacePressed(false);
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [isSpacePressed]);

    const handleWheel = (e) => {
        if (!e.evt.ctrlKey && !e.evt.metaKey) return;
        e.evt.preventDefault();
        const stage = stageRef.current;
        const pointer = stage.getPointerPosition();
        const oldScale = stage.scaleX();
        const scaleBy = 1.1;
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale = Math.max(0.25, Math.min(4, newScale));

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };
        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        };
        setZoom(clampedScale);
        setStageOffset(newPos);
    };


    const handleStageMouseDown = (e) => {
        // Dacă apesi spacebar, nu deselect — vrei să pan
        if (isSpacePressed) return;
        // Click direct pe stage (nu pe element) = deselect
        if (e.target === e.target.getStage()) {
            clearSelection();
        }
    };


    const handleStageDragEnd = (e) => {
        if (isSpacePressed) {
            setStageOffset({ x: e.target.x(), y: e.target.y() });
        }
    };


    const handleElementSelect = (id, evt) => {
        if (evt?.evt?.shiftKey) {
            toggleSelection(id);
        } else {

            if (selectedIds.includes(id) && selectedIds.length > 1) return;
            selectOne(id);
        }
    };


    const computeGuides = (draggedId, draggedX, draggedY, draggedW, draggedH) => {
        const others = elements.filter(e => e.id !== draggedId && !selectedIds.includes(e.id));
        const vertical = [];
        const horizontal = [];
        const threshold = 5; // pixeli toleranță pentru snap

        const draggedEdges = {
            left: draggedX,
            centerH: draggedX + draggedW / 2,
            right: draggedX + draggedW,
            top: draggedY,
            centerV: draggedY + draggedH / 2,
            bottom: draggedY + draggedH,
        };

        let snappedX = draggedX;
        let snappedY = draggedY;

        others.forEach(o => {
            const oEdges = {
                left: o.x,
                centerH: o.x + o.width / 2,
                right: o.x + o.width,
                top: o.y,
                centerV: o.y + o.height / 2,
                bottom: o.y + o.height,
            };

            ['left', 'centerH', 'right'].forEach(de => {
                ['left', 'centerH', 'right'].forEach(oe => {
                    if (Math.abs(draggedEdges[de] - oEdges[oe]) < threshold) {
                        vertical.push(oEdges[oe]);
                        snappedX = oEdges[oe] - (draggedEdges[de] - draggedX);
                    }
                });
            });

            ['top', 'centerV', 'bottom'].forEach(de => {
                ['top', 'centerV', 'bottom'].forEach(oe => {
                    if (Math.abs(draggedEdges[de] - oEdges[oe]) < threshold) {
                        horizontal.push(oEdges[oe]);
                        snappedY = oEdges[oe] - (draggedEdges[de] - draggedY);
                    }
                });
            });
        });

        return { vertical: [...new Set(vertical)], horizontal: [...new Set(horizontal)], snappedX, snappedY };
    };

    const handleElementDragMove = (id, e) => {
        const el = elements.find(x => x.id === id);
        if (!el) return;

        let x = e.target.x();
        let y = e.target.y();


        const g = computeGuides(id, x, y, el.width, el.height);
        setGuides({ vertical: g.vertical, horizontal: g.horizontal });

        if (g.vertical.length > 0) x = g.snappedX;
        if (g.horizontal.length > 0) y = g.snappedY;

        if (snapEnabled) {
            x = snapToGrid(x);
            y = snapToGrid(y);
        }

        e.target.x(x);
        e.target.y(y);
    };

    const handleElementDragEnd = (id, e) => {
        setGuides({ vertical: [], horizontal: [] });
        updateElement(id, { x: e.target.x(), y: e.target.y() });
    };

    return (
        <div
            ref={containerRef}
            style={{
                ...styles.canvasContainer,
                cursor: isSpacePressed ? 'grab' : 'default',
            }}
        >
            <div style={styles.canvasWrapper}>
                <Stage
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    ref={stageRef}
                    scaleX={zoom}
                    scaleY={zoom}
                    x={stageOffset.x}
                    y={stageOffset.y}
                    draggable={isSpacePressed}
                    onMouseDown={handleStageMouseDown}
                    onTouchStart={handleStageMouseDown}
                    onWheel={handleWheel}
                    onDragEnd={handleStageDragEnd}
                >
                    <Layer>
                        <Rect
                            x={0} y={0}
                            width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
                            fill="white"
                            listening={false}
                        />

                        {snapEnabled && mode !== 'preview' && <GridLines width={DEFAULT_CANVAS.width} height={DEFAULT_CANVAS.height} step={GRID_SIZE} />}

                        {elements.map(el => {
                            if (el.hidden) return null;

                            const isPreview = mode === 'preview';
                            const isMarkedCorrect = mode === 'solution' && solution.correctElementIds.includes(el.id);

                            const common = {
                                element: el,
                                isSelected: isPreview ? false : selectedIds.includes(el.id),
                                onSelect: isPreview ? () => {} : (evt) => {
                                    if (el.locked) return;
                                    handleElementSelect(el.id, evt);
                                },
                                onChange: isPreview ? () => {} : (updates) => {
                                    if (el.locked) return;
                                    updateElement(el.id, updates);
                                },
                                onDragMove: isPreview ? () => {} : (e) => {
                                    if (el.locked) return;
                                    handleElementDragMove(el.id, e);
                                },
                                onDragEnd: isPreview ? () => {} : (e) => {
                                    if (el.locked) return;
                                    handleElementDragEnd(el.id, e);
                                },
                                isLocked: isPreview ? true : el.locked,
                            };

                            let elementNode = null;
                            if (el.type === 'TEXT') elementNode = <CanvasText key={el.id} {...common} />;
                            if (el.type === 'IMAGE') elementNode = <CanvasImage key={el.id} {...common} />;
                            if (el.type === 'SHAPE') elementNode = <CanvasShape key={el.id} {...common} />;

                            if (!elementNode) return null;

                            if (isMarkedCorrect) {
                                return (
                                    <React.Fragment key={el.id}>
                                        {elementNode}
                                        <Rect
                                            x={el.x - 4}
                                            y={el.y - 4}
                                            width={el.width + 8}
                                            height={el.height + 8}
                                            stroke="#059669"
                                            strokeWidth={3}
                                            dash={[8, 4]}
                                            cornerRadius={6}
                                            listening={false}
                                        />
                                    </React.Fragment>
                                );
                            }

                            return elementNode;
                        })}

                        {mode !== 'preview' && guides.vertical.map((x, i) => (
                            <Line key={`v-${i}`} points={[x, 0, x, CANVAS_HEIGHT]}
                                  stroke="#FF4B4B" strokeWidth={1} dash={[4, 4]} listening={false} />
                        ))}
                        {mode !== 'preview' && guides.horizontal.map((y, i) => (
                            <Line key={`h-${i}`} points={[0, y, CANVAS_WIDTH, y]}
                                  stroke="#FF4B4B" strokeWidth={1} dash={[4, 4]} listening={false} />
                        ))}

                        {mode !== 'preview' && (
                            <Transformer
                                ref={transformerRef}
                                boundBoxFunc={(oldBox, newBox) => {
                                    if (newBox.width < 20 || newBox.height < 20) return oldBox;
                                    return newBox;
                                }}
                            />
                        )}

                    </Layer>
                </Stage>
            </div>

            {/* Zoom indicator + reset */}
            <ZoomIndicator zoom={zoom} onReset={() => { setZoom(1); setStageOffset({ x: 0, y: 0 }); }} />
        </div>
    );
}

function GridLines({ width, height, step }) {
    const lines = [];
    for (let i = 0; i <= width; i += step) {
        lines.push(<Line key={`v${i}`} points={[i, 0, i, height]} stroke="#f0f0f0" strokeWidth={1} listening={false} />);
    }
    for (let j = 0; j <= height; j += step) {
        lines.push(<Line key={`h${j}`} points={[0, j, width, j]} stroke="#f0f0f0" strokeWidth={1} listening={false} />);
    }
    return <>{lines}</>;
}

function ZoomIndicator({ zoom, onReset }) {
    return (
        <div style={styles.zoomIndicator}>
            <span style={styles.zoomText}>{Math.round(zoom * 100)}%</span>
            <button onClick={onReset} style={styles.zoomReset} title="Reset (100%)">⟲</button>
        </div>
    );
}

const styles = {
    canvasContainer: {
        flex: 1,
        overflow: 'auto',
        background: '#f0f2f5',
        padding: 30,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        position: 'relative',
    },
    canvasWrapper: {
        boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
        borderRadius: 8,
        overflow: 'hidden',
    },
    zoomIndicator: {
        position: 'fixed',
        bottom: 310,
        right: 30,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 5,
    },
    zoomText: {
        fontSize: '0.85rem',
        fontWeight: 800,
        color: '#1a1d23',
        minWidth: 38,
        textAlign: 'center',
    },
    zoomReset: {
        background: '#f3f4f6',
        border: 'none',
        borderRadius: 6,
        padding: '4px 8px',
        fontSize: '0.95rem',
        cursor: 'pointer',
        color: '#1a1d23',
        lineHeight: 1,
    },
};