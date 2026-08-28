import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Line, Transformer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { useEditor } from '../../store/editorStore.jsx';
import CanvasText from './elements/CanvasText';
import CanvasImage from './elements/CanvasImage';
import CanvasShape from './elements/CanvasShape';
import CanvasBox from './elements/CanvasBox';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import CanvasGrid from './elements/CanvasGrid';
import { getAbsolutePosition, clampChildInsideParent, getGridCellRect } from '../../utils/elementPosition';
import CanvasVideo from "./elements/CanvasVideo.jsx";
import CanvasPdf from './elements/CanvasPdf';

export default function EditorCanvas() {
    const {
        elements, selectedIds, selectOne, toggleSelection, clearSelection,
        updateElement, zoom, setZoom, stageOffset, setStageOffset,
        snapEnabled, snapToGrid, GRID_SIZE,
        mode, solution, canvas,
    } = useEditor();

    const stageRef = useRef(null);
    const transformerRef = useRef(null);
    const containerRef = useRef(null);

    const [bgImage] = useImage(canvas.backgroundImage || '', 'anonymous');

    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [guides, setGuides] = useState({ vertical: [], horizontal: [] });
    const [fitScale, setFitScale] = useState(1);
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

    const fitToContainer = (containerW, containerH) => {
        const padding = 20;
        const availableW = containerW - padding * 2;
        const availableH = containerH - padding * 2;
        if (availableW <= 0 || availableH <= 0) return null;

        const scaleW = availableW / canvas.width;
        const scaleH = availableH / canvas.height;
        const fit = Math.min(scaleW, scaleH, 1);

        return {
            scale: fit,
            offsetX: (containerW - canvas.width * fit) / 2,
            offsetY: (containerH - canvas.height * fit) / 2,
        };
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const measure = () => {
            const w = el.clientWidth;
            const h = el.clientHeight;
            if (w && h && (w !== containerSize.w || h !== containerSize.h)) {
                setContainerSize({ w, h });
            }
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [containerSize.w, containerSize.h]);

    useEffect(() => {
        if (!containerSize.w || !containerSize.h) return;
        const fit = fitToContainer(containerSize.w, containerSize.h);
        if (!fit) return;
        setFitScale(fit.scale);
        setZoom(fit.scale);
        setStageOffset({ x: fit.offsetX, y: fit.offsetY });
    }, [containerSize.w, containerSize.h, canvas.width, canvas.height]);

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
        const clampedScale = Math.max(fitScale * 0.25, Math.min(fitScale * 5, newScale));

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };
        setZoom(clampedScale);
        setStageOffset({
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        });
    };

    const zoomByStep = (direction) => {
        if (!containerSize.w || !containerSize.h) return;
        const oldScale = zoom;
        const scaleBy = 1.15;
        const newScale = direction === 'in' ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale = Math.max(fitScale * 0.25, Math.min(fitScale * 5, newScale));

        const centerX = containerSize.w / 2;
        const centerY = containerSize.h / 2;
        const stagePointCenter = {
            x: (centerX - stageOffset.x) / oldScale,
            y: (centerY - stageOffset.y) / oldScale,
        };
        setZoom(clampedScale);
        setStageOffset({
            x: centerX - stagePointCenter.x * clampedScale,
            y: centerY - stagePointCenter.y * clampedScale,
        });
    };

    const resetView = () => {
        if (!containerSize.w || !containerSize.h) return;
        const fit = fitToContainer(containerSize.w, containerSize.h);
        if (!fit) return;
        setZoom(fit.scale);
        setStageOffset({ x: fit.offsetX, y: fit.offsetY });
    };

    const handleStageMouseDown = (e) => {
        if (isSpacePressed) return;
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

    const computeGuides = (draggedId, draggedAbsX, draggedAbsY, draggedW, draggedH) => {
        const others = elements.filter(e => e.id !== draggedId && !selectedIds.includes(e.id));
        const vertical = [];
        const horizontal = [];
        const threshold = 5;

        const draggedEdges = {
            left: draggedAbsX,
            centerH: draggedAbsX + draggedW / 2,
            right: draggedAbsX + draggedW,
            top: draggedAbsY,
            centerV: draggedAbsY + draggedH / 2,
            bottom: draggedAbsY + draggedH,
        };

        let snappedAbsX = draggedAbsX;
        let snappedAbsY = draggedAbsY;

        others.forEach(o => {
            const oAbs = getAbsolutePosition(o, elements);
            const oEdges = {
                left: oAbs.x,
                centerH: oAbs.x + o.width / 2,
                right: oAbs.x + o.width,
                top: oAbs.y,
                centerV: oAbs.y + o.height / 2,
                bottom: oAbs.y + o.height,
            };

            ['left', 'centerH', 'right'].forEach(de => {
                ['left', 'centerH', 'right'].forEach(oe => {
                    if (Math.abs(draggedEdges[de] - oEdges[oe]) < threshold) {
                        vertical.push(oEdges[oe]);
                        snappedAbsX = oEdges[oe] - (draggedEdges[de] - draggedAbsX);
                    }
                });
            });

            ['top', 'centerV', 'bottom'].forEach(de => {
                ['top', 'centerV', 'bottom'].forEach(oe => {
                    if (Math.abs(draggedEdges[de] - oEdges[oe]) < threshold) {
                        horizontal.push(oEdges[oe]);
                        snappedAbsY = oEdges[oe] - (draggedEdges[de] - draggedAbsY);
                    }
                });
            });
        });

        return {
            vertical: [...new Set(vertical)],
            horizontal: [...new Set(horizontal)],
            snappedAbsX,
            snappedAbsY,
        };
    };

    const handleElementDragMove = (id, e) => {
        const el = elements.find(x => x.id === id);
        if (!el) return;
        let localX = e.target.x();
        let localY = e.target.y();

        const parent = el.parentId ? elements.find(p => p.id === el.parentId) : null;

        if (parent && parent.type === 'GRID') {

            const cellRect = getGridCellRect(parent, el.slotIndex);
            e.target.x(cellRect.x);
            e.target.y(cellRect.y);
            return;
        }

        if (parent) {
            const padding = parent.padding || 0;
            const clamped = clampChildInsideParent(localX, localY, el.width, el.height, parent, padding);
            e.target.x(clamped.x);
            e.target.y(clamped.y);
            return;
        }


        const g = computeGuides(id, localX, localY, el.width, el.height);
        setGuides({ vertical: g.vertical, horizontal: g.horizontal });

        let newAbsX = localX;
        let newAbsY = localY;
        if (g.vertical.length > 0) newAbsX = g.snappedAbsX;
        if (g.horizontal.length > 0) newAbsY = g.snappedAbsY;

        if (snapEnabled) {
            newAbsX = snapToGrid(newAbsX);
            newAbsY = snapToGrid(newAbsY);
        }

        e.target.x(newAbsX);
        e.target.y(newAbsY);
    };

    const handleElementDragEnd = (id, e) => {
        setGuides({ vertical: [], horizontal: [] });
        updateElement(id, { x: e.target.x(), y: e.target.y() });
    };

    const topLevelElements = elements.filter(el => !el.parentId);
    const getChildren = (parentId) => elements.filter(el => el.parentId === parentId);

    const renderElement = (el) => {
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
        if (el.type === ELEMENT_TYPES.TEXT) elementNode = <CanvasText key={el.id} {...common} />;
        if (el.type === ELEMENT_TYPES.IMAGE) elementNode = <CanvasImage key={el.id} {...common} />;
        if (el.type === ELEMENT_TYPES.SHAPE) elementNode = <CanvasShape key={el.id} {...common} />;
        if (el.type === ELEMENT_TYPES.BOX) {
            const children = getChildren(el.id).map(child => renderElement(child));
            elementNode = (
                <CanvasBox key={el.id} {...common}>
                    {children}
                </CanvasBox>
            );
        }
        if (el.type === ELEMENT_TYPES.GRID) {
            const gridChildren = getChildren(el.id);
            const renderedChildren = gridChildren.map(child => {

                if (child.slotIndex === undefined) return renderElement(child);
                const cellRect = getGridCellRect(el, child.slotIndex);

                const positioned = { ...child, x: cellRect.x, y: cellRect.y };
                return renderElement(positioned);
            });
            elementNode = (
                <CanvasGrid key={el.id} {...common}>
                    {renderedChildren}
                </CanvasGrid>
            );
        }
        if (el.type === ELEMENT_TYPES.VIDEO) elementNode = <CanvasVideo key={el.id} {...common} />;
        if (el.type === ELEMENT_TYPES.PDF) elementNode = <CanvasPdf key={el.id} {...common} />;
        if (!elementNode) return null;

        if (isMarkedCorrect) {
            const abs = getAbsolutePosition(el, elements);
            return (
                <React.Fragment key={el.id}>
                    {elementNode}
                    <Rect
                        x={abs.x - 4}
                        y={abs.y - 4}
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
    };

    return (
        <div
            ref={containerRef}
            style={{
                ...styles.canvasContainer,
                cursor: isSpacePressed ? 'grab' : 'default',
            }}
        >
            {containerSize.w > 0 && containerSize.h > 0 && (
                <Stage
                    width={containerSize.w}
                    height={containerSize.h}
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
                            width={canvas.width} height={canvas.height}
                            fill={canvas.background || '#ffffff'}
                            listening={false}
                            shadowColor="#000000"
                            shadowBlur={20}
                            shadowOpacity={0.1}
                            shadowOffsetY={4}
                        />

                        {bgImage && (
                            <KonvaImage
                                image={bgImage}
                                x={0} y={0}
                                width={canvas.width} height={canvas.height}
                                listening={false}
                            />
                        )}

                        {snapEnabled && mode !== 'preview' && (
                            <GridLines width={canvas.width} height={canvas.height} step={GRID_SIZE} />
                        )}

                        {topLevelElements.map(el => renderElement(el))}

                        {mode !== 'preview' && guides.vertical.map((x, i) => (
                            <Line key={`v-${i}`} points={[x, 0, x, canvas.height]}
                                  stroke="#FF4B4B" strokeWidth={1} dash={[4, 4]} listening={false} />
                        ))}
                        {mode !== 'preview' && guides.horizontal.map((y, i) => (
                            <Line key={`h-${i}`} points={[0, y, canvas.width, y]}
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
            )}

            <ZoomIndicator
                zoom={zoom}
                fitScale={fitScale}
                onReset={resetView}
                onZoomIn={() => zoomByStep('in')}
                onZoomOut={() => zoomByStep('out')}
            />

            <PanHint />
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

function ZoomIndicator({ zoom, fitScale, onReset, onZoomIn, onZoomOut }) {
    const displayPercent = fitScale > 0 ? Math.round((zoom / fitScale) * 100) : 100;

    return (
        <div style={styles.zoomIndicator}>
            <button onClick={onZoomOut} style={styles.zoomBtn} title="Zoom out">−</button>
            <span style={styles.zoomText}>{displayPercent}%</span>
            <button onClick={onZoomIn} style={styles.zoomBtn} title="Zoom in">+</button>
            <button onClick={onReset} style={styles.zoomReset} title="Fit to screen">⟲</button>
        </div>
    );
}

function PanHint() {
    return (
        <div style={styles.panHint}>
            Ține <kbd style={styles.kbd}>Space</kbd> + drag pentru a muta vizualizarea
        </div>
    );
}

const styles = {
    canvasContainer: {
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        background: '#f0f2f5',
        position: 'relative',
    },
    zoomIndicator: {
        position: 'absolute',
        bottom: 16,
        right: 16,
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
    zoomBtn: {
        background: '#f3f4f6',
        border: 'none',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: '1rem',
        cursor: 'pointer',
        color: '#1a1d23',
        lineHeight: 1,
        fontWeight: 700,
    },
    panHint: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '5px 10px',
        fontSize: '0.72rem',
        color: '#6b7280',
        fontWeight: 600,
        zIndex: 5,
    },
    kbd: {
        background: '#f3f4f6',
        border: '1px solid #d1d5db',
        borderRadius: 4,
        padding: '1px 5px',
        fontFamily: 'monospace',
        fontSize: '0.7rem',
        fontWeight: 700,
        color: '#1a1d23',
    },
};