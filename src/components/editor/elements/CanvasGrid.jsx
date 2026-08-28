import { useRef, useEffect } from 'react';
import { Group, Rect } from 'react-konva';
import { getGridCellRect } from '../../../utils/elementPosition';

export default function CanvasGrid({
                                       element, isSelected, onSelect, onChange, onDragMove, onDragEnd, isLocked,
                                       children,
                                   }) {
    const groupRef = useRef(null);

    useEffect(() => {
        if (groupRef.current) {
            groupRef.current.getLayer()?.batchDraw();
        }
    }, [element]);

    const totalCells = (element.rows || 1) * (element.cols || 1);
    const cells = [];
    for (let i = 0; i < totalCells; i++) {
        cells.push(getGridCellRect(element, i));
    }

    return (
        <Group
            ref={groupRef}
            id={element.id}
            x={element.x}
            y={element.y}
            rotation={element.rotation || 0}
            draggable={!isLocked}
            onClick={onSelect}
            onTap={onSelect}
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


            {cells.map((cell, i) => (
                <Rect
                    key={`cell_${i}`}
                    x={cell.x}
                    y={cell.y}
                    width={cell.width}
                    height={cell.height}
                    fill={element.cellFill !== 'transparent' ? element.cellFill : undefined}
                    stroke={element.cellStroke !== 'transparent' ? element.cellStroke : undefined}
                    strokeWidth={element.cellStrokeWidth}
                    dash={[6, 4]}
                    cornerRadius={element.cellCornerRadius}
                    listening={false}
                />
            ))}

            {children}
        </Group>
    );
}