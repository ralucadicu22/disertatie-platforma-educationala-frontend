import { Group, Rect, Text } from 'react-konva';

export default function CanvasHotspot({
                                          element, isSelected, onSelect, onChange, onDragMove, onDragEnd, isLocked, isSolutionMode,
                                      }) {
    const isCorrect = isSolutionMode && element._isCorrect;

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
                fill={isCorrect ? 'rgba(34, 197, 94, 0.3)' : (element.fill || 'rgba(255, 200, 0, 0.25)')}
                stroke={isCorrect ? '#16a34a' : (isSelected ? '#4F6BF6' : (element.stroke || '#f59e0b'))}
                strokeWidth={isSelected ? 2 : (element.strokeWidth || 2)}
                dash={isSelected ? undefined : [6, 3]}
                cornerRadius={element.cornerRadius || 8}
            />
            <Text
                text={element.label || '🎯 Hotspot'}
                width={element.width}
                height={element.height}
                align="center"
                verticalAlign="middle"
                fontSize={12}
                fontStyle="bold"
                fill={isCorrect ? '#166534' : '#92400e'}
                listening={false}
            />
        </Group>
    );
}