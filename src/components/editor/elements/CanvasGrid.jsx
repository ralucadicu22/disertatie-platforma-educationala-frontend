import { useRef } from 'react';
import { Group, Rect, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { getGridCellRect } from '../../../utils/elementPosition';
import { useEditor } from '../../../store/editorStore.jsx';


function CellImage({ src, x, y, width, height, cornerRadius }) {
    const [img, status] = useImage(src, 'anonymous');
    if (status !== 'loaded' || !img) return <Group />;
    const imgW = img.naturalWidth || img.width || 1;
    const imgH = img.naturalHeight || img.height || 1;
    const scale = Math.min(width / imgW, height / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const offsetX = (width - drawW) / 2;
    const offsetY = (height - drawH) / 2;
    return (
        <KonvaImage
            image={img}
            x={x + offsetX}
            y={y + offsetY}
            width={drawW}
            height={drawH}
            cornerRadius={cornerRadius}
            listening={false}
        />
    );
}

export default function CanvasGrid({
                                       element, isSelected, onSelect, onChange, onDragMove, onDragEnd, isLocked,
                                       children,
                                   }) {
    const groupRef = useRef(null);
    const { selectedGridCell, setSelectedGridCell, mode } = useEditor();

    const isTableMode = element.gridMode === 'table';
    const isEditorMode = mode === 'editor';

    const totalCells = (element.rows || 1) * (element.cols || 1);
    const cells = [];
    for (let i = 0; i < totalCells; i++) {
        cells.push(getGridCellRect(element, i));
    }

    const handleCellClick = (e, cellIndex) => {
        e.cancelBubble = true;
        if (!isEditorMode || isTableMode) return;
        const row = Math.floor(cellIndex / (element.cols || 1));
        const col = cellIndex % (element.cols || 1);
        const key = `${row}_${col}`;
        const isSame = selectedGridCell?.gridId === element.id && selectedGridCell?.key === key;
        setSelectedGridCell(isSame ? null : { gridId: element.id, key, row, col });
    };

    const handleGroupClick = (e) => {
        if (isEditorMode && !isTableMode && groupRef.current) {
            const stage = groupRef.current.getStage();
            const pointer = stage.getPointerPosition();
            const transform = groupRef.current.getAbsoluteTransform().copy().invert();
            const local = transform.point(pointer);
            let hit = false;
            for (let i = 0; i < cells.length; i++) {
                const c = cells[i];
                if (local.x >= c.x && local.x <= c.x + c.width && local.y >= c.y && local.y <= c.y + c.height) {
                    handleCellClick(e, i);
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                setSelectedGridCell(null);
            }
        }
        onSelect(e);
    };

    const getCellFill = (i) => {
        if (isTableMode || !isEditorMode) {
            return element.cellFill !== 'transparent' ? element.cellFill : undefined;
        }
        const row = Math.floor(i / (element.cols || 1));
        const col = i % (element.cols || 1);
        const key = `${row}_${col}`;
        const isThisSelected = selectedGridCell?.gridId === element.id && selectedGridCell?.key === key;
        const cellTypes = element.cellTypes || {};
        const isInputCell = cellTypes[key] === 'input';
        if (isThisSelected) return '#ddd6fe';
        if (isInputCell) return '#eff6ff';
        return element.cellFill !== 'transparent' ? element.cellFill : undefined;
    };

    const getCellStroke = (i) => {
        if (isTableMode || !isEditorMode) {
            return element.cellStroke !== 'transparent' ? element.cellStroke : undefined;
        }
        const row = Math.floor(i / (element.cols || 1));
        const col = i % (element.cols || 1);
        const key = `${row}_${col}`;
        const isThisSelected = selectedGridCell?.gridId === element.id && selectedGridCell?.key === key;
        if (isThisSelected) return '#7c3aed';
        return element.cellStroke !== 'transparent' ? element.cellStroke : undefined;
    };

    const cellImages = element.cellImages || {};

    return (
        <Group
            ref={groupRef}
            id={element.id}
            x={element.x}
            y={element.y}
            rotation={element.rotation || 0}
            draggable={!isLocked}
            onClick={handleGroupClick}
            onTap={handleGroupClick}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onTransformEnd={(e) => {
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                node.scaleX(1);
                node.scaleY(1);
                onChange({
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(80, element.width * scaleX),
                    height: Math.max(80, element.height * scaleY),
                    rotation: node.rotation(),
                });
            }}
        >
            <Rect
                width={element.width}
                height={element.height}
                fill={element.bgFill !== 'transparent' ? element.bgFill : 'rgba(0,0,0,0.001)'}
                stroke={
                    isSelected && element.bgStroke === 'transparent'
                        ? '#4F6BF6'
                        : (element.bgStroke !== 'transparent' ? element.bgStroke : undefined)
                }
                strokeWidth={
                    isSelected && element.bgStroke === 'transparent'
                        ? 1
                        : element.bgStrokeWidth
                }
                dash={isSelected && element.bgStroke === 'transparent' ? [4, 4] : undefined}
                cornerRadius={element.bgCornerRadius}
                shadowEnabled={element.shadowEnabled}
                shadowColor={element.shadowColor}
                shadowBlur={element.shadowBlur}
                shadowOpacity={element.shadowOpacity}
            />

            {cells.map((cell, i) => {
                const row = Math.floor(i / (element.cols || 1));
                const col = i % (element.cols || 1);
                const key = `${row}_${col}`;
                const imgSrc = cellImages[key];
                return (
                    <Rect
                        key={`cell_${i}`}
                        x={cell.x}
                        y={cell.y}
                        width={cell.width}
                        height={cell.height}
                        fill={getCellFill(i)}
                        stroke={getCellStroke(i)}
                        strokeWidth={element.cellStrokeWidth}
                        dash={[6, 4]}
                        cornerRadius={element.cellCornerRadius}
                        listening={false}
                    />
                );
            })}

            {cells.map((cell, i) => {
                const row = Math.floor(i / (element.cols || 1));
                const col = i % (element.cols || 1);
                const key = `${row}_${col}`;
                const imgSrc = cellImages[key];
                if (!imgSrc) return null;
                const pad = 4;
                return (
                    <CellImage
                        key={`cellimg_${i}`}
                        src={imgSrc}
                        x={cell.x + pad}
                        y={cell.y + pad}
                        width={cell.width - pad * 2}
                        height={cell.height - pad * 2}
                        cornerRadius={element.cellCornerRadius}
                    />
                );
            })}

            {children}
        </Group>
    );
}