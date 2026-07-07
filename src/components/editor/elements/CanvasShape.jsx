import { useRef, useEffect } from 'react';
import { Group, Rect, Circle, Line, RegularPolygon, Text } from 'react-konva';

export default function CanvasShape({ element, isSelected, onSelect, onChange, onDragMove, onDragEnd,isLocked }) {
    const shapeRef = useRef(null);

    useEffect(() => {
        if (shapeRef.current) {
            shapeRef.current.getLayer()?.batchDraw();
        }
    }, [element]);

    const commonProps = {
        ref: shapeRef,
        fill: element.fill,
        stroke: element.stroke,
        strokeWidth: element.strokeWidth,
        shadowEnabled: element.shadowEnabled,
        shadowColor: element.shadowColor,
        shadowBlur: element.shadowBlur,
        shadowOpacity: element.shadowOpacity,
        opacity: element.opacity,
        listening: false,
    };

    const renderShape = () => {
        switch (element.shapeType) {
            case 'circle':
                return (
                    <Circle
                        {...commonProps}
                        x={element.width / 2}
                        y={element.height / 2}
                        radius={Math.min(element.width, element.height) / 2}
                    />
                );

            case 'line':
                return (
                    <Line
                        {...commonProps}
                        points={[0, element.height / 2, element.width, element.height / 2]}
                        fill={undefined}
                        stroke={element.fill}
                        strokeWidth={Math.max(element.strokeWidth, 4)}
                    />
                );

            case 'polygon':
                return (
                    <RegularPolygon
                        {...commonProps}
                        x={element.width / 2}
                        y={element.height / 2}
                        sides={6}
                        radius={Math.min(element.width, element.height) / 2}
                    />
                );

            case 'rect':
            default:
                return (
                    <Rect
                        {...commonProps}
                        width={element.width}
                        height={element.height}
                        cornerRadius={element.cornerRadius}
                    />
                );
        }
    };

    return (
        <Group
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
                    width: Math.max(20, element.width * scaleX),
                    height: Math.max(20, element.height * scaleY),
                    rotation: node.rotation(),
                });
            }}
        >

            <Rect
                width={element.width}
                height={element.height}
                fill="rgba(0,0,0,0.001)"
            />


            {isSelected && element.strokeWidth === 0 && (
                <Rect
                    width={element.width}
                    height={element.height}
                    stroke="#4F6BF6"
                    strokeWidth={1}
                    dash={[4, 4]}
                    listening={false}
                />
            )}

            {renderShape()}

            {/* Indicator vizual pentru comportament special */}
            {element.behavior !== 'static' && (
                <Text
                    text={getBehaviorIcon(element.behavior)}
                    x={4}
                    y={4}
                    fontSize={12}
                    fontFamily="Nunito"
                    fontStyle="bold"
                    fill="#1a1d23"
                    listening={false}
                />
            )}
        </Group>
    );
}

function getBehaviorIcon(behavior) {
    switch (behavior) {
        case 'clickZone': return '👆';
        case 'dropTarget': return '⊕';
        case 'hotspot': return '⊙';
        case 'colorZone': return '🎨';
        default: return '';
    }
}