import { useRef, useEffect } from 'react';
import { Group, Rect, Circle, Line, RegularPolygon } from 'react-konva';

export default function CanvasShape({ element, isSelected, onSelect, onChange, onDragMove, onDragEnd, isLocked }) {
    const groupRef = useRef(null);

    useEffect(() => {
        if (groupRef.current) {
            groupRef.current.getLayer()?.batchDraw();
        }
    }, [element]);

    const handleSelect = (e) => {
        e.cancelBubble = true;
        if (e.evt) e.evt.stopPropagation();
        onSelect(e);
    };

    const handleMouseDown = (e) => {
        e.cancelBubble = true;
        if (e.evt) e.evt.stopPropagation();
    };

    const commonProps = {
        fill: element.fill,
        stroke: element.stroke,
        strokeWidth: element.strokeWidth,
        shadowEnabled: element.shadowEnabled,
        shadowColor: element.shadowColor,
        shadowBlur: element.shadowBlur,
        shadowOpacity: element.shadowOpacity,
        opacity: element.opacity ?? 1,
        listening: false,
    };

    const renderShape = () => {
        switch (element.shapeType) {
            case 'circle':
                return <Circle {...commonProps} x={element.width / 2} y={element.height / 2} radius={Math.min(element.width, element.height) / 2} />;
            case 'line':
                return <Line {...commonProps} points={[0, element.height / 2, element.width, element.height / 2]} fill={undefined} stroke={element.fill} strokeWidth={Math.max(element.strokeWidth, 4)} />;
            case 'polygon':
                return <RegularPolygon {...commonProps} x={element.width / 2} y={element.height / 2} sides={6} radius={Math.min(element.width, element.height) / 2} />;
            case 'rect':
            default:
                return <Rect {...commonProps} width={element.width} height={element.height} cornerRadius={element.cornerRadius} />;
        }
    };

    return (
        <Group
            ref={groupRef}
            id={element.id}
            x={element.x}
            y={element.y}
            rotation={element.rotation || 0}
            draggable={!isLocked}
            onClick={handleSelect}
            onTap={handleSelect}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
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
                    width: Math.max(20, element.width * scaleX),
                    height: Math.max(20, element.height * scaleY),
                    rotation: node.rotation(),
                });
            }}
        >
            {renderShape()}

            <Rect
                width={element.width}
                height={element.height}
                fill="rgba(0,0,0,0.001)"
                listening={true}
            />
        </Group>
    );
}